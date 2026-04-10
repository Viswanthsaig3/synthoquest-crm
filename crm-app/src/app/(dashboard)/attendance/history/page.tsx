'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { Breadcrumb } from '@/components/layout/breadcrumb'
import { PageHeader } from '@/components/shared'
import { AttendanceSubNav } from '@/components/attendance/attendance-subnav'
import { useAuth } from '@/context/auth-context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import type { AttendanceRecord } from '@/types/time-entry'
import { getAccessToken } from '@/lib/api/client'

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

export default function AttendanceHistoryPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth())
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const startOfMonth = new Date(currentYear, currentMonth, 1).toISOString().split('T')[0]
        const endOfMonth = new Date(currentYear, currentMonth + 1, 0).toISOString().split('T')[0]
        const token = getAccessToken()

        const selfId = user?.id
        const q = new URLSearchParams({
          fromDate: startOfMonth,
          toDate: endOfMonth,
        })
        if (selfId) q.set('userId', selfId)
        const attRes = await fetch(`/api/attendance/history?${q.toString()}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const attData = await attRes.json()
        setAttendance(attData.data || [])
      } catch (error) {
        console.error('Error fetching history:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [currentMonth, currentYear, user?.id])

  const navigateMonth = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      if (currentMonth === 0) {
        setCurrentMonth(11)
        setCurrentYear((year) => year - 1)
      } else {
        setCurrentMonth((month) => month - 1)
      }
    } else if (currentMonth === 11) {
      setCurrentMonth(0)
      setCurrentYear((year) => year + 1)
    } else {
      setCurrentMonth((month) => month + 1)
    }
  }

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
  const firstDay = new Date(currentYear, currentMonth, 1).getDay()
  const getAttendanceForDay = (day: number): { totalHours: number; status: string; geoWarning: boolean } | undefined => {
    const dateStr = `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
    const dayRows = attendance.filter((record) => record.date === dateStr)
    if (dayRows.length === 0) return undefined
    const totalHours = dayRows.reduce((sum, a) => sum + (a.totalHours || 0), 0)
    const status =
      dayRows.some((a) => a.status === 'late') ? 'late' : dayRows.some((a) => a.status === 'present') ? 'present' : 'absent'
    const geoWarning = dayRows.some(
      (a) => a.checkInInRadius === false || a.checkOutInRadius === false
    )
    return { totalHours, status, geoWarning }
  }

  const monthlyStats = useMemo(() => {
    const byDate = new Map<string, AttendanceRecord[]>()
    for (const a of attendance) {
      const list = byDate.get(a.date) ?? []
      list.push(a)
      byDate.set(a.date, list)
    }
    let presentDays = 0
    let lateDays = 0
    let totalHours = 0
    for (const [, list] of Array.from(byDate.entries())) {
      const dayHours = list.reduce((s, r) => s + (r.totalHours || 0), 0)
      totalHours += dayHours
      if (list.some((r) => r.status === 'present' || r.status === 'late')) presentDays++
      if (list.some((r) => r.status === 'late')) lateDays++
    }
    return { presentDays, lateDays, totalHours }
  }, [attendance])

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
      <PageHeader title="Attendance History" description="Monthly calendar view of your attendance." />

      <AttendanceSubNav />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="lg:col-span-3">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                {MONTHS[currentMonth]} {currentYear}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={() => navigateMonth('prev')}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={() => navigateMonth('next')}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: firstDay }).map((_, i) => (
                <div key={`empty-${i}`} className="p-2 h-24" />
              ))}

              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1
                const att = getAttendanceForDay(day)
                const dayOfWeek = (firstDay + i) % 7
                const isWeekend = dayOfWeek === 0 || dayOfWeek === 6

                return (
                  <div key={day} className={`p-2 h-24 border rounded-lg ${isWeekend ? 'bg-muted/30' : 'bg-card'}`}>
                    <div className="text-sm font-medium">{day}</div>
                    {att && !isWeekend && (
                      <div className="mt-1">
                        <Badge
                          className={
                            att.status === 'present'
                              ? 'bg-green-100 text-green-800 text-xs'
                              : att.status === 'late'
                              ? 'bg-yellow-100 text-yellow-800 text-xs'
                              : 'bg-gray-100 text-gray-800 text-xs'
                          }
                        >
                          {att.totalHours.toFixed(1)}h
                        </Badge>
                        {att.geoWarning && (
                          <Badge variant="destructive" className="mt-1 text-[10px]">
                            Geo warning
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Monthly Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Present Days</span>
              <Badge className="bg-green-500">{monthlyStats.presentDays}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Late Days</span>
              <Badge className="bg-yellow-500">{monthlyStats.lateDays}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Attendance Hours</span>
              <Badge>{monthlyStats.totalHours.toFixed(1)}h</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
