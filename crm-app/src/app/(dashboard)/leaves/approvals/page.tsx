'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/context/auth-context'
import { Breadcrumb } from '@/components/layout/breadcrumb'
import { PageHeader, StatusBadge, EmptyState, PermissionGuard } from '@/components/shared'
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

import { formatDate, getInitials } from '@/lib/utils'
import { hasPermission } from '@/lib/client-permissions'
import { FileText, CheckCircle, XCircle, X, Loader2 } from 'lucide-react'
import { useToast } from '@/components/ui/toast'
import { LeavesSubNav } from '@/components/leaves/leaves-subnav'
import type { Leave } from '@/types/leave'

export default function LeaveApprovalsPage() {
  const { user, token } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [pendingLeaves, setPendingLeaves] = useState<Leave[]>([])
  const [rejectModal, setRejectModal] = useState<{ open: boolean; leaveId: string | null }>({
    open: false,
    leaveId: null,
  })
  const [rejectionReason, setRejectionReason] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    if (!user || !token) return
    
    async function fetchPendingLeaves() {
      try {
        const res = await fetch('/api/leaves?status=pending', {
          headers: { Authorization: `Bearer ${token}` }
        })
        
        if (res.ok) {
          const data = await res.json()
          setPendingLeaves(data.data || [])
        }
      } catch (error) {
        console.error('Error fetching pending leaves:', error)
        toast({
          title: 'Error',
          description: 'Failed to load pending leaves',
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
    }
    
    fetchPendingLeaves()
  }, [user, token, toast])

  if (!user) return null

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const handleApprove = async (id: string) => {
    setActionLoading(id)
    try {
      const res = await fetch(`/api/leaves/${id}/approve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to approve leave')
      }

      toast({
        title: 'Leave approved',
        description: 'The leave request has been approved.',
      })

      setPendingLeaves(prev => prev.filter(l => l.id !== id))
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to approve leave',
        variant: 'destructive',
      })
    } finally {
      setActionLoading(null)
    }
  }

  const openRejectModal = (leaveId: string) => {
    setRejectModal({ open: true, leaveId })
    setRejectionReason('')
  }

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast({
        title: 'Reason required',
        description: 'Please provide a reason for rejection.',
        variant: 'destructive',
      })
      return
    }

    if (!rejectModal.leaveId) return

    setActionLoading(rejectModal.leaveId)
    try {
      const res = await fetch(`/api/leaves/${rejectModal.leaveId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ reason: rejectionReason })
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to reject leave')
      }

      toast({
        title: 'Leave rejected',
        description: 'The leave request has been rejected.',
        variant: 'destructive',
      })
      
      setPendingLeaves(prev => prev.filter(l => l.id !== rejectModal.leaveId))
      setRejectModal({ open: false, leaveId: null })
      setRejectionReason('')
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to reject leave',
        variant: 'destructive',
      })
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <PermissionGuard check={(u) => hasPermission(u, 'leaves.approve')} fallbackMessage="You don't have permission to approve leaves.">
    <div className="space-y-6">
      <Breadcrumb />
      <LeavesSubNav />

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
                {pendingLeaves.map((leave) => (
                  <TableRow key={leave.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>{getInitials(leave.employeeName)}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{leave.employeeName}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">{leave.type}</Badge>
                    </TableCell>
                    <TableCell>
                      {formatDate(leave.startDate)} - {formatDate(leave.endDate)}
                    </TableCell>
                    <TableCell>{leave.days}</TableCell>
                    <TableCell className="max-w-xs truncate">{leave.reason}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleApprove(leave.id)}
                          disabled={actionLoading === leave.id}
                        >
                          {actionLoading === leave.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCircle className="h-4 w-4 mr-1" />
                          )}
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => openRejectModal(leave.id)}
                          disabled={actionLoading === leave.id}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
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
    </PermissionGuard>
  )
}