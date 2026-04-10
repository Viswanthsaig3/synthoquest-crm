'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/context/auth-context'
import { Breadcrumb } from '@/components/layout/breadcrumb'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/toast'
import { formatDate } from '@/lib/utils'
import { deleteTimesheet, getTimesheetById, getTimesheetEntries } from '@/lib/api/timesheets'
import { hasPermission } from '@/lib/client-permissions'
import type { Timesheet, TimesheetEntry, TimesheetApproval } from '@/types/timesheet'
import {
  ArrowLeft,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
  Trash2,
} from 'lucide-react'
import Link from 'next/link'
import { TimesheetsSubNav } from '@/components/timesheets/timesheets-subnav'

function entryStatusBadge(status: string | undefined) {
  const s = status || 'pending'
  if (s === 'approved') {
    return (
      <Badge variant="default" className="shrink-0 bg-green-600 hover:bg-green-600">
        Approved
      </Badge>
    )
  }
  if (s === 'rejected') {
    return (
      <Badge variant="destructive" className="shrink-0">
        Rejected
      </Badge>
    )
  }
  return (
    <Badge variant="secondary" className="shrink-0">
      Pending
    </Badge>
  )
}

export default function TimesheetDetailPage() {
  const { user } = useAuth()
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()

  const [timesheet, setTimesheet] = useState<Timesheet | null>(null)
  const [entries, setEntries] = useState<TimesheetEntry[]>([])
  const [approvals, setApprovals] = useState<TimesheetApproval[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  const timesheetId = params.id as string

  useEffect(() => {
    fetchTimesheet()
  }, [timesheetId])

  const fetchTimesheet = async () => {
    try {
      const response = await getTimesheetById(timesheetId)
      setTimesheet(response.data)
      setApprovals(response.approvals || [])

      const entriesRes = await getTimesheetEntries(timesheetId)
      setEntries(entriesRes.data || [])
    } catch (error) {
      console.error('Error fetching timesheet:', error)
      toast({
        title: 'Error',
        description: 'Failed to load timesheet',
        variant: 'destructive',
      })
      router.push('/timesheets')
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

  if (!timesheet) {
    return null
  }

  const isOwner = timesheet.employeeId === user.id
  const canDeleteTimesheet = isOwner
  const showApproverLink = hasPermission(user, 'timesheets.approve')

  const handleDeleteTimesheet = async () => {
    if (!canDeleteTimesheet) return
    const confirmed = window.confirm(
      'Delete this daily timesheet and all its time entries? This cannot be undone.'
    )
    if (!confirmed) return

    setActionLoading(true)
    try {
      await deleteTimesheet(timesheetId)
      toast({
        title: 'Timesheet deleted',
        description: 'The timesheet was removed.',
      })
      router.push('/timesheets')
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to delete timesheet'
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      })
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <Breadcrumb />
      <TimesheetsSubNav />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/timesheets">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Timesheet Details</h1>
            <p className="text-muted-foreground">
              {formatDate(new Date(timesheet.workDate))} - {timesheet.employeeName || 'Unknown'}
            </p>
          </div>
        </div>
      </div>

      <Card className="border-muted bg-muted/30">
        <CardContent className="py-4 text-sm text-muted-foreground">
          Time is logged per entry. Each entry is <strong className="text-foreground">pending</strong> until a
          manager or HR approves it under{' '}
          <Link href="/timesheets/approvals" className="font-medium text-primary underline">
            Timesheets → Approvals
          </Link>
          . You do not submit the whole day as one step.
        </CardContent>
      </Card>

      {timesheet.rejectionReason && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex items-start gap-3 py-4">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
            <div>
              <p className="font-medium text-red-800">Legacy timesheet note</p>
              <p className="text-sm text-red-600">{timesheet.rejectionReason}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Date</p>
                <p className="text-lg font-bold">{formatDate(new Date(timesheet.workDate))}</p>
              </div>
              <Calendar className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Hours</p>
                <p className="text-lg font-bold">{timesheet.totalHours}h</p>
              </div>
              <Clock className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Regular / Overtime</p>
                <p className="text-lg font-bold">
                  {timesheet.regularHours}h / {timesheet.overtimeHours}h
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle>Time Entries ({entries.length})</CardTitle>
          {showApproverLink && (
            <Button variant="outline" size="sm" asChild>
              <Link href="/timesheets/approvals">Review pending entries</Link>
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {entries.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No entries yet</p>
          ) : (
            <div className="space-y-4">
              {entries.map((entry) => (
                <div key={entry.id} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{entry.description || 'No description'}</p>
                      <p className="text-sm text-muted-foreground">{formatDate(new Date(entry.date))}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      {entryStatusBadge(entry.approvalStatus)}
                      <Badge variant="outline">{entry.totalHours}h</Badge>
                    </div>
                  </div>
                  {entry.approvalStatus === 'rejected' && entry.rejectionReason && (
                    <p className="text-sm text-destructive mb-2">Reason: {entry.rejectionReason}</p>
                  )}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    {entry.startTime && entry.endTime && (
                      <span>
                        {entry.startTime} - {entry.endTime}
                      </span>
                    )}
                    {entry.breakMinutes > 0 && <span>Break: {entry.breakMinutes}min</span>}
                    <span>{entry.billable ? 'Billable' : 'Non-billable'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {approvals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Timesheet-level approval history</CardTitle>
            <p className="text-sm font-normal text-muted-foreground">
              Older workflow; new entries use per-entry approval above.
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {approvals.map((approval) => (
                <div key={approval.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    {approval.action === 'approved' ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                    <div>
                      <p className="font-medium">{approval.approverName || 'Unknown'}</p>
                      {approval.comments && (
                        <p className="text-sm text-muted-foreground">{approval.comments}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={approval.action === 'approved' ? 'default' : 'destructive'}>
                      {approval.action}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end gap-4 flex-wrap">
        <Link href="/timesheets">
          <Button variant="outline">Back to List</Button>
        </Link>

        {canDeleteTimesheet && (
          <Button variant="destructive" onClick={handleDeleteTimesheet} disabled={actionLoading}>
            {actionLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete timesheet
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  )
}
