'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/context/auth-context'
import { Breadcrumb } from '@/components/layout/breadcrumb'
import { StatsCard } from '@/components/shared'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { mockAttendance, getAttendanceByEmployee, getAttendanceSummary } from '@/lib/mock-data'
import { formatTime, formatDate } from '@/lib/utils'
import { Calendar, Clock, CheckCircle, XCircle, TrendingUp, LogIn, LogOut } from 'lucide-react'
import Link from 'next/link'

export default function AttendancePage() {
  const { user } = useAuth()
  const [isCheckedIn, setIsCheckedIn] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  if (!user) return null

  const todayAttendance = mockAttendance.find(a => 
    a.employeeId === user.id && 
    a.date.toDateString() === new Date().toDateString()
  )

  const summary = getAttendanceSummary(user.id)

  const handleCheckIn = () => {
    setIsCheckedIn(true)
  }

  const handleCheckOut = () => {
    setIsCheckedIn(false)
  }

  return (
    <div className="space-y-6">
      <Breadcrumb />
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard
          title="Present Days"
          value={summary.present}
          icon={CheckCircle}
        />
        <StatsCard
          title="Absent Days"
          value={summary.absent}
          icon={XCircle}
        />
        <StatsCard
          title="Late Arrivals"
          value={summary.late}
          icon={Clock}
        />
        <StatsCard
          title="Avg Hours/Day"
          value={`${summary.averageHours.toFixed(1)}h`}
          icon={TrendingUp}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Check In/Out</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <p className="text-4xl font-mono font-bold">
                {currentTime.toLocaleTimeString()}
              </p>
              <p className="text-muted-foreground mt-1">
                {currentTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>

            {isCheckedIn ? (
              <Button onClick={handleCheckOut} variant="destructive" className="w-full h-16 text-lg">
                <LogOut className="h-6 w-6 mr-2" />
                Check Out
              </Button>
            ) : (
              <Button onClick={handleCheckIn} className="w-full h-16 text-lg">
                <LogIn className="h-6 w-6 mr-2" />
                Check In
              </Button>
            )}

            {todayAttendance && (
              <div className="space-y-3 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Check In:</span>
                  <span className="font-medium">
                    {todayAttendance.checkIn ? formatTime(todayAttendance.checkIn) : '-'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Check Out:</span>
                  <span className="font-medium">
                    {todayAttendance.checkOut ? formatTime(todayAttendance.checkOut) : '-'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Hours Worked:</span>
                  <Badge>{todayAttendance.hoursWorked}h</Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Weekly Summary</span>
              <Link href="/attendance/history">
                <Button variant="outline" size="sm">View History</Button>
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">This Week</span>
                  <span className="text-sm font-medium">42h / 40h</span>
                </div>
                <Progress value={105} className="h-2" />
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4">
                <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                  <p className="text-sm text-green-600">On Time</p>
                  <p className="text-2xl font-bold text-green-700">4 days</p>
                </div>
                <div className="p-4 rounded-lg bg-yellow-50 border border-yellow-200">
                  <p className="text-sm text-yellow-600">Late</p>
                  <p className="text-2xl font-bold text-yellow-700">1 day</p>
                </div>
              </div>

              <div className="pt-4 border-t">
                <h4 className="font-medium mb-3">Recent Days</h4>
                <div className="space-y-2">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((day, i) => (
                    <div key={day} className="flex items-center justify-between p-2 rounded bg-muted/50">
                      <span>{day}</span>
                      <Badge variant={i === 1 ? 'destructive' : 'default'}>
                        {i === 1 ? '9:15 AM (Late)' : '9:00 AM'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}