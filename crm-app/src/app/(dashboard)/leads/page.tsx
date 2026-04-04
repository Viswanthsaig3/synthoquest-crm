'use client'

import React, { useState, useMemo } from 'react'
import { useAuth } from '@/context/auth-context'
import { Breadcrumb } from '@/components/layout/breadcrumb'
import { PageHeader, StatusBadge, EmptyState, TableSkeleton, PermissionGuard } from '@/components/shared'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { mockLeads, getStudentLeads, getInternLeads, getLeadsByType } from '@/lib/mock-data'
import { mockLeadTypes, getLeadTypeById, STUDENT_TYPE_ID, INTERN_TYPE_ID } from '@/lib/mock-data/lead-types'
import { mockUsers } from '@/lib/mock-data/users'
import { LEAD_STATUSES, LEAD_PRIORITIES } from '@/lib/constants'
import { formatDate, getInitials, cn } from '@/lib/utils'
import { canCreateLead, canEditLead, canDeleteLead, canViewAllLeads } from '@/lib/permissions'
import { 
  Users, Plus, Download, Search, Filter, Eye, Edit, Phone, Mail, 
  GraduationCap, Briefcase, FileText, Building, UserPlus, Star 
} from 'lucide-react'
import Link from 'next/link'

const iconMap: Record<string, React.ElementType> = {
  GraduationCap,
  Briefcase,
  Users,
  Building,
  FileText,
  UserPlus,
  Star,
}

export default function LeadsPage() {
  const { user } = useAuth()
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [loading, setLoading] = useState(false)

  const activeLeadTypes = useMemo(() => mockLeadTypes.filter(lt => lt.isActive), [])

  const filteredLeads = useMemo(() => {
    return mockLeads.filter(lead => {
      const matchesSearch = lead.name.toLowerCase().includes(search.toLowerCase()) ||
        lead.email.toLowerCase().includes(search.toLowerCase()) ||
        lead.phone.includes(search)
      const matchesType = !typeFilter || lead.typeId === typeFilter
      const matchesStatus = !statusFilter || lead.typeStatus === statusFilter || lead.status === statusFilter
      const matchesPriority = !priorityFilter || lead.priority === priorityFilter
      return matchesSearch && matchesType && matchesStatus && matchesPriority
    })
  }, [search, typeFilter, statusFilter, priorityFilter])

  const getAssignedUser = (userId: string | null) => userId ? mockUsers.find(u => u.id === userId) : undefined

  const getLeadTypeBadge = (typeId: string) => {
    const leadType = getLeadTypeById(typeId)
    if (!leadType) return null
    const IconComponent = iconMap[leadType.icon] || FileText
    return (
      <div 
        className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium"
        style={{ backgroundColor: `${leadType.color}15`, color: leadType.color }}
      >
        <IconComponent className="h-3 w-3" />
        {leadType.name}
      </div>
    )
  }

  const getStatusOptions = () => {
    if (typeFilter) {
      const leadType = getLeadTypeById(typeFilter)
      if (leadType) {
        return leadType.statuses.map(s => ({ value: s.value, label: s.label }))
      }
    }
    return LEAD_STATUSES
  }

  if (!user) return null

  const showCreateButton = canCreateLead(user)
  const canEdit = canEditLead(user)
  const canDelete = canDeleteLead(user)

  const typeOptions = [
    { value: '', label: 'All Types' },
    ...activeLeadTypes.map(lt => ({ value: lt.id, label: lt.name }))
  ]

  const priorityOptions = [
    { value: '', label: 'All Priorities' },
    ...LEAD_PRIORITIES.map(p => ({ value: p.value, label: p.label }))
  ]

  const stats = useMemo(() => {
    const studentLeads = mockLeads.filter(l => l.typeId === STUDENT_TYPE_ID)
    const internLeads = mockLeads.filter(l => l.typeId === INTERN_TYPE_ID)
    return {
      total: mockLeads.length,
      students: studentLeads.length,
      interns: internLeads.length,
    }
  }, [])

  return (
    <PermissionGuard check={canViewAllLeads} fallbackMessage="Only administrators and managers can view all leads.">
      <div className="space-y-6">
        <Breadcrumb />
      
      <PageHeader
        title="Leads"
        description={`${filteredLeads.length} leads found`}
        action={showCreateButton ? { label: 'Add Lead', href: '/leads/new' } : undefined}
        search={{ placeholder: 'Search leads...', value: search, onChange: setSearch }}
        filters={[
          { options: typeOptions, value: typeFilter, onChange: setTypeFilter, placeholder: 'All Types' },
          { options: getStatusOptions(), value: statusFilter, onChange: setStatusFilter, placeholder: 'All Status' },
          { options: priorityOptions, value: priorityFilter, onChange: setPriorityFilter, placeholder: 'All Priority' },
        ]}
        exportData
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setTypeFilter('')}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Leads</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card 
          className={cn("cursor-pointer hover:border-primary/50 transition-colors", typeFilter === STUDENT_TYPE_ID && "border-primary")}
          onClick={() => setTypeFilter(typeFilter === STUDENT_TYPE_ID ? '' : STUDENT_TYPE_ID)}
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Student Leads</p>
                <p className="text-2xl font-bold text-blue-600">{stats.students}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <GraduationCap className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card 
          className={cn("cursor-pointer hover:border-primary/50 transition-colors", typeFilter === INTERN_TYPE_ID && "border-primary")}
          onClick={() => setTypeFilter(typeFilter === INTERN_TYPE_ID ? '' : INTERN_TYPE_ID)}
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Intern Leads</p>
                <p className="text-2xl font-bold text-green-600">{stats.interns}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                <Briefcase className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <TableSkeleton rows={10} />
          ) : filteredLeads.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No leads found"
              description={showCreateButton ? "Get started by adding your first lead." : "No leads available."}
              action={showCreateButton ? { label: 'Add Lead', onClick: () => {} } : undefined}
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLeads.map((lead) => {
                    const assignedUser = getAssignedUser(lead.assignedTo)
                    const leadType = getLeadTypeById(lead.typeId)
                    const status = leadType?.statuses.find(s => s.value === lead.typeStatus)
                    return (
                      <TableRow key={lead.id}>
                        <TableCell>
                          {getLeadTypeBadge(lead.typeId)}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{lead.name}</div>
                          {lead.typeId === INTERN_TYPE_ID && lead.customFields?.if_college && (
                            <div className="text-xs text-muted-foreground">{lead.customFields.if_college as string}</div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-sm">
                              <Mail className="h-3 w-3" />
                              {lead.email}
                            </div>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Phone className="h-3 w-3" />
                              {lead.phone}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline"
                            style={{ 
                              borderColor: status?.color,
                              backgroundColor: status ? `${status.color}15` : undefined,
                              color: status?.color
                            }}
                          >
                            {status?.label || lead.typeStatus}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={
                            lead.priority === 'hot' ? 'destructive' : 
                            lead.priority === 'warm' ? 'default' : 'secondary'
                          }>
                            {lead.priority}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {lead.typeSource || lead.source}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {assignedUser ? (
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={assignedUser.avatar || undefined} />
                                <AvatarFallback>{getInitials(assignedUser.name)}</AvatarFallback>
                              </Avatar>
                              <span className="text-sm">{assignedUser.name}</span>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">Unassigned</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(lead.createdAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link href={`/leads/${lead.id}`}>
                              <Button variant="ghost" size="icon">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                            {canEdit && (
                              <Link href={`/leads/${lead.id}?edit=true`}>
                                <Button variant="ghost" size="icon">
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </Link>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    </PermissionGuard>
  )
}