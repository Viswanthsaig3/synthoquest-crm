'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Breadcrumb } from '@/components/layout/breadcrumb'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { useToast } from '@/components/ui/toast'
import { ArrowLeft, Save, Loader2, Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'
import { getInternById, updateIntern } from '@/lib/api/interns'
import { getAssignableUsers, type AssignableUser } from '@/lib/api/employees'
import { useAuth } from '@/context/auth-context'
import { PermissionGuard } from '@/components/shared'
import { canManageAllInterns, canManageAssignedInterns } from '@/lib/permissions'
import { getErrorMessage } from '@/lib/utils'
import { INTERNSHIP_DURATIONS, INTERNSHIP_TYPES, INTERN_SOURCES } from '@/lib/constants'
import PaymentHistoryCard from '@/components/interns/payment-history-card'

const editInternSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().min(1, 'Phone is required'),
  password: z.string().min(8, 'Password must be at least 8 characters').optional().or(z.literal('')),
  department: z.string().min(1, 'Department is required'),
  managedBy: z.string().optional().nullable(),
  internshipType: z.enum(['paid', 'unpaid', 'paid_by_student']),
  duration: z.enum([
    '1_month', '2_months', '3_months', '4_months', '5_months', '6_months',
    '7_months', '8_months', '9_months', '10_months', '11_months', '12_months'
  ]),
  college: z.string().min(1, 'College is required'),
  degree: z.string().min(1, 'Degree is required'),
  year: z.string().min(1, 'Year is required'),
  skills: z.string().optional(),
  startDate: z.string().optional(),
  expectedEndDate: z.string().optional(),
  status: z.enum(['applied', 'shortlisted', 'offered', 'active', 'completed', 'dropped', 'rejected']),
  source: z.string().optional(),
  stipend: z.coerce.number().min(0).optional().nullable(),
  totalFee: z.coerce.number().min(0).optional().nullable(),
  notes: z.string().optional(),
})

type EditInternFormData = z.infer<typeof editInternSchema>

const DEPARTMENT_OPTIONS = [
  { key: 'training', name: 'Training' },
  { key: 'sales', name: 'Sales' },
  { key: 'marketing', name: 'Marketing' },
  { key: 'content', name: 'Content Development' },
]

const YEAR_OPTIONS = [
  { value: '1st', label: '1st Year' },
  { value: '2nd', label: '2nd Year' },
  { value: '3rd', label: '3rd Year' },
  { value: '4th', label: '4th Year' },
  { value: 'graduate', label: 'Graduate' },
]

const STATUS_OPTIONS = [
  { value: 'applied', label: 'Applied' },
  { value: 'shortlisted', label: 'Shortlisted' },
  { value: 'offered', label: 'Offered' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'dropped', label: 'Dropped' },
  { value: 'rejected', label: 'Rejected' },
]

