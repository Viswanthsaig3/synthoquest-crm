'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/context/auth-context'
import { getAccessToken } from '@/lib/api/client'
import { Breadcrumb } from '@/components/layout/breadcrumb'
import { EmptyState } from '@/components/shared'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { hasPermission } from '@/lib/client-permissions'
import { formatDate, getErrorMessage } from '@/lib/utils'
import type { TimesheetPendingEntry } from '@/lib/db/queries/timesheets'

interface PendingEntryGroup {
  employeeName?: string
  employeeEmail?: string
  workDate?: string
  entries: TimesheetPendingEntry[]
}
import { Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { useToast } from '@/components/ui/toast'
import { TimesheetsSubNav } from '@/components/timesheets/timesheets-subnav'

export default function TimesheetApprovalsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [pendingEntries, setPendingEntries] = useState<TimesheetPendingEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedEntries, setSelectedEntries] = useState<Set<string>>(new Set())
  const [rejectModal, setRejectModal] = useState<{ open: boolean; entryIds: string[] }>({
    open: false,
    entryIds: [],
  })
  const [rejectionReason, setRejectionReason] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const canApprove = hasPermission(user, 'timesheets.approve')

  useEffect(() => {
    if (user && canApprove) {
      fetchPendingEntries()
    }
  }, [canApprove, user])

  const fetchPendingEntries = async () => {
    try {
      const token = getAccessToken()
      const response = await fetch('/api/timesheet-entries/pending?limit=200', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Failed to load entries')
      setPendingEntries(result.data || [])
    } catch (error: unknown) {
      console.error('Error fetching pending entries:', error)
      toast({
        title: 'Error',
        description: getErrorMessage(error, 'Failed to load pending entries'),
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  if (!user || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!canApprove) {
    return (
      <div className="space-y-6">
        <Breadcrumb />
        <TimesheetsSubNav />
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            You do not have permission to access approvals.
          </CardContent>
        </Card>
      </div>
    )
  }

  const handleApprove = async (entryIds: string[]) => {
    if (entryIds.length === 0) return
    
    setActionLoading(true)
    try {
      const token = getAccessToken()
      if (entryIds.length === 1) {
        const response = await fetch(`/api/timesheet-entries/${entryIds[0]}/approve`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        })
        const result = await response.json()
        if (!response.ok) throw new Error(result.error || 'Failed to approve entry')
      } else {
        const response = await fetch('/api/timesheet-entries/bulk-approve', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ entryIds }),
        })
        const result = await response.json()
        if (!response.ok) throw new Error(result.error || 'Failed to approve entries')
      }
      
      toast({
        title: 'Approved',
        description: `${entryIds.length} ${entryIds.length === 1 ? 'entry' : 'entries'} approved successfully.`,
      })
      setSelectedEntries(new Set())
      fetchPendingEntries()
    } catch (error: unknown) {
      toast({
        title: 'Error',
        description: getErrorMessage(error, 'Failed to approve'),
        variant: 'destructive',
      })
    } finally {
      setActionLoading(false)
    }
  }

  const handleReject = async () => {
    if (rejectModal.entryIds.length === 0 || !rejectionReason.trim()) return
    
    setActionLoading(true)
    try {
      const token = getAccessToken()
      if (rejectModal.entryIds.length === 1) {
        const response = await fetch(`/api/timesheet-entries/${rejectModal.entryIds[0]}/reject`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ reason: rejectionReason }),
        })
        const result = await response.json()
        if (!response.ok) throw new Error(result.error || 'Failed to reject entry')
      } else {
        const response = await fetch('/api/timesheet-entries/bulk-reject', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ entryIds: rejectModal.entryIds, reason: rejectionReason }),
        })
        const result = await response.json()
        if (!response.ok) throw new Error(result.error || 'Failed to reject entries')
      }
      
      toast({
        title: 'Rejected',
        description: `${rejectModal.entryIds.length} ${rejectModal.entryIds.length === 1 ? 'entry' : 'entries'} rejected.`,
      })
      setRejectModal({ open: false, entryIds: [] })
      setRejectionReason('')
      setSelectedEntries(new Set())
      fetchPendingEntries()
    } catch (error: unknown) {
      toast({
        title: 'Error',
        description: getErrorMessage(error, 'Failed to reject'),
        variant: 'destructive',
      })
    } finally {
      setActionLoading(false)
    }
  }

  const toggleEntry = (entryId: string) => {
    const newSelected = new Set(selectedEntries)
    if (newSelected.has(entryId)) {
      newSelected.delete(entryId)
    } else {
      newSelected.add(entryId)
    }
    setSelectedEntries(newSelected)
  }

  const toggleAll = () => {
    if (selectedEntries.size === pendingEntries.length) {
      setSelectedEntries(new Set())
    } else {
      setSelectedEntries(new Set(pendingEntries.map((e) => e.id)))
    }
  }

  const groupedEntries = pendingEntries.reduce<Record<string, PendingEntryGroup>>((acc, entry) => {
    const key = `${entry.employeeName}|${entry.workDate}`
    if (!acc[key]) {
      acc[key] = {
        employeeName: entry.employeeName,
        employeeEmail: entry.employeeEmail,
        workDate: entry.workDate,
        entries: [],
      }
    }
    acc[key].entries.push(entry)
    return acc
  }, {})

  const groups = (Object.values(groupedEntries) as PendingEntryGroup[]).sort((a, b) => {
    return new Date(b.workDate ?? '').getTime() - new Date(a.workDate ?? '').getTime()
  })

  return (
    <div className="space-y-6">
      <Breadcrumb />
      <TimesheetsSubNav />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pending Approvals</h1>
          <p className="text-muted-foreground mt-1">
            Review and approve time entries submitted by employees
          </p>
        </div>
        {selectedEntries.size > 0 && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRejectModal({ open: true, entryIds: Array.from(selectedEntries) })}
              disabled={actionLoading}
            >
              <XCircle className="h-4 w-4 mr-1" />
              Reject ({selectedEntries.size})
            </Button>
            <Button
              size="sm"
              onClick={() => handleApprove(Array.from(selectedEntries))}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Approve ({selectedEntries.size})
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      {pendingEntries.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <EmptyState
              icon={Clock}
              title="No pending entries"
              description="All time entries have been approved or rejected."
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {groups.map((group, groupIndex: number) => (
            <Card key={groupIndex}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-semibold">{group.employeeName}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {formatDate(group.workDate ?? '')} • {group.entries.length} {group.entries.length === 1 ? 'entry' : 'entries'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setRejectModal({ open: true, entryIds: group.entries.map((e) => e.id) })}
                      disabled={actionLoading}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Reject All
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleApprove(group.entries.map((e) => e.id))}
                      disabled={actionLoading}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Approve All
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={group.entries.every((e) => selectedEntries.has(e.id))}
                          onCheckedChange={() => {
                            const allSelected = group.entries.every((e) => selectedEntries.has(e.id))
                            const newSelected = new Set(selectedEntries)
                            group.entries.forEach((e) => {
                              if (allSelected) {
                                newSelected.delete(e.id)
                              } else {
                                newSelected.add(e.id)
                              }
                            })
                            setSelectedEntries(newSelected)
                          }}
                        />
                      </TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Hours</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {group.entries.map((entry) => {
                      const hours = entry.totalHours || 0
                      return (
                        <TableRow key={entry.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedEntries.has(entry.id)}
                              onCheckedChange={() => toggleEntry(entry.id)}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm">
                              <Clock className="h-3 w-3 text-muted-foreground" />
                              {entry.startTime || '—'} - {entry.endTime || '—'}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">{entry.description || '—'}</span>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{hours.toFixed(1)}h</Badge>
                          </TableCell>
                          <TableCell>
                            {entry.billable ? (
                              <Badge variant="default" className="text-xs">Billable</Badge>
                            ) : (
                              <Badge variant="secondary" className="text-xs">Non-billable</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setRejectModal({ open: true, entryIds: [entry.id] })}
                                disabled={actionLoading}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleApprove([entry.id])}
                                disabled={actionLoading}
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={rejectModal.open} onOpenChange={(open) => setRejectModal({ open, entryIds: [] })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Time {rejectModal.entryIds.length === 1 ? 'Entry' : 'Entries'}</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting {rejectModal.entryIds.length === 1 ? 'this entry' : 'these entries'}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="reason">Reason</Label>
            <Textarea
              id="reason"
              placeholder="Enter rejection reason..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRejectModal({ open: false, entryIds: [] })
                setRejectionReason('')
              }}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={actionLoading || !rejectionReason.trim()}
            >
              {actionLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  Rejecting...
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 mr-1" />
                  Reject
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
