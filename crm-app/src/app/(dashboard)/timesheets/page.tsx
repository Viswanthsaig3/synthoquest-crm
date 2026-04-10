'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/context/auth-context'
import { Breadcrumb } from '@/components/layout/breadcrumb'
import { PageHeader, EmptyState } from '@/components/shared'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select } from '@/components/ui/select'
import { formatDate, getErrorMessage } from '@/lib/utils'
import type { Timesheet } from '@/types/timesheet'
import { canApproveTimesheet } from '@/lib/permissions'
import {
  getMyTimesheetEntryStats,
  getPendingTimesheetEntriesTotal,
  getTimesheets,
} from '@/lib/api/timesheets'
import { hasPermission } from '@/lib/client-permissions'
import { AlertCircle, Calendar, CheckCircle, Clock, Eye, Loader2, LogIn, LogOut, Plus, Users } from 'lucide-react'
import Link from 'next/link'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useToast } from '@/components/ui/toast'
import { getTodayDateKey } from '@/lib/date-utils'
import { TimesheetsSubNav } from '@/components/timesheets/timesheets-subnav'
import { fetchWithAccessTokenRefresh } from '@/lib/api/auth-fetch'
import { getCurrentPositionForAttendance } from '@/lib/client-geolocation'
import type { TodayAttendanceSummary } from '@/types/time-entry'

