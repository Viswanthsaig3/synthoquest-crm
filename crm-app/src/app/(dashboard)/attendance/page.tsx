'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useAuth } from '@/context/auth-context'
import { Breadcrumb } from '@/components/layout/breadcrumb'
import { StatsCard } from '@/components/shared'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Select } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { mockAttendance, getAttendanceByEmployee, getAttendanceSummary, getTeamAttendanceSummary, getTodayTeamAttendance } from '@/lib/mock-data'
import { mockUsers } from '@/lib/mock-data/users'
import { formatTime, formatDate, getInitials } from '@/lib/utils'
import { canViewTeamAttendance, getManagedUsers } from '@/lib/permissions'
import { Calendar, Clock, CheckCircle, XCircle, TrendingUp, LogIn, LogOut, Users, Search, UserCheck, UserX, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export default function AttendancePage() {
  const { user } = useAuth()

  if (!user) return null

  const showTeamView = canViewTeamAttendance(user)

  if (showTeamView) {
    return <TeamAttendanceView user={user} />
  }

  return <EmployeeAttendanceView user={user} />
}

function TeamAttendanceView({ user }: { user: typeof mockUsers[0] }) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('')

  const managedUsers = getManagedUsers(user, mockUsers)
  const allEmployeeIds = user.role === 'admin' || user.role === 'hr' 
    ? mockUsers.filter(u => u.role === 'employee' || u.role === 'sales_rep').map(u => u.id)
    : managedUsers.map(u => u.id)

  const teamSummary = getTeamAttendanceSummary(allEmployeeIds)
  const todayAttendance = getTodayTeamAttendance(allEmployeeIds)

  const filteredEmployees = useMemo(() => {
    const employees = user.role === 'admin' || user.role === 'hr'
      ? mockUsers.filter(u => u.role === 'employee' || u.role === 'sales_rep')
      : managedUsers

    return employees.filter(emp => {
      const matchesSearch = emp.name.toLowerCase().includes(search.toLowerCase()) ||
        emp.email.toLowerCase().includes(search.toLowerCase())
      
      const empToday = todayAttendance.find(a => a.employeeId === emp.id)
      const matchesStatus = !statusFilter || 
        (statusFilter === 'present' && empToday?.status === 'present') ||
        (statusFilter === 'late' && empToday?.status === 'late') ||
        (statusFilter === 'absent' && empToday?.status === 'absent') ||
        (statusFilter === 'not_checked_in' && !empToday)
      
      const matchesDepartment = !departmentFilter || emp.department === departmentFilter
      
      return matchesSearch && matchesStatus && matchesDepartment
    })
  }, [search, statusFilter, departmentFilter, managedUsers, todayAttendance, user.role])

  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'present', label: 'Present' },
    { value: 'late', label: 'Late' },
    { value: 'absent', label: 'Absent' },
    { value: 'not_checked_in', label: 'Not Checked In' }
  ]

  const departmentOptions = [
    { value: '', label: 'All Departments' },
    { value: 'sales', label: 'Sales' },
    { value: 'training', label: 'Training' },
    { value: 'marketing', label: 'Marketing' }
  ]

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'present':
        return <Badge className="bg-green-100 text-green-800">Present</Badge>
      case 'late':
        return <Badge className="bg-yellow-100 text-yellow-800">Late</Badge>
      case 'absent':
        return <Badge className="bg-red-100 text-red-800">Absent</Badge>
      case 'half_day':
        return <Badge className="bg-purple-100 text-purple-800">Half Day</Badge>
      default:
        return <Badge variant="outline" className="text-gray-500">Not Checked In</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <Breadcrumb />
      
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Team Attendance</h1>
          <p className="text-muted-foreground">Monitor team attendance and check-in status</p>
        </div>
        <Link href="/attendance/history">
          <Button variant="outline">
            <Calendar className="h-4 w-4 mr-2" />
            View History
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatsCard
          title="Total Employees"
          value={teamSummary.totalEmployees}
          icon={Users}
        />
        <StatsCard
          title="Present"
          value={teamSummary.present}
          icon={UserCheck}
          description="On time today"
        />
        <StatsCard
          title="Late"
          value={teamSummary.late}
          icon={AlertCircle}
          description="Late arrivals"
        />
        <StatsCard
          title="Absent"
          value={teamSummary.absent}
          icon={UserX}
          description="Not present"
        />
        <StatsCard
          title="Not Checked In"
          value={teamSummary.notCheckedIn}
          icon={Clock}
          description="Pending check-in"
        />
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Today's Attendance - {formatDate(new Date())}
            </CardTitle>
            <div className="flex flex-wrap gap-2 md:ml-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search employees..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-40"
              >
                {statusOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </Select>
              <Select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="w-40"
              >
                {departmentOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Check In</TableHead>
                <TableHead>Check Out</TableHead>
                <TableHead>Hours</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEmployees.map((employee) => {
                const empToday = todayAttendance.find(a => a.employeeId === employee.id)
                return (
                  <TableRow key={employee.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={employee.avatar || undefined} />
                          <AvatarFallback>{getInitials(employee.name)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{employee.name}</p>
                          <p className="text-xs text-muted-foreground">{employee.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {employee.department}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(empToday?.status)}
                    </TableCell>
                    <TableCell>
                      {empToday?.checkIn ? formatTime(empToday.checkIn) : '-'}
                    </TableCell>
                    <TableCell>
                      {empToday?.checkOut ? formatTime(empToday.checkOut) : '-'}
                    </TableCell>
                    <TableCell>
                      {empToday?.hoursWorked ? `${empToday.hoursWorked}h` : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/employees/${employee.id}?tab=attendance`}>
                        <Button variant="ghost" size="sm">
                          View History
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Attendance Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Present Today</span>
                  <span className="text-sm font-medium">
                    {teamSummary.present + teamSummary.late} / {teamSummary.totalEmployees}
                  </span>
                </div>
                <Progress 
                  value={(teamSummary.present + teamSummary.late) / teamSummary.totalEmployees * 100} 
                  className="h-2" 
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">On Time Rate</span>
                  <span className="text-sm font-medium">
                    {teamSummary.present > 0 
                      ? Math.round(teamSummary.present / (teamSummary.present + teamSummary.late) * 100) 
                      : 0}%
                  </span>
                </div>
                <Progress 
                  value={teamSummary.present > 0 
                    ? teamSummary.present / (teamSummary.present + teamSummary.late) * 100 
                    : 0} 
                  className="h-2 [&>div]:bg-green-500" 
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/attendance/history" className="block">
              <Button variant="outline" className="w-full justify-start">
                <Calendar className="h-4 w-4 mr-2" />
                View Attendance History
              </Button>
            </Link>
            <Link href="/reports?tab=attendance" className="block">
              <Button variant="outline" className="w-full justify-start">
                <TrendingUp className="h-4 w-4 mr-2" />
                Attendance Reports
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function EmployeeAttendanceView({ user }: { user: typeof mockUsers[0] }) {
  const [isCheckedIn, setIsCheckedIn] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

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
      
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">My Attendance</h1>
          <p className="text-muted-foreground">Track your daily check-in and check-out</p>
        </div>
        <Link href="/attendance/history">
          <Button variant="outline">
            <Calendar className="h-4 w-4 mr-2" />
            View History
          </Button>
        </Link>
      </div>

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
            <CardTitle>Weekly Summary</CardTitle>
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