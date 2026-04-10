'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/context/auth-context'
import { Breadcrumb } from '@/components/layout/breadcrumb'
import { PageHeader, EmptyState, PermissionGuard } from '@/components/shared'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { INTERN_STATUSES, INTERNSHIP_TYPES } from '@/lib/constants'
import { formatDate, getErrorMessage, getInitials } from '@/lib/utils'
import { canViewInterns, canManageAllInterns } from '@/lib/permissions'
import { Briefcase, Eye, Mail, Phone, Calendar, Loader2, Plus } from 'lucide-react'
import Link from 'next/link'
import { getInterns } from '@/lib/api/interns'
import { useToast } from '@/components/ui/toast'
import type { Intern } from '@/types/intern'

export default function InternsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [interns, setInterns] = useState<Intern[]>([])
  const [total, setTotal] = useState(0)

  const canCreate = user ? canManageAllInterns(user) : false

  useEffect(() => {
    if (!user) return

    const run = async () => {
      try {
        setLoading(true)
        const response = await getInterns({
          search: search || undefined,
          status: statusFilter || undefined,
          department: departmentFilter || undefined,
          internshipType: (typeFilter as 'paid' | 'unpaid' | '') || undefined,
          limit: 100,
        })
        setInterns(response.data || [])
        setTotal(response.pagination?.total || 0)
      } catch (error: unknown) {
        toast({
          title: 'Error',
          description: getErrorMessage(error, 'Failed to load interns'),
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
    }

    run()
  }, [user, search, statusFilter, departmentFilter, typeFilter, toast])

  const stats = useMemo(() => {
    return {
      total,
      active: interns.filter((intern) => intern.status === 'active').length,
      completed: interns.filter((intern) => intern.status === 'completed').length,
      pending: interns.filter((intern) => intern.approvalStatus === 'pending').length,
    }
  }, [interns, total])

  if (!user) return null

  const getStatusColor = (status: string) => {
    const statusConfig = INTERN_STATUSES.find((s) => s.value === status)
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
          description={`${total} interns found`}
          search={{ placeholder: 'Search interns...', value: search, onChange: setSearch }}
          filters={[
            { options: INTERN_STATUSES, value: statusFilter, onChange: setStatusFilter, placeholder: 'All Statuses' },
            { options: departmentOptions, value: departmentFilter, onChange: setDepartmentFilter, placeholder: 'All Departments' },
            { options: INTERNSHIP_TYPES, value: typeFilter, onChange: setTypeFilter, placeholder: 'All Types' },
          ]}
          action={
            canCreate
              ? {
                  label: 'Add Intern',
                  href: '/interns/new',
                }
              : undefined
          }
          exportData
        />

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : interns.length === 0 ? (
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
                  {interns.map((intern) => (
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
                      <TableCell className="text-sm">{intern.duration.replace('_', ' ')}</TableCell>
                      <TableCell>
                        <Badge variant={intern.internshipType === 'paid' ? 'default' : 'secondary'} className="capitalize">
                          {intern.internshipType}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge className={getStatusColor(intern.status)}>{intern.status}</Badge>
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
                          <button className="inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-accent">
                            <Eye className="h-4 w-4" />
                          </button>
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