export default function EditInternPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const { user: currentUser } = useAuth()
  const internId = params.id as string

  const [loading, setLoading] = useState(true)
  const [managers, setManagers] = useState<AssignableUser[]>([])
  const [internManagedBy, setInternManagedBy] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [internData, setInternData] = useState<{ compensationType?: string; remainingBalance?: number } | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<EditInternFormData>({
    resolver: zodResolver(editInternSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      password: '',
      department: 'training',
      managedBy: null,
      internshipType: 'unpaid',
      duration: '3_months',
      college: '',
      degree: '',
      year: '',
      skills: '',
      startDate: '',
      expectedEndDate: '',
      status: 'applied',
      source: 'website',
      stipend: null,
      totalFee: null,
      notes: '',
    },
  })

  const internshipType = watch('internshipType')
  const password = watch('password')

  useEffect(() => {
    async function fetchIntern() {
      try {
        setLoading(true)
        const res = await getInternById(internId)
        const intern = res.data

        setValue('name', intern.name)
        setValue('email', intern.email)
        setValue('phone', intern.phone || '')
        setValue('department', intern.department)
        setValue('managedBy', intern.managedBy || '')
        setValue('internshipType', intern.internshipType)
        setValue('duration', intern.duration)
        setValue('college', intern.college)
        setValue('degree', intern.degree)
        setValue('year', intern.year)
        setValue('skills', intern.skills?.join(', ') || '')
        setValue('startDate', intern.startDate ? new Date(intern.startDate).toISOString().split('T')[0] : '')
        setValue('expectedEndDate', intern.expectedEndDate ? new Date(intern.expectedEndDate).toISOString().split('T')[0] : '')
        setValue('status', intern.status)
        setValue('source', intern.source)
        setValue('stipend', intern.stipend || null)
        setValue('totalFee', intern.totalFee || null)
        setValue('notes', intern.notes || '')

        setInternManagedBy(intern.managedBy || null)
        setInternData({
          compensationType: intern.compensationType,
          remainingBalance: intern.remainingBalance,
        })
      } catch (error: unknown) {
        toast({
          title: 'Error',
          description: getErrorMessage(error, 'Failed to load intern'),
          variant: 'destructive',
        })
        router.push('/interns')
      } finally {
        setLoading(false)
      }
    }

    fetchIntern()
  }, [internId, router, setValue, toast])

  useEffect(() => {
    async function loadOptions() {
      try {
        const managersRes = await getAssignableUsers()
        setManagers(managersRes.data || [])
      } catch (error) {
        console.error('Failed to load edit form options:', error)
      }
    }

    loadOptions()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6 max-w-3xl">
        <Breadcrumb />
        <Card>
          <CardContent className="py-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
            <p className="text-muted-foreground mt-4">Loading intern data...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const canManageAll = !!currentUser && canManageAllInterns(currentUser)
  const canManageAssigned =
    !!currentUser && canManageAssignedInterns(currentUser) && internManagedBy === currentUser.id

  if (!canManageAll && !canManageAssigned) {
    return (
      <div className="space-y-6 max-w-3xl">
        <Breadcrumb />
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">You do not have permission to edit this intern.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const onSubmit = async (data: EditInternFormData) => {
    try {
      await updateIntern(internId, {
        name: data.name,
        email: data.email,
        phone: data.phone,
        department: data.department,
        managedBy: data.managedBy || null,
        password: data.password && data.password.length >= 8 ? data.password : undefined,
        profile: {
          internshipType: data.internshipType,
          duration: data.duration,
          college: data.college,
          degree: data.degree,
          year: data.year,
          skills: data.skills ? data.skills.split(',').map(s => s.trim()).filter(Boolean) : [],
          startDate: data.startDate || undefined,
          expectedEndDate: data.expectedEndDate || undefined,
          status: data.status,
          source: data.source || 'website',
          stipend: data.internshipType === 'paid' ? data.stipend || undefined : undefined,
          totalFee: data.internshipType === 'paid_by_student' ? data.totalFee || undefined : undefined,
          notes: data.notes || undefined,
        },
      })

      toast({
        title: 'Intern updated',
        description: `${data.name} has been updated successfully.`,
      })

      router.push(`/interns/${internId}`)
    } catch (error: unknown) {
      toast({
        title: 'Error',
        description: getErrorMessage(error, 'Failed to update intern'),
        variant: 'destructive',
      })
    }
  }

  const passwordChecks = [
    { label: 'At least 8 characters', ok: (password?.length ?? 0) >= 8 },
    { label: 'At least 1 uppercase letter', ok: /[A-Z]/.test(password || '') },
    { label: 'At least 1 lowercase letter', ok: /[a-z]/.test(password || '') },
    { label: 'At least 1 number', ok: /[0-9]/.test(password || '') },
    { label: 'At least 1 special character', ok: /[!@#$%^&*(),.?":{}|<>]/.test(password || '') },
  ]

  return (
    <PermissionGuard check={canManageAllInterns}>
      <div className="space-y-6 max-w-3xl">
        <Breadcrumb />

        <div className="flex items-center gap-4">
          <Link href={`/interns/${internId}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Edit Intern</h1>
            <p className="text-muted-foreground">Update intern details</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Basic details and login credentials</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input id="name" {...register('name')} />
                  {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input id="email" type="email" {...register('email')} disabled={!canManageAll} />
                  {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
                  {!canManageAll && (
                    <p className="text-xs text-muted-foreground">Only admin/HR can change email</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone *</Label>
                  <Input id="phone" {...register('phone')} />
                  {errors.phone && <p className="text-sm text-red-500">{errors.phone.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">New Password (optional)</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      {...register('password')}
                      placeholder="Leave blank to keep current"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={!canManageAll}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  {!canManageAll && (
                    <p className="text-xs text-muted-foreground">Only admin/HR can change password</p>
                  )}
                </div>
              </div>

              {password && password.length > 0 && canManageAll && (
                <div className="text-sm space-y-1 bg-muted p-3 rounded-lg">
                  <p className="font-medium mb-2">Password requirements:</p>
                  {passwordChecks.map((check) => (
                    <p key={check.label} className={check.ok ? 'text-green-600' : 'text-muted-foreground'}>
                      {check.ok ? '✓' : '○'} {check.label}
                    </p>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Internship Details</CardTitle>
              <CardDescription>Department, duration, and assignment</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="department">Department *</Label>
                  <Select id="department" {...register('department')} disabled={!canManageAll}>
                    {DEPARTMENT_OPTIONS.map((dept) => (
                      <option key={dept.key} value={dept.key}>
                        {dept.name}
                      </option>
                    ))}
                  </Select>
                  {errors.department && <p className="text-sm text-red-500">{errors.department.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="managedBy">Assign to Manager/Mentor</Label>
                  <Select id="managedBy" {...register('managedBy')} disabled={!canManageAll}>
                    <option value="">Not assigned</option>
                    {managers.map((manager) => (
                      <option key={manager.id} value={manager.id}>
                        {manager.name} ({manager.role})
                      </option>
                    ))}
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="internshipType">Internship Type *</Label>
                  <Select id="internshipType" {...register('internshipType')}>
                    {INTERNSHIP_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration *</Label>
                  <Select id="duration" {...register('duration')}>
                    {INTERNSHIP_DURATIONS.map((dur) => (
                      <option key={dur.value} value={dur.value}>
                        {dur.label}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select id="status" {...register('status')}>
                    {STATUS_OPTIONS.map((st) => (
                      <option key={st.value} value={st.value}>
                        {st.label}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input id="startDate" type="date" {...register('startDate')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expectedEndDate">Expected End Date</Label>
                  <Input id="expectedEndDate" type="date" {...register('expectedEndDate')} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="source">Source</Label>
                  <Select id="source" {...register('source')}>
                    {INTERN_SOURCES.map((src) => (
                      <option key={src.value} value={src.value}>
                        {src.label}
                      </option>
                    ))}
                  </Select>
                </div>
                {internshipType === 'paid' && (
                  <div className="space-y-2">
                    <Label htmlFor="stipend">Stipend Amount</Label>
                    <Input id="stipend" type="number" step="1000" {...register('stipend')} placeholder="₹ amount paid to intern" />
                    <p className="text-xs text-muted-foreground">Monthly stipend paid to intern</p>
                  </div>
                )}
                {internshipType === 'paid_by_student' && (
                  <div className="space-y-2">
                    <Label htmlFor="totalFee">Total Fee</Label>
                    <Input id="totalFee" type="number" step="1000" {...register('totalFee')} placeholder="₹ total fee expected" />
                    <p className="text-xs text-muted-foreground">Total fee expected from student</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Education Details</CardTitle>
              <CardDescription>Academic background</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="college">College/University *</Label>
                <Input id="college" {...register('college')} />
                {errors.college && <p className="text-sm text-red-500">{errors.college.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="degree">Degree/Program *</Label>
                  <Input id="degree" {...register('degree')} />
                  {errors.degree && <p className="text-sm text-red-500">{errors.degree.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="year">Year *</Label>
                  <Select id="year" {...register('year')}>
                    <option value="">Select year</option>
                    {YEAR_OPTIONS.map((yr) => (
                      <option key={yr.value} value={yr.value}>
                        {yr.label}
                      </option>
                    ))}
                  </Select>
                  {errors.year && <p className="text-sm text-red-500">{errors.year.message}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="skills">Skills (comma separated)</Label>
                <Input id="skills" {...register('skills')} placeholder="Python, JavaScript, React, Machine Learning" />
              </div>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Additional Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <textarea
                id="notes"
                {...register('notes')}
                rows={3}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="Any additional notes about this intern..."
              />
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4 mt-6">
            <Link href={`/interns/${internId}`}>
              <Button variant="outline" type="button">
                Cancel
              </Button>
            </Link>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>

        {internshipType === 'paid_by_student' && (
          <PaymentHistoryCard internId={internId} />
        )}
      </div>
    </PermissionGuard>
  )
}