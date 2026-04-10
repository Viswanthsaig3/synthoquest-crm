'use client'

import React, { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Breadcrumb } from '@/components/layout/breadcrumb'
import { PageHeader, EmptyState } from '@/components/shared'
import { AttendanceSubNav } from '@/components/attendance/attendance-subnav'
import { AttendanceAdjustmentModal } from '@/components/attendance/attendance-adjustment-modal'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/context/auth-context'
import { canViewTeamAttendance, hasPermission, canAdjustAttendanceRecords } from '@/lib/client-permissions'
import { formatDate, formatTime } from '@/lib/utils'
import { Loader2, UserCircle, Edit3 } from 'lucide-react'
import type { AttendanceRecord } from '@/types/time-entry'
import { useToast } from '@/components/ui/toast'
import { getAccessToken } from '@/lib/api/client'

type TeamRow = {
  userId: string
  name: string
  email: string
  department: string
  role: string
  record: AttendanceRecord | null
  sessionsToday: AttendanceRecord[]
}

type Stats = {
  total: number
  checkedInNoCheckout: number
  notCheckedIn: number
  betweenSessions: number
  late: number
  outOfRadius: number
}

export default function AttendanceTeamTodayPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const canAccess = canViewTeamAttendance(user)
  const canFilterDept =
    user &&
    hasPermission(user, 'employees.view_all') &&
    hasPermission(user, 'attendance.view_team')
  const canAdjust = canAdjustAttendanceRecords(user)

  const [loading, setLoading] = useState(true)
  const [rows, setRows] = useState<TeamRow[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [workDate, setWorkDate] = useState(() => new Date().toISOString().split('T')[0])
  const [departmentInput, setDepartmentInput] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('')
  const [adjustModalOpen, setAdjustModalOpen] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null)
  const [selectedUserName, setSelectedUserName] = useState<string>('')
  const [adjustingUserId, setAdjustingUserId] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!canAccess) return
    try {
      setLoading(true)
      const token = getAccessToken()
      const params = new URLSearchParams()
      params.set('date', workDate)
      if (canFilterDept && departmentFilter.trim()) {
        params.set('department', departmentFilter.trim())
      }
      const res = await fetch(`/api/attendance/team-today?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to load team attendance')
      setRows(json.data || [])
      setStats(json.stats || null)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to load'
      toast({ title: 'Error', description: msg, variant: 'destructive' })
      setRows([])
      setStats(null)
    } finally {
      setLoading(false)
    }
  }, [canAccess, canFilterDept, departmentFilter, toast, workDate])

  useEffect(() => {
    void load()
  }, [load])

  if (!user) return null

  if (!canAccess) {
    return (
      <div className="space-y-6">
        <Breadcrumb />
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            You do not have permission to view team attendance.
          </CardContent>
        </Card>
      </div>
    )
  }

  function statusLabel(row: TeamRow): { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' } {
    const sessions = row.sessionsToday ?? []
    const open = sessions.find((s) => s.checkInTime && !s.checkOutTime)
    if (open) {
      return { label: 'Checked in', variant: 'default' }
    }
    if (sessions.length > 0) {
      return { label: 'Between sessions', variant: 'secondary' }
    }
    return { label: 'Not checked in', variant: 'outline' }
  }

  const handleOpenAdjustModal = (record: AttendanceRecord, userName: string) => {
    setSelectedRecord(record)
    setSelectedUserName(userName)
    setAdjustModalOpen(true)
  }

  const handleAdjustSuccess = () => {
    load()
  }

  return (
    <div className="space-y-6">
      <Breadcrumb />
      <PageHeader
        title="Team attendance"
        description={`Who is present for ${formatDate(new Date(workDate + 'T12:00:00'))}.`}
      />

      <AttendanceSubNav />

      <div className="flex flex-col gap-4 md:flex-row md:items-end">
        <div className="space-y-2">
          <Label htmlFor="workDate">Date</Label>
          <Input
            id="workDate"
            type="date"
            value={workDate}
            onChange={(e) => setWorkDate(e.target.value)}
            className="w-auto"
          />
        </div>
        {canFilterDept && (
          <div className="space-y-2">
            <Label htmlFor="dept">Department (optional)</Label>
            <div className="flex gap-2">
              <Input
                id="dept"
                placeholder="e.g. engineering"
                value={departmentInput}
                onChange={(e) => setDepartmentInput(e.target.value)}
                className="w-56"
              />
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setDepartmentFilter(departmentInput.trim())
                }}
              >
                Apply
              </Button>
            </div>
          </div>
        )}
      </div>

      {stats && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground">In scope</p>
              <p className="text-2xl font-semibold">{stats.total}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground">Checked in (here)</p>
              <p className="text-2xl font-semibold text-primary">{stats.checkedInNoCheckout}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground">Not checked in</p>
              <p className="text-2xl font-semibold">{stats.notCheckedIn}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground">Between sessions</p>
              <p className="text-2xl font-semibold">{stats.betweenSessions}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground">Late</p>
              <p className="text-2xl font-semibold text-amber-600">{stats.late}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground">Out of radius</p>
              <p className="text-2xl font-semibold text-destructive">{stats.outOfRadius}</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Roster</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-12 text-center">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : rows.length === 0 ? (
            <EmptyState
              icon={UserCircle}
              title="No people in scope"
              description="Adjust department filter or permissions."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 pr-3">Name</th>
                    <th className="pb-2 pr-3">Department</th>
                    <th className="pb-2 pr-3">Status</th>
                    <th className="pb-2 pr-3">Check in</th>
                    <th className="pb-2 pr-3">Check out</th>
                    <th className="pb-2 pr-3">Geofence (in)</th>
                    <th className="pb-2 pr-3">Distance (m)</th>
                    <th className="pb-2 text-right">Profile</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => {
                    const s = statusLabel(row)
                    const r = row.record
                    return (
                      <tr key={row.userId} className="border-b border-border/60">
                        <td className="py-2 pr-3 font-medium">{row.name}</td>
                        <td className="py-2 pr-3 capitalize">{row.department}</td>
                        <td className="py-2 pr-3">
                          <Badge variant={s.variant}>{s.label}</Badge>
                          {r?.isLate && (
                            <span className="ml-2 text-xs text-amber-600">Late</span>
                          )}
                        </td>
                        <td className="py-2 pr-3">
                          {r?.checkInTime ? formatTime(new Date(r.checkInTime)) : '—'}
                        </td>
                        <td className="py-2 pr-3">
                          {r?.checkOutTime ? formatTime(new Date(r.checkOutTime)) : '—'}
                        </td>
                        <td className="py-2 pr-3">
                          {r?.checkInTime
                            ? r.checkInInRadius === false
                              ? 'No'
                              : r.checkInInRadius === true
                                ? 'Yes'
                                : '—'
                            : '—'}
                        </td>
                        <td className="py-2 pr-3 text-muted-foreground">
                          {r?.checkInDistanceMeters != null ? Math.round(r.checkInDistanceMeters) : '—'}
                        </td>
<td className="py-2 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {canAdjust && r && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenAdjustModal(r, row.name)}
                                title="Adjust attendance"
                              >
                                <Edit3 className="h-4 w-4" />
                              </Button>
                            )}
                            <Link href={`/employees/${row.userId}?tab=attendance`}>
                              <Button variant="ghost" size="sm">
                                View
                              </Button>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <AttendanceAdjustmentModal
        open={adjustModalOpen}
        onOpenChange={setAdjustModalOpen}
        record={selectedRecord}
        userName={selectedUserName}
        onSuccess={handleAdjustSuccess}
      />
    </div>
  )
}