export default function TimesheetsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [selectedEmployee, setSelectedEmployee] = useState<string>('')
  const [timesheets, setTimesheets] = useState<Timesheet[]>([])
  const [pendingEntryTotal, setPendingEntryTotal] = useState(0)
  const [myEntryStats, setMyEntryStats] = useState({ pending: 0, approved: 0, rejected: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    void fetchTimesheets()
    const isMgr = canApproveTimesheet(user) && hasPermission(user, 'timesheets.view_all')
    if (isMgr) {
      void fetchPendingEntryTotal()
    } else {
      void fetchMyEntryStats()
    }
  }, [user])

  const fetchTimesheets = async () => {
    try {
      const response = await getTimesheets({ limit: 100 })
      setTimesheets(response.data || [])
    } catch (error) {
      console.error('Error fetching timesheets:', error)
      toast({
        title: 'Error',
        description: 'Failed to load timesheets',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchPendingEntryTotal = async () => {
    try {
      const total = await getPendingTimesheetEntriesTotal()
      setPendingEntryTotal(total)
    } catch (error) {
      console.error('Error fetching pending entry count:', error)
    }
  }

  const fetchMyEntryStats = async () => {
    try {
      const res = await getMyTimesheetEntryStats()
      setMyEntryStats(res.data)
    } catch (error) {
      console.error('Error fetching my entry stats:', error)
    }
  }

  if (!user || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const isManager = canApproveTimesheet(user) && hasPermission(user, 'timesheets.view_all')

  if (isManager) {
    return (
      <ManagerTimesheetView
        selectedEmployee={selectedEmployee}
        setSelectedEmployee={setSelectedEmployee}
        pendingEntryTotal={pendingEntryTotal}
        allTimesheets={timesheets}
      />
    )
  }

  return (
    <EmployeeTimesheetView
      timesheets={timesheets.filter((ts) => ts.employeeId === user.id)}
      myEntryStats={myEntryStats}
    />
  )
}

function ManagerTimesheetView({
  selectedEmployee,
  setSelectedEmployee,
  pendingEntryTotal,
  allTimesheets,
}: {
  selectedEmployee: string
  setSelectedEmployee: (id: string) => void
  pendingEntryTotal: number
  allTimesheets: Timesheet[]
}) {
  const [dateFilter, setDateFilter] = useState<string>('this_week')

  const filteredTimesheets = useMemo(() => {
    let filtered = allTimesheets
    if (selectedEmployee) {
      filtered = filtered.filter((ts) => ts.employeeId === selectedEmployee)
    }

    const now = new Date()
    const todayKey = now.toISOString().slice(0, 10)
    const weekStart = new Date(now)
    const day = weekStart.getDay()
    const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1)
    weekStart.setDate(diff)
    weekStart.setHours(0, 0, 0, 0)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 6)

    if (dateFilter === 'today') {
      filtered = filtered.filter((ts) => String(ts.workDate).slice(0, 10) === todayKey)
    } else if (dateFilter === 'this_week') {
      filtered = filtered.filter((ts) => {
        const d = new Date(ts.workDate)
        return d >= weekStart && d <= weekEnd
      })
    } else if (dateFilter === 'last_week') {
      const lastWeekStart = new Date(weekStart)
      lastWeekStart.setDate(lastWeekStart.getDate() - 7)
      const lastWeekEnd = new Date(weekEnd)
      lastWeekEnd.setDate(lastWeekEnd.getDate() - 7)
      filtered = filtered.filter((ts) => {
        const d = new Date(ts.workDate)
        return d >= lastWeekStart && d <= lastWeekEnd
      })
    } else if (dateFilter === 'this_month') {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      filtered = filtered.filter((ts) => {
        const d = new Date(ts.workDate)
        return d >= monthStart && d <= monthEnd
      })
    }

    return filtered
  }, [allTimesheets, dateFilter, selectedEmployee])

  const dateOptions = [
    { value: 'today', label: 'Today' },
    { value: 'this_week', label: 'This Week' },
    { value: 'last_week', label: 'Last Week' },
    { value: 'this_month', label: 'This Month' },
    { value: 'all', label: 'All Time' },
  ]

  return (
    <div className="space-y-6">
      <Breadcrumb />
      <TimesheetsSubNav />
      <PageHeader
        title="Team Timesheets"
        description={`${pendingEntryTotal} pending time entries awaiting approval`}
      />

      {pendingEntryTotal > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="font-medium text-yellow-800">
                  {pendingEntryTotal} pending time {pendingEntryTotal === 1 ? 'entry' : 'entries'}
                </p>
                <p className="text-sm text-yellow-600">Review and approve under Timesheets → Approvals</p>
              </div>
            </div>
            <Link href="/timesheets/approvals">
              <Button>View Approvals</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Team Timesheet Records
            </CardTitle>
            <div className="flex flex-wrap gap-2 md:ml-auto">
              <Select value={selectedEmployee} onChange={(e) => setSelectedEmployee(e.target.value)} className="w-48">
                <option value="">All Employees</option>
              </Select>
              <Select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="w-40">
                {dateOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredTimesheets.length === 0 ? (
            <EmptyState icon={Clock} title="No timesheets found" description="No daily timesheet records match your filters." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Hours</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTimesheets.map((ts) => (
                  <TableRow key={ts.id}>
                    <TableCell>
                      <span className="font-medium">{ts.employeeName || 'Unknown'}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {formatDate(ts.workDate)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{ts.totalHours}h</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/timesheets/${ts.id}`}>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
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
  )
}

function EmployeeTimesheetView({
  timesheets,
  myEntryStats,
}: {
  timesheets: Timesheet[]
  myEntryStats: { pending: number; approved: number; rejected: number }
}) {
  const { toast } = useToast()
  const [attendanceSummary, setAttendanceSummary] = useState<TodayAttendanceSummary | null>(null)
  const [attendanceLoading, setAttendanceLoading] = useState(false)
  const [attendanceActionLoading, setAttendanceActionLoading] = useState(false)
  const todayKey = getTodayDateKey()

  useEffect(() => {
    void fetchTodayAttendance()
  }, [])

  const fetchTodayAttendance = async () => {
    try {
      setAttendanceLoading(true)
      const response = await fetchWithAccessTokenRefresh('/api/attendance/today')
      const result = await response.json()
      if (response.ok) setAttendanceSummary(result.data || null)
    } catch (error) {
      console.error('Error loading attendance:', error)
    } finally {
      setAttendanceLoading(false)
    }
  }

  const handleCheckIn = async () => {
    try {
      setAttendanceActionLoading(true)
      const loc = await getCurrentPositionForAttendance()
      if (!loc.ok) {
        toast({
          title: 'Location required',
          description: loc.message,
          variant: 'destructive',
        })
        return
      }
      const response = await fetchWithAccessTokenRefresh('/api/attendance/today', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          latitude: loc.latitude,
          longitude: loc.longitude,
        }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Failed to check in')
      await fetchTodayAttendance()
      toast({ title: 'Checked in' })
    } catch (error: unknown) {
      toast({ title: 'Error', description: getErrorMessage(error, 'Failed to check in'), variant: 'destructive' })
    } finally {
      setAttendanceActionLoading(false)
    }
  }

  const handleCheckOut = async () => {
    try {
      setAttendanceActionLoading(true)
      const loc = await getCurrentPositionForAttendance()
      if (!loc.ok) {
        toast({
          title: 'Location required',
          description: loc.message,
          variant: 'destructive',
        })
        return
      }
      const response = await fetchWithAccessTokenRefresh('/api/attendance/today', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          latitude: loc.latitude,
          longitude: loc.longitude,
        }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Failed to check out')
      await fetchTodayAttendance()
      toast({ title: 'Checked out' })
    } catch (error: unknown) {
      toast({ title: 'Error', description: getErrorMessage(error, 'Failed to check out'), variant: 'destructive' })
    } finally {
      setAttendanceActionLoading(false)
    }
  }

  const todayTimesheet = timesheets.find((ts) => String(ts.workDate).slice(0, 10) === todayKey)
  const monthStart = new Date()
  monthStart.setDate(1)
  monthStart.setHours(0, 0, 0, 0)
  const monthHours = timesheets
    .filter((ts) => new Date(ts.workDate) >= monthStart)
    .reduce((sum, ts) => sum + (ts.totalHours || 0), 0)
  const pendingCount = myEntryStats.pending
  const approvedCount = myEntryStats.approved
  const openAttendanceSession = attendanceSummary?.openSession
  const checkedIn = !!openAttendanceSession

  return (
    <div className="space-y-6">
      <Breadcrumb />
      <TimesheetsSubNav />
      <PageHeader
        title="My Timesheets"
        description="Log time entries for each day; managers approve entries under Approvals"
      />

      <Card>
        <CardHeader>
          <CardTitle>Today Attendance</CardTitle>
        </CardHeader>
        <CardContent>
          {attendanceLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading...
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="text-sm text-muted-foreground space-y-1">
                <div>
                  Total today:{' '}
                  <span className="font-medium text-foreground">
                    {attendanceSummary?.totalHoursTodayApprox?.toFixed(2) ?? '0.00'}h
                  </span>
                  {attendanceSummary && attendanceSummary.sessions.length > 0 && (
                    <span className="text-xs"> ({attendanceSummary.sessions.length} session(s))</span>
                  )}
                </div>
                {openAttendanceSession?.checkInTime && (
                  <div>
                    Current session since{' '}
                    {new Date(openAttendanceSession.checkInTime).toLocaleTimeString()}
                  </div>
                )}
                {!openAttendanceSession && (attendanceSummary?.sessions?.length ?? 0) > 0 && (
                  <div>Between sessions — check in when you resume work.</div>
                )}
              </div>
              {!openAttendanceSession ? (
                <Button onClick={handleCheckIn} disabled={attendanceActionLoading}>
                  {attendanceActionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <LogIn className="h-4 w-4 mr-2" />}
                  Check In
                </Button>
              ) : (
                <Button variant="destructive" onClick={handleCheckOut} disabled={attendanceActionLoading}>
                  {attendanceActionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <LogOut className="h-4 w-4 mr-2" />}
                  Check Out
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">This Month</p>
                <p className="text-2xl font-bold">{monthHours.toFixed(1)}h</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Approved</p>
                <p className="text-2xl font-bold text-green-600">{approvedCount}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Today&apos;s Timesheet
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Date</p>
              <p className="font-medium">{formatDate(todayKey)}</p>
              {todayTimesheet && (
                <p className="text-sm text-muted-foreground">{todayTimesheet.totalHours}h logged</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {todayTimesheet ? (
                <>
                  <Link href={`/timesheets/new?date=${todayKey}`}>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-1" />
                      Log time
                    </Button>
                  </Link>
                  <Link href={`/timesheets/${todayTimesheet.id}`}>
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                  </Link>
                </>
              ) : (
                <Link href={`/timesheets/new?date=${todayKey}`}>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    Log Today
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Timesheets</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {timesheets.length === 0 ? (
            <EmptyState icon={Clock} title="No timesheets" description="Log your first daily timesheet to get started." />
          ) : (
            <div className="divide-y">
              {timesheets.slice(0, 10).map((ts) => (
                <div key={ts.id} className="p-4 flex items-center justify-between hover:bg-muted/50">
                  <div className="flex items-center gap-4">
                    <p className="text-sm font-medium">{formatDate(ts.workDate)}</p>
                    <p className="font-medium">{ts.totalHours} hours</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <Link href={`/timesheets/${ts.id}`}>
                      <Button variant="ghost" size="icon">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
