'use client'

import React, { useState, useMemo } from 'react'
import { useAuth } from '@/context/auth-context'
import { Breadcrumb } from '@/components/layout/breadcrumb'
import { PageHeader, StatusBadge, EmptyState, TableSkeleton } from '@/components/shared'
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
import { mockLeads } from '@/lib/mock-data'
import { mockUsers } from '@/lib/mock-data/users'
import { LEAD_STATUSES, LEAD_SOURCES, COURSES } from '@/lib/constants'
import { formatDate, getInitials, cn } from '@/lib/utils'
import { Users, Plus, Download, Search, Filter, Eye, Edit, Phone, Mail } from 'lucide-react'
import Link from 'next/link'

export default function LeadsPage() {
  const { user } = useAuth()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [sourceFilter, setSourceFilter] = useState('')
  const [loading, setLoading] = useState(false)

  const filteredLeads = useMemo(() => {
    return mockLeads.filter(lead => {
      const matchesSearch = lead.name.toLowerCase().includes(search.toLowerCase()) ||
        lead.email.toLowerCase().includes(search.toLowerCase()) ||
        lead.phone.includes(search)
      const matchesStatus = !statusFilter || lead.status === statusFilter
      const matchesSource = !sourceFilter || lead.source === sourceFilter
      return matchesSearch && matchesStatus && matchesSource
    })
  }, [search, statusFilter, sourceFilter])

  const getAssignedUser = (userId: string) => mockUsers.find(u => u.id === userId)

  if (!user) return null

  return (
    <div className="space-y-6">
      <Breadcrumb />
      
      <PageHeader
        title="Leads"
        description={`${filteredLeads.length} leads found`}
        action={{ label: 'Add Lead', href: '/leads/new' }}
        search={{ placeholder: 'Search leads...', value: search, onChange: setSearch }}
        filters={[
          { options: LEAD_STATUSES, value: statusFilter, onChange: setStatusFilter, placeholder: 'All Status' },
          { options: LEAD_SOURCES, value: sourceFilter, onChange: setSourceFilter, placeholder: 'All Sources' },
        ]}
        exportData
      />

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <TableSkeleton rows={10} />
          ) : filteredLeads.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No leads found"
              description="Get started by adding your first lead."
              action={{ label: 'Add Lead', onClick: () => {} }}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeads.map((lead) => {
                  const assignedUser = getAssignedUser(lead.assignedTo)
                  return (
                    <TableRow key={lead.id}>
                      <TableCell>
                        <div className="font-medium">{lead.name}</div>
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
                        <span className="text-sm">{lead.courseInterested}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {lead.source}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={lead.status} />
                      </TableCell>
                      <TableCell>
                        {assignedUser && (
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={assignedUser.avatar} />
                              <AvatarFallback>{getInitials(assignedUser.name)}</AvatarFallback>
                            </Avatar>
                            <span className="text-sm">{assignedUser.name}</span>
                          </div>
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
                          <Link href={`/leads/${lead.id}?edit=true`}>
                            <Button variant="ghost" size="icon">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}