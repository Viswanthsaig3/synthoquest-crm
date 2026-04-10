'use client'

import React, { useEffect, useMemo, useState } from 'react'
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
import { ArrowLeft, Save, Loader2, Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'
import { createEmployee } from '@/lib/api/employees'
import { getRoles } from '@/lib/api/roles'
import { useAuth } from '@/context/auth-context'
import { PermissionGuard } from '@/components/shared'
import { canManageEmployees } from '@/lib/permissions'
import { getErrorMessage } from '@/lib/utils'

const createEmployeeSchema = z
  .object({
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
    role: z.string().min(1, 'Role is required'),
    compensationType: z.enum(['paid', 'unpaid']),
    compensationAmount: z.coerce.number().min(0, 'Compensation amount must be 0 or greater').nullable().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.compensationType === 'paid' && (value.compensationAmount === null || value.compensationAmount === undefined)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['compensationAmount'],
        message: 'Compensation amount is required for paid employees',
      })
    }
  })

type CreateEmployeeFormData = z.infer<typeof createEmployeeSchema>

export default function NewEmployeePage() {
  const router = useRouter()
  const { toast } = useToast()
  const { user } = useAuth()
  const [loadingOptions, setLoadingOptions] = useState(true)
  const [roles, setRoles] = useState<Array<{ key: string; name: string }>>([])
  const [departments, setDepartments] = useState<Array<{ key: string; name: string }>>([])
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateEmployeeFormData>({
    resolver: zodResolver(createEmployeeSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      password: '',
      department: '',
      role: '',
      compensationType: 'unpaid',
      compensationAmount: null,
    },
  })

  const compensationType = watch('compensationType')
  const password = watch('password')

  useEffect(() => {
    async function loadOptions() {
      try {
        setLoadingOptions(true)
        const [rolesRes, departmentsRes] = await Promise.all([getRoles(), getDepartments()])
        const loadedRoles = rolesRes.data || []
        const loadedDepartments = (departmentsRes.data || []).map((d) => ({ key: d.key, name: d.name }))

        setRoles(loadedRoles)
        setDepartments(loadedDepartments)

        if (loadedRoles.length > 0) {
          setValue('role', loadedRoles[0].key)
        }
        if (loadedDepartments.length > 0) {
          setValue('department', loadedDepartments[0].key)
        }
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
  }, [setValue, toast, user])

  const passwordChecks = useMemo(
    () => [
      { label: 'At least 8 characters', ok: password.length >= 8 },
      { label: 'At least 1 uppercase letter', ok: /[A-Z]/.test(password) },
      { label: 'At least 1 lowercase letter', ok: /[a-z]/.test(password) },
      { label: 'At least 1 number', ok: /[0-9]/.test(password) },
      { label: 'At least 1 special character', ok: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
    ],
    [password]
  )

  const onSubmit = async (data: CreateEmployeeFormData) => {
    try {
      await createEmployee({
        email: data.email,
        name: data.name,
        password: data.password,
        phone: data.phone,
        department: data.department,
        role: data.role,
        compensationType: data.compensationType,
        compensationAmount: data.compensationType === 'paid' ? data.compensationAmount ?? null : null,
        salary: data.compensationType === 'paid' ? data.compensationAmount ?? undefined : undefined,
      })

      toast({
        title: 'Employee created',
        description: `${data.name} has been added successfully.`,
      })

      router.push('/employees')
    } catch (error: unknown) {
      toast({
        title: 'Error',
        description: getErrorMessage(error, 'Failed to create employee'),
        variant: 'destructive',
      })
    }
  }

  return (
    <PermissionGuard check={canManageEmployees}>
      <div className="space-y-6 max-w-2xl">
        <Breadcrumb />

        <div className="flex items-center gap-4">
          <Link href="/employees">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Add New Employee</h1>
            <p className="text-muted-foreground">Enter employee details below</p>
          </div>
        </div>

        <Card>
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Basic details about the employee</CardDescription>
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
                  <Input id="email" type="email" {...register('email')} />
                  {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone *</Label>
                <Input id="phone" {...register('phone')} />
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
                {password ? (
                  <div className="text-sm space-y-1 pt-2">
                    {passwordChecks.map((check) => (
                      <p key={check.label} className={check.ok ? 'text-green-600' : 'text-muted-foreground'}>
                        {check.label}
                      </p>
                    ))}
                  </div>
                ) : null}
              </div>
            </CardContent>

            <CardHeader>
              <CardTitle>Work Details</CardTitle>
              <CardDescription>Department, role, and compensation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="department">Department *</Label>
                  <Select id="department" {...register('department')} disabled={loadingOptions}>
                    {departments.map((dept) => (
                      <option key={dept.key} value={dept.key}>
                        {dept.name}
                      </option>
                    ))}
                  </Select>
                  {errors.department && <p className="text-sm text-red-500">{errors.department.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role *</Label>
                  <Select id="role" {...register('role')} disabled={loadingOptions}>
                    {roles.map((role) => (
                      <option key={role.key} value={role.key}>
                        {role.name}
                      </option>
                    ))}
                  </Select>
                  {errors.role && <p className="text-sm text-red-500">{errors.role.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="compensationType">Compensation Type *</Label>
                  <Select id="compensationType" {...register('compensationType')}>
                    <option value="unpaid">Unpaid</option>
                    <option value="paid">Paid</option>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="compensationAmount">Compensation Amount</Label>
                  <Input
                    id="compensationAmount"
                    type="number"
                    step="0.01"
                    disabled={compensationType !== 'paid'}
                    {...register('compensationAmount')}
                    placeholder="Enter amount"
                  />
                  {errors.compensationAmount && (
                    <p className="text-sm text-red-500">{errors.compensationAmount.message}</p>
                  )}
                </div>
              </div>
            </CardContent>

            <div className="flex justify-end gap-4 p-6 pt-0">
              <Link href="/employees">
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
                    Create Employee
                  </>
                )}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </PermissionGuard>
  )
}
