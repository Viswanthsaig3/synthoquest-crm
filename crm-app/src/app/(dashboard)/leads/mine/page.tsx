'use client'

import React, { useState, useMemo } from 'react'
import { useAuth } from '@/context/auth-context'
import { Breadcrumb } from '@/components/layout/breadcrumb'
import { PageHeader, StatusBadge, EmptyState, PermissionGuard } from '@/components/shared'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { getLeadsByAssignee, mockLeads } from '@/lib/mock-data/leads'
import { formatDate, formatTime } from '@/lib/utils'
import { canCallLead, canConvertLead, canViewAssignedLeads } from '@/lib/permissions'
import { LEAD_STATUSES, LEAD_PRIORITIES, COURSE_FEES } from '@/lib/constants'
import { Users, Phone, Mail, Eye, Flame, Zap, Snowflake, Clock, Calendar, CheckCircle, XCircle, PhoneOff } from 'lucide-react'
import { useToast } from '@/components/ui/toast'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function MyLeadsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [activeTab, setActiveTab] = useState<'all' | 'follow_up'>('all')

  if (!user) return null

  const myLeads = getLeadsByAssignee(user.id)
  const canCall = canCallLead(user)
  const canConvert = canConvertLead(user)

  const filteredLeads = useMemo(() => {
    return myLeads.filter(lead => {
      const matchesSearch = lead.name.toLowerCase().includes(search.toLowerCase()) ||
        lead.email.toLowerCase().includes(search.toLowerCase()) ||
        lead.phone.includes(search)
      const matchesStatus = !statusFilter || lead.status === statusFilter
      const matchesPriority = !priorityFilter || lead.priority === priorityFilter
      
      if (activeTab === 'follow_up') {
        return matchesSearch && matchesStatus && matchesPriority && lead.nextFollowUpAt
      }
      
      return matchesSearch && matchesStatus && matchesPriority
    }).sort((a, b) => {
      if (a.nextFollowUpAt && b.nextFollowUpAt) {
        return new Date(a.nextFollowUpAt).getTime() - new Date(b.nextFollowUpAt).getTime()
      }
      if (a.nextFollowUpAt) return -1
      if (b.nextFollowUpAt) return 1
      
      const priorityOrder = { hot: 0, warm: 1, cold: 2 }
      return priorityOrder[a.priority] - priorityOrder[b.priority]
    })
  }, [search, statusFilter, priorityFilter, activeTab, myLeads])

  const leadsByStatus = useMemo(() => {
    return {
      all: myLeads.length,
      new: myLeads.filter(l => l.status === 'new').length,
      contacted: myLeads.filter(l => l.status === 'contacted').length,
      follow_up: myLeads.filter(l => l.status === 'follow_up' || l.nextFollowUpAt).length,
      hot: myLeads.filter(l => l.priority === 'hot').length,
    }
  }, [myLeads])

  const handleCall = (leadId: string) => {
    router.push(`/leads/${leadId}?action=call`)
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'hot': return <Flame className="h-4 w-4 text-red-500" />
      case 'warm': return <Zap className="h-4 w-4 text-orange-500" />
      case 'cold': return <Snowflake className="h-4 w-4 text-blue-500" />
      default: return null
    }
  }

  const getLastCallIcon = (outcome: string | null) => {
    if (!outcome) return null
    switch (outcome) {
      case 'answered': return <Phone className="h-3 w-3 text-green-500" />
      case 'no_answer': return <PhoneOff className="h-3 w-3 text-gray-400" />
      default: return <Phone className="h-3 w-3 text-yellow-500" />
    }
  }

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs}s`
  }

  return (
    <PermissionGuard check={canViewAssignedLeads} fallbackMessage="You don't have permission to view assigned leads.">
      <div className="space-y-6">
        <Breadcrumb />
      
      <PageHeader
        title="My Leads"
        description={`${myLeads.length} leads assigned to you`}
      />

      <div className="flex gap-2 overflow-x-auto pb-2">
        <Button
          variant={activeTab === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveTab('all')}
        >
          All ({leadsByStatus.all})
        </Button>
        <Button
          variant={activeTab === 'follow_up' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveTab('follow_up')}
          className="text-orange-600"
        >
          <Calendar className="h-4 w-4 mr-1" />
          Follow-ups ({leadsByStatus.follow_up})
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="text-red-600"
        >
          <Flame className="h-4 w-4 mr-1" />
          Hot ({leadsByStatus.hot})
        </Button>
      </div>

      <div className="flex gap-4">
        <Input
          placeholder="Search leads..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-40"
        >
          <option value="">All Status</option>
          {LEAD_STATUSES.map(s => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </Select>
        <Select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="w-40"
        >
          <option value="">All Priority</option>
          {LEAD_PRIORITIES.map(p => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </Select>
      </div>

      {filteredLeads.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <EmptyState
              icon={Users}
              title={activeTab === 'follow_up' ? "No follow-ups scheduled" : "No leads found"}
              description={activeTab === 'follow_up' 
                ? "You don't have any leads with scheduled follow-ups."
                : "Claim leads from the lead pool to get started."}
              action={{ label: 'Go to Lead Pool', onClick: () => router.push('/leads/pool') }}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredLeads.map((lead) => {
            const estValue = lead.courseInterested ? (COURSE_FEES[lead.courseInterested] || 0) : 0
            
            return (
              <Card key={lead.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {getPriorityIcon(lead.priority)}
                        <h3 className="font-semibold">{lead.name}</h3>
                        <StatusBadge status={lead.status} />
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-2">
                        <span>{lead.courseInterested}</span>
                        <span>Est. ₹{estValue.toLocaleString()}</span>
                        <span>{lead.totalCalls} call{lead.totalCalls !== 1 ? 's' : ''}</span>
                      </div>

                      {lead.lastCallOutcome && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          {getLastCallIcon(lead.lastCallOutcome)}
                          <span className="capitalize">{lead.lastCallOutcome.replace('_', ' ')}</span>
                          {lead.callRecords.length > 0 && (
                            <span>
                              - Last call: {formatDate(lead.callRecords[lead.callRecords.length - 1].createdAt)}
                            </span>
                          )}
                        </div>
                      )}

                      {lead.nextFollowUpAt && (
                        <div className="flex items-center gap-2 text-sm text-orange-600 mt-1">
                          <Calendar className="h-3 w-3" />
                          Follow-up: {formatDate(lead.nextFollowUpAt)}
                        </div>
                      )}

                      {lead.notes && lead.notes.length > 0 && (
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-1">
                          💬 {lead.notes}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {canCall && (
                        <Button size="sm" onClick={() => handleCall(lead.id)}>
                          <Phone className="h-4 w-4 mr-1" />
                          Call
                        </Button>
                      )}
                      <Link href={`/leads/${lead.id}`}>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
      </div>
    </PermissionGuard>
  )
}