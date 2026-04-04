'use client'

import React, { useState, useMemo } from 'react'
import { useAuth } from '@/context/auth-context'
import { Breadcrumb } from '@/components/layout/breadcrumb'
import { PageHeader, EmptyState, PermissionGuard } from '@/components/shared'
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
import { mockInterns, getInternStats } from '@/lib/mock-data/interns'
import { INTERN_STATUSES, INTERN_SOURCES, INTERNSHIP_TYPES, INTERNSHIP_DURATIONS } from '@/lib/constants'
import { formatDate, getInitials } from '@/lib/utils'
import { canViewInterns } from '@/lib/permissions'
import { Briefcase, Eye, Mail, Phone, Building, Calendar, ExternalLink, Clock } from 'lucide-react'
import Link from 'next/link'

export default function InternsPage() {
  const { user } = useAuth()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')

  if (!user) return null

  const stats = getInternStats()

  const filteredInterns = useMemo(() => {
    return mockInterns.filter(intern => {
      const matchesSearch = intern.name.toLowerCase().includes(search.toLowerCase()) ||
        intern.email.toLowerCase().includes(search.toLowerCase()) ||
        intern.phone.includes(search) ||
        intern.college.toLowerCase().includes(search.toLowerCase())
      const matchesStatus = !statusFilter || intern.status === statusFilter
      const matchesDepartment = !departmentFilter || intern.department === departmentFilter
      const matchesType = !typeFilter || intern.internshipType === typeFilter
      return matchesSearch && matchesStatus && matchesDepartment && matchesType
    })
  }, [search, statusFilter, departmentFilter, typeFilter])

  if (!user) return null

  const getStatusColor = (status: string) => {
    const statusConfig = INTERN_STATUSES.find(s => s.value === status)
    const colors: Record<string, string> = {
      blue: 'bg-blue-100 text-blue-800',
      purple: 'bg-purple-100 text-purple-800',
      orange: 'bg-orange-100 text-orange-800',
      green: 'bg-green-100 text-green-800',
      teal: 'bg-teal-100 text-teal-800',
      gray: 'bg-gray-100 text-gray-800',
      red: 'bg-red-100 text-red-800',
    }
    return colors[statusConfig?.color || 'gray'] || 'bg-gray-100 text-gray-800'
  }

  const departmentOptions = [
    { value: 'training', label: 'Training' },
    { value: 'sales', label: 'Sales' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'content', label: 'Content Development' },
  ]

  return (
    <PermissionGuard check={canViewInterns} fallbackMessage="You don't have permission to view interns.">
      <div className="space-y-6">
        <Breadcrumb />
      
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-sm text-muted-foreground">Total Interns</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            <div className="text-sm text-muted-foreground">Active</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{stats.completed}</div>
            <div className="text-sm text-muted-foreground">Completed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-600">{stats.pending}</div>
            <div className="text-sm text-muted-foreground">Pending Approval</div>
          </CardContent>
        </Card>
      </div>

      <PageHeader
        title="Interns"
        description={`${filteredInterns.length} interns found`}
        search={{ placeholder: 'Search interns...', value: search, onChange: setSearch }}
        filters={[
          { options: INTERN_STATUSES, value: statusFilter, onChange: setStatusFilter, placeholder: 'All Statuses' },
          { options: departmentOptions, value: departmentFilter, onChange: setDepartmentFilter, placeholder: 'All Departments' },
          { options: INTERNSHIP_TYPES, value: typeFilter, onChange: setTypeFilter, placeholder: 'All Types' },
        ]}
        exportData
      />

      <Card>
        <CardContent className="p-0">
          {filteredInterns.length === 0 ? (
            <EmptyState
              icon={Briefcase}
              title="No interns found"
              description="Interns will appear here when leads are converted or applications are received."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Intern</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInterns.map((intern) => (
                  <TableRow key={intern.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${intern.name}`} />
                          <AvatarFallback>{getInitials(intern.name)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{intern.name}</p>
                          <p className="text-xs text-muted-foreground">{intern.college}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-sm">
                          <Mail className="h-3 w-3" />
                          <span className="truncate max-w-[150px]">{intern.email}</span>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          {intern.phone}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {intern.department}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {intern.duration.replace('_', ' ')}
                    </TableCell>
                    <TableCell>
                      <Badge variant={intern.internshipType === 'paid' ? 'default' : 'secondary'} className="capitalize">
                        {intern.internshipType}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(intern.status)}>
                          {intern.status}
                        </Badge>
                        {intern.approvalStatus === 'pending' && (
                          <Badge variant="outline" className="text-orange-600 border-orange-300">
                            Pending
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {intern.startDate ? (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(intern.startDate)}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/interns/${intern.id}`}>
                        <Button variant="ghost" size="icon">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
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