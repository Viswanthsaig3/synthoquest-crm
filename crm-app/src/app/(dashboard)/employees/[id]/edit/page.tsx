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
import { getDepartments } from '@/lib/api/departments'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { getEmployeeById, updateEmployee, updateEmployeeCompensation } from '@/lib/api/employees'
import { getRoles } from '@/lib/api/roles'
import { useAuth } from '@/context/auth-context'
import { getErrorMessage } from '@/lib/utils'
import {
  canManageAssignedEmployees,
  canManageCompensation,
  canManageEmployees,
} from '@/lib/permissions'

const editEmployeeSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().optional(),
  department: z.string().min(1, 'Department is required'),
  role: z.string().optional(),
  status: z.enum(['active', 'inactive', 'suspended']),
  compensationType: z.enum(['paid', 'unpaid']),
  compensationAmount: z.coerce.number().min(0).nullable().optional(),
})

type EditEmployeeFormData = z.infer<typeof editEmployeeSchema>

export default function EditEmployeePage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const { user: currentUser } = useAuth()
  const employeeId = params.id as string

  const [loading, setLoading] = useState(true)
  const [roles, setRoles] = useState<Array<{ key: string; name: string }>>([])
  const [departments, setDepartments] = useState<Array<{ key: string; name: string }>>([])
  const [employeeManagedBy, setEmployeeManagedBy] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<EditEmployeeFormData>({
    resolver: zodResolver(editEmployeeSchema),
    defaultValues: {
      name: '',
      phone: '',
      department: 'sales',
      role: '',
      status: 'active',
      compensationType: 'unpaid',
      compensationAmount: null,
    },
  })

  const compensationType = watch('compensationType')

  useEffect(() => {
    async function fetchEmployee() {
      try {
        setLoading(true)
        const res = await getEmployeeById(employeeId)
        const emp = res.data

        setValue('name', emp.name)
        setValue('phone', emp.phone || '')
        setValue('department', emp.department)
        setValue('role', emp.role)
        setValue('status', emp.status)
        setValue('compensationType', emp.compensationType || (emp.salary && emp.salary > 0 ? 'paid' : 'unpaid'))
        setValue('compensationAmount', emp.compensationAmount ?? emp.salary ?? null)

        setEmployeeManagedBy(emp.managedBy || null)
      } catch (error: unknown) {
        toast({
          title: 'Error',
          description: getErrorMessage(error, 'Failed to load employee'),
          variant: 'destructive',
        })
        router.push('/employees')
      } finally {
        setLoading(false)
      }
    }

    fetchEmployee()
  }, [employeeId, router, setValue, toast])

  useEffect(() => {
    async function loadOptions() {
      try {
        const [rolesRes, departmentsRes] = await Promise.all([getRoles(), getDepartments()])
        setRoles(rolesRes.data || [])
        setDepartments((departmentsRes.data || []).map((d) => ({ key: d.key, name: d.name })))
      } catch (error) {
        console.error('Failed to load edit form options:', error)
      }
    }

    loadOptions()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6 max-w-2xl">
        <Breadcrumb />
        <Card>
          <CardContent className="py-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
            <p className="text-muted-foreground mt-4">Loading employee data...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const canManageAll = !!currentUser && canManageEmployees(currentUser)
  const canManageAssigned =
    !!currentUser && canManageAssignedEmployees(currentUser) && employeeManagedBy === currentUser.id
  const canEditCompensation = !!currentUser && canManageCompensation(currentUser)

  if (!canManageAll && !canManageAssigned) {
    return (
      <div className="space-y-6 max-w-2xl">
        <Breadcrumb />
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">You do not have permission to edit this employee.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const onSubmit = async (data: EditEmployeeFormData) => {
    try {
      await updateEmployee(employeeId, {
        name: data.name,
        phone: data.phone || '',
        department: data.department,
        status: data.status,
        role: canManageAll ? data.role : undefined,
      })

      if (canEditCompensation) {
        await updateEmployeeCompensation(employeeId, {
          compensationType: data.compensationType,
          compensationAmount: data.compensationType === 'paid' ? data.compensationAmount ?? 0 : null,
          reason: 'Updated from employee edit form',
        })
      }

      toast({
        title: 'Employee updated',
        description: `${data.name} has been updated successfully.`,
      })

      router.push(`/employees/${employeeId}`)
    } catch (error: unknown) {
      toast({
        title: 'Error',
        description: getErrorMessage(error, 'Failed to update employee'),
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <Breadcrumb />

      <div className="flex items-center gap-4">
        <Link href={`/employees/${employeeId}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Edit Employee</h1>
          <p className="text-muted-foreground">Update employee details</p>
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
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" {...register('phone')} />
                {errors.phone && <p className="text-sm text-red-500">{errors.phone.message}</p>}
              </div>
            </div>
          </CardContent>

          <CardHeader>
            <CardTitle>Work Details</CardTitle>
            <CardDescription>Department, role, status and compensation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Select id="department" {...register('department')}>
                  {departments.map((dept) => (
                    <option key={dept.key} value={dept.key}>
                      {dept.name}
                    </option>
                  ))}
                </Select>
                {errors.department && <p className="text-sm text-red-500">{errors.department.message}</p>}
              </div>

              {canManageAll && (
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select id="role" {...register('role')}>
                    {roles.map((role) => (
                      <option key={role.key} value={role.key}>
                        {role.name}
                      </option>
                    ))}
                  </Select>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select id="status" {...register('status')}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="compensationType">Compensation Type</Label>
                <Select id="compensationType" {...register('compensationType')} disabled={!canEditCompensation}>
                  <option value="unpaid">Unpaid</option>
                  <option value="paid">Paid</option>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="compensationAmount">Compensation Amount</Label>
              <Input
                id="compensationAmount"
                type="number"
                step="0.01"
                placeholder="Enter amount"
                disabled={!canEditCompensation || compensationType !== 'paid'}
                {...register('compensationAmount')}
              />
              {errors.compensationAmount && (
                <p className="text-sm text-red-500">{errors.compensationAmount.message}</p>
              )}
            </div>
          </CardContent>

          <div className="flex justify-end gap-4 p-6 pt-0">
            <Link href={`/employees/${employeeId}`}>
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
      </Card>
    </div>
  )
}
