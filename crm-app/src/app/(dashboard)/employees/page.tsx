'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/context/auth-context'
import { Breadcrumb } from '@/components/layout/breadcrumb'
import { PageHeader, StatusBadge, EmptyState, TableSkeleton, PermissionGuard } from '@/components/shared'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { getEmployees } from '@/lib/api/employees'
import { getRoles } from '@/lib/api/roles'
import { getDepartments } from '@/lib/api/departments'
import { formatDate, getInitials, getErrorMessage } from '@/lib/utils'
import { canViewEmployees, canManageEmployees, canManageAssignedEmployees } from '@/lib/permissions'
import { Users, Eye, Edit, Mail, Phone, Calendar, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/components/ui/toast'
import type { User } from '@/types/user'

export default function EmployeesPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [search, setSearch] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [employees, setEmployees] = useState<User[]>([])
  const [roleOptions, setRoleOptions] = useState<Array<{ value: string; label: string }>>([])
  const [departmentOptions, setDepartmentOptions] = useState<Array<{ value: string; label: string }>>([])
  const [total, setTotal] = useState(0)

  useEffect(() => {
    if (user) {
      fetchEmployees()
    }
  }, [user, search, departmentFilter, roleFilter])

  useEffect(() => {
    async function loadRoles() {
      try {
        const response = await getRoles()
        setRoleOptions(
          (response.data || []).map((role) => ({
            value: role.key,
            label: role.name,
          }))
        )
      } catch (error) {
        console.error('Error fetching roles:', error)
      }
    }
    async function loadDepartments() {
      try {
        const response = await getDepartments()
        setDepartmentOptions(
          (response.data || []).map((d) => ({
            value: d.key,
            label: d.name,
          }))
        )
      } catch (error) {
        console.error('Error fetching departments:', error)
      }
    }
    if (user) {
      loadRoles()
      loadDepartments()
    }
  }, [user])

  const fetchEmployees = async () => {
    try {
      setLoading(true)
      const response = await getEmployees({
        search: search || undefined,
        department: departmentFilter || undefined,
        role: roleFilter || undefined,
        limit: 100
      })
      setEmployees(response.data || [])
      setTotal(response.pagination?.total || 0)
    } catch (error: unknown) {
      console.error('Error fetching employees:', error)
      toast({
        title: 'Error',
        description: getErrorMessage(error, 'Failed to load employees'),
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  if (!user) return null

  const canAdd = canManageEmployees(user)
  const canManageAssigned = canManageAssignedEmployees(user)

  return (
    <PermissionGuard check={canViewEmployees} fallbackMessage="You don't have permission to view employees.">
      <div className="space-y-6">
        <Breadcrumb />
        
        <PageHeader
          title="Employees"
          description={`${total} employees found`}
          action={canAdd ? { label: 'Add Employee', href: '/employees/new' } : undefined}
          search={{ placeholder: 'Search employees...', value: search, onChange: setSearch }}
          filters={[
            { options: departmentOptions, value: departmentFilter, onChange: setDepartmentFilter, placeholder: 'All Departments' },
            { options: roleOptions, value: roleFilter, onChange: setRoleFilter, placeholder: 'All Roles' },
          ]}
          exportData
        />

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : employees.length === 0 ? (
              <EmptyState
                icon={Users}
                title="No employees found"
                description="Add your first employee to get started."
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Join Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employees.map((employee) => (
                    <TableRow key={employee.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={employee.avatar || undefined} />
                            <AvatarFallback>{getInitials(employee.name)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{employee.name}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-sm">
                            <Mail className="h-3 w-3" />
                            {employee.email}
                          </div>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            {employee.phone}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {employee.department}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className="capitalize">
                          {employee.role.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={employee.status} />
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {employee.joinDate ? formatDate(new Date(employee.joinDate)) : 'N/A'}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/employees/${employee.id}`}>
                            <Button variant="ghost" size="icon">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          {(canAdd || (canManageAssigned && employee.managedBy === user.id)) && (
                            <Link href={`/employees/${employee.id}/edit`}>
                              <Button variant="ghost" size="icon">
                                <Edit className="h-4 w-4" />
                              </Button>
                            </Link>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </PermissionGuard>
  )
}
