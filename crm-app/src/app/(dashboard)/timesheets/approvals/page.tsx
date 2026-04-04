'use client'

import React, { useState } from 'react'
import { useAuth } from '@/context/auth-context'
import { Breadcrumb } from '@/components/layout/breadcrumb'
import { PageHeader, StatusBadge, EmptyState } from '@/components/shared'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Textarea } from '@/components/ui/textarea'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { getPendingTimesheetsByTeam } from '@/lib/mock-data/timesheets'
import { mockUsers } from '@/lib/mock-data/users'
import { formatDate, getInitials } from '@/lib/utils'
import { getTeamMemberIds } from '@/lib/permissions'
import { Clock, CheckCircle, XCircle, Eye, X, Calendar } from 'lucide-react'
import { useToast } from '@/components/ui/toast'

export default function TimesheetApprovalsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [rejectModal, setRejectModal] = useState<{ open: boolean; timesheetId: string | null }>({
    open: false,
    timesheetId: null,
  })
  const [rejectionReason, setRejectionReason] = useState('')
  const [viewModal, setViewModal] = useState<{ open: boolean; timesheetId: string | null }>({
    open: false,
    timesheetId: null,
  })

  const teamMemberIds = user ? getTeamMemberIds(user.id, mockUsers) : []
  const pendingTimesheets = getPendingTimesheetsByTeam(teamMemberIds)

  if (!user) return null

  const handleApprove = (id: string) => {
    toast({
      title: 'Timesheet approved',
      description: 'The timesheet has been approved successfully.',
    })
  }

  const openRejectModal = (timesheetId: string) => {
    setRejectModal({ open: true, timesheetId })
    setRejectionReason('')
  }

  const handleReject = () => {
    if (!rejectionReason.trim()) {
      toast({
        title: 'Reason required',
        description: 'Please provide a reason for rejection.',
        variant: 'destructive',
      })
      return
    }
    
    toast({
      title: 'Timesheet rejected',
      description: 'The timesheet has been rejected.',
      variant: 'destructive',
    })
    setRejectModal({ open: false, timesheetId: null })
    setRejectionReason('')
  }

  const openViewModal = (timesheetId: string) => {
    setViewModal({ open: true, timesheetId })
  }

  const selectedTimesheet = viewModal.timesheetId 
    ? pendingTimesheets.find(ts => ts.id === viewModal.timesheetId)
    : null

  return (
    <div className="space-y-6">
      <Breadcrumb />
      
      <PageHeader
        title="Timesheet Approvals"
        description={`${pendingTimesheets.length} daily timesheets pending approval`}
      />

      <Card>
        <CardContent className="p-0">
          {pendingTimesheets.length === 0 ? (
            <EmptyState
              icon={Clock}
              title="No pending approvals"
              description="All timesheets have been reviewed."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Day</TableHead>
                  <TableHead>Hours</TableHead>
                  <TableHead>Tasks</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingTimesheets.map((ts) => {
                  const employee = mockUsers.find(u => u.id === ts.employeeId)
                  return (
                    <TableRow key={ts.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={employee?.avatar} />
                            <AvatarFallback>{employee ? getInitials(employee.name) : '?'}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{ts.employeeName}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {formatDate(ts.date)}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {ts.date.toLocaleDateString('en-US', { weekday: 'short' })}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{ts.totalHours}h</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {ts.entries.length} task{ts.entries.length > 1 ? 's' : ''}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => openViewModal(ts.id)}>
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleApprove(ts.id)}>
                            <CheckCircle className="h-4 w-4 mr-1 text-green-600" />
                            Approve
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => openRejectModal(ts.id)}>
                            <XCircle className="h-4 w-4 mr-1 text-red-600" />
                            Reject
                          </Button>
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

      {viewModal.open && selectedTimesheet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/80" onClick={() => setViewModal({ open: false, timesheetId: null })} />
          <Card className="fixed z-50 w-full max-w-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Timesheet Details</CardTitle>
                <Button variant="ghost" size="icon" onClick={() => setViewModal({ open: false, timesheetId: null })}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Employee</p>
                  <p className="font-medium">{selectedTimesheet.employeeName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="font-medium">{formatDate(selectedTimesheet.date)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Hours</p>
                  <p className="font-medium">{selectedTimesheet.totalHours}h</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <StatusBadge status={selectedTimesheet.status} />
                </div>
              </div>

              <div className="pt-4 border-t">
                <p className="text-sm font-medium mb-3">Task Entries</p>
                <div className="space-y-3">
                  {selectedTimesheet.entries.map((entry, index) => (
                    <div key={entry.id || index} className="p-3 rounded-lg bg-muted">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium text-sm">{entry.taskTitle}</p>
                        <Badge variant="outline">{entry.hours}h</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{entry.description || 'No description'}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setViewModal({ open: false, timesheetId: null })}>
                  Close
                </Button>
                <Button variant="destructive" onClick={() => {
                  setViewModal({ open: false, timesheetId: null })
                  openRejectModal(selectedTimesheet.id)
                }}>
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </Button>
                <Button onClick={() => {
                  handleApprove(selectedTimesheet.id)
                  setViewModal({ open: false, timesheetId: null })
                }}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {rejectModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/80" onClick={() => setRejectModal({ open: false, timesheetId: null })} />
          <Card className="fixed z-50 w-full max-w-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Reject Timesheet</CardTitle>
                <Button variant="ghost" size="icon" onClick={() => setRejectModal({ open: false, timesheetId: null })}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Rejection Reason *</label>
                <Textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Please provide a reason for rejecting this timesheet..."
                  rows={4}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setRejectModal({ open: false, timesheetId: null })}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleReject}>
                  Reject Timesheet
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}