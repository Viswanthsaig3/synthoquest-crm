'use client'

import React, { useState } from 'react'
import { useAuth } from '@/context/auth-context'
import { Breadcrumb } from '@/components/layout/breadcrumb'
import { PageHeader, StatusBadge } from '@/components/shared'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select } from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { mockAttendance, getAttendanceByEmployee, getAttendanceSummary } from '@/lib/mock-data'
import { mockUsers } from '@/lib/mock-data/users'
import { formatDate, getInitials } from '@/lib/utils'
import { canViewTeamAttendance, getManagedUsers } from '@/lib/permissions'
import { Calendar, ChevronLeft, ChevronRight, Download, Users } from 'lucide-react'

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

export default function AttendanceHistoryPage() {
  const { user } = useAuth()
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth())
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
  const [selectedEmployee, setSelectedEmployee] = useState<string>('')

  if (!user) return null

  const showTeamView = canViewTeamAttendance(user)
  const managedUsers = getManagedUsers(user, mockUsers)
  const viewEmployeeId = selectedEmployee || user.id
  const viewEmployee = mockUsers.find(u => u.id === viewEmployeeId) || user

  const attendanceRecords = getAttendanceByEmployee(viewEmployeeId)

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month, 1).getDay()
  }

  const daysInMonth = getDaysInMonth(currentMonth, currentYear)
  const firstDay = getFirstDayOfMonth(currentMonth, currentYear)

  const getAttendanceForDay = (day: number) => {
    const date = new Date(currentYear, currentMonth, day)
    return attendanceRecords.find(a => a.date.toDateString() === date.toDateString())
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      if (currentMonth === 0) {
        setCurrentMonth(11)
        setCurrentYear(currentYear - 1)
      } else {
        setCurrentMonth(currentMonth - 1)
      }
    } else {
      if (currentMonth === 11) {
        setCurrentMonth(0)
        setCurrentYear(currentYear + 1)
      } else {
        setCurrentMonth(currentMonth + 1)
      }
    }
  }

  const presentDays = attendanceRecords.filter(a => a.status === 'present').length
  const absentDays = attendanceRecords.filter(a => a.status === 'absent').length
  const lateDays = attendanceRecords.filter(a => a.status === 'late').length

  return (
    <div className="space-y-6">
      <Breadcrumb />
      
      <PageHeader
        title="Attendance History"
        description={showTeamView ? "View attendance records for you and your team" : "View your attendance records"}
        exportData
      />

      {showTeamView && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Team Members
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
            >
              <option value="">My Attendance</option>
              {managedUsers.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.name}</option>
              ))}
            </Select>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="lg:col-span-3">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                {MONTHS[currentMonth]} {currentYear}
                {selectedEmployee && <span className="text-muted-foreground">- {viewEmployee.name}</span>}
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
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: firstDay }).map((_, i) => (
                <div key={`empty-${i}`} className="p-2 h-20"></div>
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1
                const attendance = getAttendanceForDay(day)
                const isWeekend = (firstDay + i) % 7 === 0 || (firstDay + i) % 7 === 6

                return (
                  <div
                    key={day}
                    className={`p-2 h-20 border rounded-lg ${
                      isWeekend ? 'bg-muted/30' : 'bg-card'
                    }`}
                  >
                    <div className="text-sm font-medium">{day}</div>
                    {attendance && !isWeekend && (
                      <div className="mt-1">
                        <Badge
                          variant="outline"
                          className={`text-xs ${
                            attendance.status === 'present' ? 'border-green-500 text-green-700' :
                            attendance.status === 'absent' ? 'border-red-500 text-red-700' :
                            attendance.status === 'late' ? 'border-yellow-500 text-yellow-700' :
                            'border-orange-500 text-orange-700'
                          }`}
                        >
                          {attendance.status === 'present' ? 'P' : 
                           attendance.status === 'absent' ? 'A' : 
                           attendance.status === 'late' ? 'L' : 'H'}
                        </Badge>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Legend</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge className="bg-green-500">P</Badge>
                <span className="text-sm">Present</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-red-500">A</Badge>
                <span className="text-sm">Absent</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-yellow-500">L</Badge>
                <span className="text-sm">Late</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-orange-500">H</Badge>
                <span className="text-sm">Half Day</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-gray-300">W</Badge>
                <span className="text-sm">Weekend</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Monthly Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Present</span>
                <Badge className="bg-green-500">{presentDays}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Absent</span>
                <Badge className="bg-red-500">{absentDays}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Late</span>
                <Badge className="bg-yellow-500">{lateDays}</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}