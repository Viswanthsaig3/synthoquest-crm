'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
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
import { getDepartments } from '@/lib/api/departments'
import { getAssignableUsers, type AssignableUser } from '@/lib/api/employees'
import { ArrowLeft, Save, Loader2, Eye, EyeOff, UserPlus } from 'lucide-react'
import Link from 'next/link'
import { createIntern } from '@/lib/api/interns'
import { useAuth } from '@/context/auth-context'
import { PermissionGuard } from '@/components/shared'
import { canManageAllInterns } from '@/lib/permissions'
import { getErrorMessage } from '@/lib/utils'
import { INTERNSHIP_DURATIONS, INTERNSHIP_TYPES, INTERN_SOURCES } from '@/lib/constants'

const createInternSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().min(1, 'Phone is required'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain an uppercase letter')
    .regex(/[a-z]/, 'Password must contain a lowercase letter')
    .regex(/[0-9]/, 'Password must contain a number')
    .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Password must contain a special character'),
  department: z.string().min(1, 'Department is required'),
  managedBy: z.string().optional().nullable(),
  internshipType: z.enum(['paid', 'unpaid']),
  duration: z.enum(['1_month', '2_months', '3_months']),
  college: z.string().min(1, 'College is required'),
  degree: z.string().min(1, 'Degree is required'),
  year: z.string().min(1, 'Year is required'),
  skills: z.string().optional(),
  startDate: z.string().optional(),
  source: z.string().optional(),
  stipend: z.coerce.number().min(0).optional().nullable(),
  notes: z.string().optional(),
})

type CreateInternFormData = z.infer<typeof createInternSchema>

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

export default function NewInternPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { user } = useAuth()
  const [loadingOptions, setLoadingOptions] = useState(true)
  const [managers, setManagers] = useState<AssignableUser[]>([])
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateInternFormData>({
    resolver: zodResolver(createInternSchema),
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
      source: 'website',
      stipend: null,
      notes: '',
    },
  })

  const internshipType = watch('internshipType')
  const password = watch('password')

  useEffect(() => {
    async function loadOptions() {
      try {
        setLoadingOptions(true)
        const managersRes = await getAssignableUsers()
        setManagers(managersRes.data || [])
      } catch (error: unknown) {
        toast({
          title: 'Error',
          description: getErrorMessage(error, 'Failed to load form options'),
          variant: 'destructive',
        })
      } finally {
        setLoadingOptions(false)
      }
    }

    if (user) {
      loadOptions()
    }
  }, [toast, user])

  const passwordChecks = [
    { label: 'At least 8 characters', ok: password?.length >= 8 },
    { label: 'At least 1 uppercase letter', ok: /[A-Z]/.test(password || '') },
    { label: 'At least 1 lowercase letter', ok: /[a-z]/.test(password || '') },
    { label: 'At least 1 number', ok: /[0-9]/.test(password || '') },
    { label: 'At least 1 special character', ok: /[!@#$%^&*(),.?":{}|<>]/.test(password || '') },
  ]

  const onSubmit = async (data: CreateInternFormData) => {
    try {
      await createIntern({
        email: data.email,
        password: data.password,
        name: data.name,
        phone: data.phone,
        department: data.department,
        managedBy: data.managedBy || null,
        compensationType: data.internshipType,
        compensationAmount: data.internshipType === 'paid' ? data.stipend || null : null,
        profile: {
          internshipType: data.internshipType,
          duration: data.duration,
          college: data.college,
          degree: data.degree,
          year: data.year,
          skills: data.skills ? data.skills.split(',').map(s => s.trim()).filter(Boolean) : [],
          startDate: data.startDate || undefined,
          source: data.source || 'website',
          stipend: data.internshipType === 'paid' ? data.stipend || undefined : undefined,
          notes: data.notes || undefined,
          status: 'active',
          approvalStatus: 'approved',
        },
      })

      toast({
        title: 'Intern created',
        description: `${data.name} has been added successfully.`,
      })

      router.push('/interns')
    } catch (error: unknown) {
      toast({
        title: 'Error',
        description: getErrorMessage(error, 'Failed to create intern'),
        variant: 'destructive',
      })
    }
  }

  return (
    <PermissionGuard check={canManageAllInterns}>
      <div className="space-y-6 max-w-3xl">
        <Breadcrumb />

        <div className="flex items-center gap-4">
          <Link href="/interns">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <UserPlus className="h-6 w-6" />
              Add New Intern
            </h1>
            <p className="text-muted-foreground">Enter intern details below</p>
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
                  <Input id="name" {...register('name')} placeholder="John Doe" />
                  {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input id="email" type="email" {...register('email')} placeholder="john@example.com" />
                  {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone *</Label>
                  <Input id="phone" {...register('phone')} placeholder="+91 98765 43210" />
                  {errors.phone && <p className="text-sm text-red-500">{errors.phone.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <div className="relative">
                    <Input id="password" type={showPassword ? 'text' : 'password'} {...register('password')} />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
                </div>
              </div>

              {password && (
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
                  <Select id="department" {...register('department')} disabled={loadingOptions}>
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
                  <Select id="managedBy" {...register('managedBy')} disabled={loadingOptions}>
                    <option value="">Not assigned</option>
                    {managers.map((manager) => (
                      <option key={manager.id} value={manager.id}>
                        {manager.name} ({manager.role})
                      </option>
                    ))}
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Select a team lead or employee to mentor this intern
                  </p>
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
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input id="startDate" type="date" {...register('startDate')} />
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
                    <Input id="stipend" type="number" step="1000" {...register('stipend')} placeholder="₹ amount" />
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
                <Input id="college" {...register('college')} placeholder="Indian Institute of Technology" />
                {errors.college && <p className="text-sm text-red-500">{errors.college.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="degree">Degree/Program *</Label>
                  <Input id="degree" {...register('degree')} placeholder="B.Tech Computer Science" />
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
            <Link href="/interns">
              <Button variant="outline" type="button">
                Cancel
              </Button>
            </Link>
            <Button type="submit" disabled={isSubmitting || loadingOptions}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Create Intern
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </PermissionGuard>
  )
}