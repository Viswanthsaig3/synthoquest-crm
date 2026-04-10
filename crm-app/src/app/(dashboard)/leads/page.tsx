'use client'

import React, { useState, useEffect, useMemo } from 'react'
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
import { getLeads, getLeadTypes } from '@/lib/api/leads'
import { getEmployees } from '@/lib/api/employees'
import { LEAD_STATUSES, LEAD_PRIORITIES } from '@/lib/constants'
import { formatDate, getInitials, cn } from '@/lib/utils'
import { canCreateLead, canEditLead, canDeleteLead, canViewAllLeads } from '@/lib/permissions'
import { useToast } from '@/components/ui/toast'
import type { Lead } from '@/lib/db/queries/leads'
import type { LeadType } from '@/types/lead-type'
import type { User } from '@/types/user'
import { 
  Users, Plus, Eye, Edit, Phone, Mail, 
  GraduationCap, Briefcase, FileText, Building, UserPlus, Star,
  Loader2
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
  const { toast } = useToast()
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [leads, setLeads] = useState<Lead[]>([])
  const [leadTypes, setLeadTypes] = useState<LeadType[]>([])
  const [employees, setEmployees] = useState<User[]>([])

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const [leadsRes, typesRes, employeesRes] = await Promise.all([
          getLeads(),
          getLeadTypes(),
          getEmployees(),
        ])
        setLeads(leadsRes.data)
        setLeadTypes(typesRes.data)
        setEmployees(employeesRes.data)
      } catch (error) {
        console.error('Failed to fetch data:', error)
        toast({
          title: 'Error',
          description: 'Failed to load leads. Please try again.',
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [toast])

  const activeLeadTypes = useMemo(() => leadTypes.filter(lt => lt.isActive), [leadTypes])

  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      const matchesSearch = lead.name.toLowerCase().includes(search.toLowerCase()) ||
        lead.email.toLowerCase().includes(search.toLowerCase()) ||
        lead.phone.includes(search)
      const matchesType = !typeFilter || lead.typeId === typeFilter
      const matchesStatus = !statusFilter || lead.typeStatus === statusFilter || lead.status === statusFilter
      const matchesPriority = !priorityFilter || lead.priority === priorityFilter
      return matchesSearch && matchesType && matchesStatus && matchesPriority
    })
  }, [search, typeFilter, statusFilter, priorityFilter, leads])

  const getAssignedUser = (userId: string | null | undefined) => userId ? employees.find(u => u.id === userId) : undefined

  const getLeadTypeBadge = (typeId: string | undefined) => {
    const leadType = leadTypes.find(lt => lt.id === typeId)
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
      const leadType = leadTypes.find(lt => lt.id === typeFilter)
      if (leadType) {
        return leadType.statuses.map(s => ({ value: s.value, label: s.label }))
      }
    }
    return LEAD_STATUSES
  }

  const studentTypeId = leadTypes.find(lt => lt.code === 'student')?.id
  const internTypeId = leadTypes.find(lt => lt.code === 'intern')?.id

  const stats = useMemo(() => {
    return {
      total: leads.length,
      students: studentTypeId ? leads.filter(l => l.typeId === studentTypeId).length : 0,
      interns: internTypeId ? leads.filter(l => l.typeId === internTypeId).length : 0,
    }
  }, [leads, studentTypeId, internTypeId])

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
          className={cn("cursor-pointer hover:border-primary/50 transition-colors", studentTypeId && typeFilter === studentTypeId && "border-primary")}
          onClick={() => studentTypeId && setTypeFilter(typeFilter === studentTypeId ? '' : studentTypeId)}
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
          className={cn("cursor-pointer hover:border-primary/50 transition-colors", internTypeId && typeFilter === internTypeId && "border-primary")}
          onClick={() => internTypeId && setTypeFilter(typeFilter === internTypeId ? '' : internTypeId)}
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
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
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
                    const leadType = leadTypes.find(lt => lt.id === lead.typeId)
                    const status = leadType?.statuses.find(s => s.value === lead.typeStatus)
                    return (
                      <TableRow key={lead.id}>
                        <TableCell>
                          {getLeadTypeBadge(lead.typeId)}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{lead.name}</div>
                          {lead.typeId === internTypeId &&
                            lead.customFields?.if_college != null &&
                            String(lead.customFields.if_college).length > 0 && (
                            <div className="text-xs text-muted-foreground">
                              {String(lead.customFields.if_college)}
                            </div>
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
                            {status?.label || lead.typeStatus || lead.status}
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