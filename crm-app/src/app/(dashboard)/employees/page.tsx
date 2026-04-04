'use client'

import React, { useState, useMemo } from 'react'
import { useAuth } from '@/context/auth-context'
import { Breadcrumb } from '@/components/layout/breadcrumb'
import { PageHeader, StatusBadge, EmptyState, TableSkeleton, PermissionGuard } from '@/components/shared'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
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
import { mockUsers } from '@/lib/mock-data'
import { DEPARTMENTS, ROLES } from '@/lib/constants'
import { formatDate, getInitials, cn } from '@/lib/utils'
import { canViewEmployees, canManageEmployees } from '@/lib/permissions'
import { Users, Plus, Download, Eye, Edit, Mail, Phone, Calendar } from 'lucide-react'
import Link from 'next/link'

export default function EmployeesPage() {
  const { user } = useAuth()
  const [search, setSearch] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [loading, setLoading] = useState(false)

  if (!user) return null

  const canAdd = canManageEmployees(user)

  const filteredEmployees = useMemo(() => {
    return mockUsers.filter(emp => {
      const matchesSearch = emp.name.toLowerCase().includes(search.toLowerCase()) ||
        emp.email.toLowerCase().includes(search.toLowerCase())
      const matchesDepartment = !departmentFilter || emp.department === departmentFilter
      const matchesRole = !roleFilter || emp.role === roleFilter
      return matchesSearch && matchesDepartment && matchesRole
    })
  }, [search, departmentFilter, roleFilter])

  return (
    <PermissionGuard check={canViewEmployees} fallbackMessage="You don't have permission to view employees.">
      <div className="space-y-6">
        <Breadcrumb />
        
        <PageHeader
          title="Employees"
          description={`${filteredEmployees.length} employees found`}
          action={canAdd ? { label: 'Add Employee', href: '/employees/new' } : undefined}
          search={{ placeholder: 'Search employees...', value: search, onChange: setSearch }}
          filters={[
            { options: DEPARTMENTS, value: departmentFilter, onChange: setDepartmentFilter, placeholder: 'All Departments' },
            { options: ROLES, value: roleFilter, onChange: setRoleFilter, placeholder: 'All Roles' },
          ]}
          exportData
        />

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <TableSkeleton rows={10} />
            ) : filteredEmployees.length === 0 ? (
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
                  {filteredEmployees.map((employee) => (
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
                          {formatDate(new Date(employee.joinDate))}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/employees/${employee.id}`}>
                            <Button variant="ghost" size="icon">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          {canAdd && (
                            <Link href={`/employees/${employee.id}?edit=true`}>
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