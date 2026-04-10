'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Breadcrumb } from '@/components/layout/breadcrumb'
import { AttendanceSubNav } from '@/components/attendance/attendance-subnav'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'
import { formatDate, formatTime } from '@/lib/utils'
import { AlertCircle, Clock, Loader2, LogIn, LogOut, Activity } from 'lucide-react'
import type { AttendanceRecord, TodayAttendanceSummary } from '@/types/time-entry'
import { fetchWithAccessTokenRefresh } from '@/lib/api/auth-fetch'
import { getCurrentPositionForAttendance } from '@/lib/client-geolocation'
import { useAttendanceHeartbeat } from '@/hooks/use-attendance-heartbeat'

export default function AttendancePage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState<TodayAttendanceSummary | null>(null)
  const [tick, setTick] = useState(0)
  const [showAutoCheckoutAlert, setShowAutoCheckoutAlert] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const attRes = await fetchWithAccessTokenRefresh('/api/attendance/today')
      const attData = await attRes.json()
      setSummary(attData.data || null)
    } catch (error) {
      console.error('Error fetching attendance:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const openSession = summary?.openSession ?? null
  const isCheckedIn = Boolean(openSession)

  const handleAutoCheckout = useCallback(() => {
    setShowAutoCheckoutAlert(true)
    toast({
      title: 'Session ended',
      description: 'You were automatically checked out due to inactivity.',
      variant: 'destructive',
    })
    fetchData()
  }, [fetchData, toast])

  const handleHeartbeatError = useCallback((error: Error) => {
    console.error('[Heartbeat] Error in hook:', error)
  }, [])

  useAttendanceHeartbeat({
    isCheckedIn,
    onAutoCheckout: handleAutoCheckout,
    onError: handleHeartbeatError,
  })

  useEffect(() => {
    if (!openSession?.checkInTime) return
    const interval = setInterval(() => setTick((t) => t + 1), 1000)
    return () => clearInterval(interval)
  }, [openSession?.id])

  const handleAttendanceAction = async (method: 'POST' | 'PUT') => {
    try {
      const loc = await getCurrentPositionForAttendance()
      if (!loc.ok) {
        toast({
          title: 'Location required',
          description: loc.message,
          variant: 'destructive',
        })
        return
      }

      const res = await fetchWithAccessTokenRefresh('/api/attendance/today', {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          latitude: loc.latitude,
          longitude: loc.longitude,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      const session = data.data as AttendanceRecord

      toast({
        title: method === 'POST' ? 'Checked in' : 'Checked out',
        description:
          method === 'POST'
            ? session?.isLate
              ? `You are ${session.lateByMinutes} minutes late (first arrival today)`
              : 'On time!'
            : `This session: ${session?.totalHours?.toFixed(1) ?? '?'} hours`,
      })

      if (method === 'POST' && session?.checkInInRadius === false) {
        toast({
          title: 'Outside allowed radius',
          description: 'Your attendance was recorded and an out-of-radius warning was raised.',
          variant: 'destructive',
        })
      }
      if (method === 'PUT' && session?.checkOutInRadius === false) {
        toast({
          title: 'Outside allowed radius',
          description: 'Your attendance was recorded and an out-of-radius warning was raised.',
          variant: 'destructive',
        })
      }

      fetchData()
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Attendance action failed'
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      })
    }
  }

  const formatElapsed = (ms: number) => {
    const h = Math.floor(ms / 3600000)
    const m = Math.floor((ms % 3600000) / 60000)
    const s = Math.floor((ms % 60000) / 1000)
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const runningMs = useMemo(() => {
    if (!openSession?.checkInTime) return 0
    return Date.now() - new Date(openSession.checkInTime).getTime()
  }, [openSession?.checkInTime, openSession?.id, tick])
  const completedH = summary?.completedHoursToday ?? 0
  const totalDayHours = completedH + runningMs / 3600000

  const completedSessions = (summary?.sessions ?? []).filter((s) => s.checkOutTime)
  const firstLate = (summary?.sessions ?? []).find((s) => s.isLate)

  if (loading) {
    return (
      <div className="space-y-6">
        <Breadcrumb />
        <Card>
          <CardContent className="py-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Breadcrumb />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Attendance</h1>
          <p className="text-muted-foreground">{formatDate(new Date())}</p>
        </div>
        <AttendanceSubNav />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Today</CardTitle>
          <CardDescription>
            Multiple sessions per day: check out to end a block, then check in again when you resume.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center py-6 bg-muted/50 rounded-lg space-y-2">
            <p className="text-5xl font-mono font-bold">
              {openSession ? formatElapsed(runningMs) : '00:00:00'}
            </p>
            <p className="text-sm text-muted-foreground">Current session (HH : MM : SS)</p>
            <p className="text-lg font-semibold text-primary">
              Total today: {totalDayHours.toFixed(2)}h
            </p>
          </div>

          {completedSessions.length > 0 && (
            <div className="space-y-2 text-sm border rounded-lg p-3">
              <p className="font-medium text-muted-foreground">Completed sessions</p>
              <ul className="space-y-2">
                {completedSessions.map((s, i) => (
                  <li key={s.id} className="flex justify-between gap-2 border-b border-border/50 pb-2 last:border-0 last:pb-0">
                    <span>
                      #{i + 1}{' '}
                      {s.checkInTime && formatTime(new Date(s.checkInTime))} –{' '}
                      {s.checkOutTime && formatTime(new Date(s.checkOutTime))}
                    </span>
                    <span className="font-medium tabular-nums">{s.totalHours?.toFixed(2) ?? '—'}h</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {openSession && (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">This session started</span>
                <span className="font-medium">
                  {openSession.checkInTime
                    ? formatTime(new Date(openSession.checkInTime))
                    : '—'}
                </span>
              </div>
              {openSession.lastActivity && (
                <div className="flex items-center gap-2 text-green-600">
                  <Activity className="h-4 w-4 shrink-0" />
                  <span>Last activity: {formatTime(new Date(openSession.lastActivity))}</span>
                </div>
              )}
              {openSession.autoCheckout && (
                <div className="flex items-center gap-2 text-orange-600">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>
                    Auto-checkout ({openSession.autoCheckoutReason || 'system'})
                  </span>
                </div>
              )}
              {openSession.checkInInRadius === false && (
                <div className="flex items-center gap-2 text-red-600">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>
                    Check-in outside radius ({openSession.checkInDistanceMeters ?? '-'}m from{' '}
                    {openSession.checkInNearestType || 'reference'})
                  </span>
                </div>
              )}
            </div>
          )}

          {showAutoCheckoutAlert && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-sm">
              <div className="flex items-center gap-2 text-orange-700 font-medium mb-2">
                <AlertCircle className="h-4 w-4" />
                <span>Auto-checkout detected</span>
              </div>
              <p className="text-orange-600">
                Your session was automatically ended due to inactivity. If this was incorrect,
                please contact your manager or HR to request an adjustment.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => setShowAutoCheckoutAlert(false)}
              >
                Dismiss
              </Button>
            </div>
          )}

          {!openSession && firstLate && (
            <div className="flex items-center gap-2 text-yellow-600 text-sm">
              <AlertCircle className="h-4 w-4" />
              <span>Late on first arrival today by {firstLate.lateByMinutes} minutes</span>
            </div>
          )}

          {completedSessions.some(
            (s) => s.checkOutInRadius === false || s.checkInInRadius === false
          ) && (
            <div className="flex items-center gap-2 text-red-600 text-sm">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>One or more sessions have a geofence warning (see History).</span>
            </div>
          )}

          {!openSession ? (
            <Button onClick={() => handleAttendanceAction('POST')} className="w-full h-14 text-lg">
              <LogIn className="h-5 w-5 mr-2" />
              Check In
            </Button>
          ) : (
            <Button onClick={() => handleAttendanceAction('PUT')} variant="destructive" className="w-full h-14 text-lg">
              <LogOut className="h-5 w-5 mr-2" />
              Check Out
            </Button>
          )}

          {!openSession && completedSessions.length > 0 && (
            <p className="text-center text-sm text-muted-foreground">
              <Clock className="inline h-4 w-4 mr-1 align-text-bottom" />
              Start another work block with Check In when you return.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
