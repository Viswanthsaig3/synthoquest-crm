'use client'

import React, { useState } from 'react'
import { useAuth } from '@/context/auth-context'
import { Breadcrumb } from '@/components/layout/breadcrumb'
import { PageHeader, StatusBadge, EmptyState } from '@/components/shared'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
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
import { getPendingLeaves } from '@/lib/mock-data'
import { mockUsers } from '@/lib/mock-data/users'
import { formatDate, getInitials } from '@/lib/utils'
import { getTeamMemberIds, canManageTeamLeaves } from '@/lib/permissions'
import { FileText, CheckCircle, XCircle, X } from 'lucide-react'
import { useToast } from '@/components/ui/toast'

export default function LeaveApprovalsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [rejectModal, setRejectModal] = useState<{ open: boolean; leaveId: string | null }>({
    open: false,
    leaveId: null,
  })
  const [rejectionReason, setRejectionReason] = useState('')

  const allPendingLeaves = getPendingLeaves()
  const teamMemberIds = user ? getTeamMemberIds(user.id, mockUsers) : []
  
  const pendingLeaves = allPendingLeaves.filter(leave => 
    canManageTeamLeaves(user!, leave, teamMemberIds)
  )

  if (!user) return null

  const handleApprove = (id: string) => {
    toast({
      title: 'Leave approved',
      description: 'The leave request has been approved.',
    })
  }

  const openRejectModal = (leaveId: string) => {
    setRejectModal({ open: true, leaveId })
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
      title: 'Leave rejected',
      description: 'The leave request has been rejected.',
      variant: 'destructive',
    })
    setRejectModal({ open: false, leaveId: null })
    setRejectionReason('')
  }

  return (
    <div className="space-y-6">
      <Breadcrumb />
      
      <PageHeader
        title="Leave Approvals"
        description={`${pendingLeaves.length} pending leave requests`}
      />

      <Card>
        <CardContent className="p-0">
          {pendingLeaves.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No pending requests"
              description="All leave requests have been processed."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead>Days</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingLeaves.map((leave) => {
                  const employee = mockUsers.find(u => u.id === leave.employeeId)
                  return (
                    <TableRow key={leave.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={employee?.avatar} />
                            <AvatarFallback>{employee ? getInitials(employee.name) : '?'}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{leave.employeeName}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">{leave.type}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{formatDate(leave.startDate)}</div>
                          <div className="text-muted-foreground">to {formatDate(leave.endDate)}</div>
                        </div>
                      </TableCell>
                      <TableCell>{leave.days}</TableCell>
                      <TableCell className="max-w-xs truncate">{leave.reason}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleApprove(leave.id)}>
                            <CheckCircle className="h-4 w-4 mr-1 text-green-600" />
                            Approve
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => openRejectModal(leave.id)}>
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

      {rejectModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/80" onClick={() => setRejectModal({ open: false, leaveId: null })} />
          <Card className="fixed z-50 w-full max-w-md">
            <Card className="border-0 shadow-none">
              <div className="flex items-center justify-between p-6 border-b">
                <h3 className="text-lg font-semibold">Reject Leave Request</h3>
                <Button variant="ghost" size="icon" onClick={() => setRejectModal({ open: false, leaveId: null })}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Rejection Reason *</label>
                  <Textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Please provide a reason for rejecting this leave request..."
                    rows={4}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setRejectModal({ open: false, leaveId: null })}>
                    Cancel
                  </Button>
                  <Button variant="destructive" onClick={handleReject}>
                    Reject Leave
                  </Button>
                </div>
              </div>
            </Card>
          </Card>
        </div>
      )}
    </div>
  )
}