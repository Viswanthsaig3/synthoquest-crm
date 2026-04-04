'use client'

import React, { useState, useMemo } from 'react'
import { useAuth } from '@/context/auth-context'
import { Breadcrumb } from '@/components/layout/breadcrumb'
import { PageHeader, StatusBadge, EmptyState } from '@/components/shared'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Select } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { formatDate, getInitials } from '@/lib/utils'
import { canApproveTimesheet, canSubmitTimesheet, getTeamMemberIds, getManagedUsers } from '@/lib/permissions'
import { 
  getTimesheetsByEmployee, 
  getPendingTimesheets, 
  getWeekStart, 
  getWeekTimesheetData,
  getPendingTimesheetsByTeam,
  getAllTimesheets,
  getTimesheetsForManager
} from '@/lib/mock-data'
import { mockUsers } from '@/lib/mock-data/users'
import { Clock, Plus, Eye, ChevronLeft, ChevronRight, CheckCircle, AlertCircle, Calendar, Users, User } from 'lucide-react'
import Link from 'next/link'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export default function TimesheetsPage() {
  const { user } = useAuth()
  const [currentWeekStart, setCurrentWeekStart] = useState(() => getWeekStart(new Date()))
  const [selectedEmployee, setSelectedEmployee] = useState<string>('')

  if (!user) return null

  const canApprove = canApproveTimesheet(user)
  const canSubmit = canSubmitTimesheet(user)
  const isManager = canApprove && user.role !== 'employee'

  const managedUsers = getManagedUsers(user, mockUsers)
  const teamMemberIds = getTeamMemberIds(user.id, mockUsers)

  const getVisibleTimesheets = () => {
    if (user.role === 'admin' || user.role === 'hr') {
      return getAllTimesheets()
    }
    if (user.role === 'team_lead') {
      return getTimesheetsForManager(user.id, mockUsers)
    }
    return getTimesheetsByEmployee(user.id)
  }

  const pendingTimesheets = canApprove 
    ? getPendingTimesheetsByTeam([...teamMemberIds, user.id])
    : []

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newWeek = new Date(currentWeekStart)
    newWeek.setDate(newWeek.getDate() + (direction === 'next' ? 7 : -7))
    setCurrentWeekStart(newWeek)
  }

  const goToToday = () => {
    setCurrentWeekStart(getWeekStart(new Date()))
  }

  const isCurrentWeek = () => {
    const todayWeek = getWeekStart(new Date())
    return todayWeek.getTime() === currentWeekStart.getTime()
  }

  if (isManager) {
    return <ManagerTimesheetView 
      user={user} 
      managedUsers={managedUsers}
      selectedEmployee={selectedEmployee}
      setSelectedEmployee={setSelectedEmployee}
      pendingTimesheets={pendingTimesheets}
      allTimesheets={getVisibleTimesheets()}
    />
  }

  return <EmployeeTimesheetView 
    user={user}
    currentWeekStart={currentWeekStart}
    setCurrentWeekStart={setCurrentWeekStart}
    navigateWeek={navigateWeek}
    goToToday={goToToday}
    isCurrentWeek={isCurrentWeek}
  />
}

function ManagerTimesheetView({ 
  user, 
  managedUsers, 
  selectedEmployee, 
  setSelectedEmployee,
  pendingTimesheets,
  allTimesheets 
}: { 
  user: typeof mockUsers[0]
  managedUsers: typeof mockUsers
  selectedEmployee: string
  setSelectedEmployee: (id: string) => void
  pendingTimesheets: typeof mockTimesheets
  allTimesheets: typeof mockTimesheets
}) {
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [weekFilter, setWeekFilter] = useState<string>('this_week')

  const filteredTimesheets = useMemo(() => {
    let filtered = allTimesheets
    
    if (selectedEmployee) {
      filtered = filtered.filter(ts => ts.employeeId === selectedEmployee)
    }
    
    if (statusFilter) {
      filtered = filtered.filter(ts => ts.status === statusFilter)
    }

    const now = new Date()
    const weekStart = getWeekStart(now)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 6)

    if (weekFilter === 'this_week') {
      filtered = filtered.filter(ts => {
        const tsDate = new Date(ts.date)
        return tsDate >= weekStart && tsDate <= weekEnd
      })
    } else if (weekFilter === 'last_week') {
      const lastWeekStart = new Date(weekStart)
      lastWeekStart.setDate(lastWeekStart.getDate() - 7)
      const lastWeekEnd = new Date(weekStart)
      lastWeekEnd.setDate(lastWeekEnd.getDate() - 1)
      filtered = filtered.filter(ts => {
        const tsDate = new Date(ts.date)
        return tsDate >= lastWeekStart && tsDate <= lastWeekEnd
      })
    } else if (weekFilter === 'this_month') {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      filtered = filtered.filter(ts => {
        const tsDate = new Date(ts.date)
        return tsDate >= monthStart && tsDate <= monthEnd
      })
    }

    return filtered
  }, [allTimesheets, selectedEmployee, statusFilter, weekFilter])

  const employeeOptions = [
    { value: '', label: 'All Employees' },
    ...managedUsers.map(u => ({ value: u.id, label: u.name }))
  ]

  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'submitted', label: 'Submitted' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' }
  ]

  const weekOptions = [
    { value: 'this_week', label: 'This Week' },
    { value: 'last_week', label: 'Last Week' },
    { value: 'this_month', label: 'This Month' },
    { value: 'all', label: 'All Time' }
  ]

  return (
    <div className="space-y-6">
      <Breadcrumb />
      
      <PageHeader
        title="Team Timesheets"
        description={`${pendingTimesheets.length} pending approvals`}
      />

      {pendingTimesheets.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="font-medium text-yellow-800">{pendingTimesheets.length} pending timesheet approvals</p>
                <p className="text-sm text-yellow-600">Review and approve team timesheets</p>
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
              <Select
                value={selectedEmployee}
                onChange={(e) => setSelectedEmployee(e.target.value)}
                className="w-48"
              >
                {employeeOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </Select>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-36"
              >
                {statusOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </Select>
              <Select
                value={weekFilter}
                onChange={(e) => setWeekFilter(e.target.value)}
                className="w-36"
              >
                {weekOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredTimesheets.length === 0 ? (
            <EmptyState
              icon={Clock}
              title="No timesheets found"
              description="No timesheet records match your filters."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Hours</TableHead>
                  <TableHead>Tasks</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTimesheets.map((ts) => {
                  const employee = mockUsers.find(u => u.id === ts.employeeId)
                  return (
                    <TableRow key={ts.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={employee?.avatar} />
                            <AvatarFallback>{employee ? getInitials(employee.name) : '?'}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{ts.employeeName}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {formatDate(ts.date)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{ts.totalHours}h</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {ts.entries.length} task{ts.entries.length > 1 ? 's' : ''}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={ts.status} />
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
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function EmployeeTimesheetView({ 
  user,
  currentWeekStart,
  setCurrentWeekStart,
  navigateWeek,
  goToToday,
  isCurrentWeek
}: { 
  user: typeof mockUsers[0]
  currentWeekStart: Date
  setCurrentWeekStart: (date: Date) => void
  navigateWeek: (direction: 'prev' | 'next') => void
  goToToday: () => void
  isCurrentWeek: () => boolean
}) {
  const myTimesheets = getTimesheetsByEmployee(user.id)
  const weekData = getWeekTimesheetData(user.id, currentWeekStart)

  const pendingCount = myTimesheets.filter(ts => ts.status === 'submitted').length
  const approvedCount = myTimesheets.filter(ts => ts.status === 'approved').length

  return (
    <div className="space-y-6">
      <Breadcrumb />
      
      <PageHeader
        title="My Timesheets"
        description="Log your daily work hours"
        action={{ label: 'Log Time', href: '/timesheets/new' }}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">This Week</p>
                <p className="text-2xl font-bold">{weekData.totalHours}h</p>
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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={() => navigateWeek('prev')}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={() => navigateWeek('next')}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Week of {formatDate(currentWeekStart)}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {formatDate(weekData.weekStart)} - {formatDate(weekData.weekEnd)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {!isCurrentWeek() && (
                <Button variant="outline" size="sm" onClick={goToToday}>
                  Today
                </Button>
              )}
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Week Total</p>
                <p className="text-2xl font-bold">{weekData.totalHours}h</p>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 md:grid-cols-7 gap-2">
            {weekData.days.map((day, index) => {
              const isWeekend = index >= 5
              const hasTimesheet = !!day.timesheet
              const isToday = formatDateKey(day.date) === formatDateKey(new Date())
              
              return (
                <div
                  key={index}
                  className={cn(
                    "border rounded-lg p-4 min-h-[140px] transition-colors",
                    isWeekend && "bg-muted/30",
                    isToday && "border-primary",
                    !isWeekend && !hasTimesheet && "border-dashed",
                    hasTimesheet && "bg-card"
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={cn(
                      "text-sm font-medium",
                      isToday && "text-primary"
                    )}>
                      {day.dayName}
                    </span>
                    {isToday && (
                      <Badge variant="default" className="text-xs">Today</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">
                    {day.date.getDate()}
                  </p>
                  
                  {isWeekend ? (
                    <div className="flex items-center justify-center h-16 text-muted-foreground text-sm">
                      Off
                    </div>
                  ) : hasTimesheet ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold">{day.hours}h</span>
                        <StatusBadge status={day.timesheet!.status} />
                      </div>
                      <Link href={`/timesheets/${day.timesheet!.id}`}>
                        <Button variant="outline" size="sm" className="w-full">
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <Link href={`/timesheets/new?date=${formatDateKey(day.date)}`}>
                      <Button variant="ghost" size="sm" className="w-full h-16 border border-dashed">
                        <Plus className="h-4 w-4 mr-1" />
                        Log
                      </Button>
                    </Link>
                  )}
                </div>
              )
            })}
          </div>

          <div className="flex items-center gap-6 mt-6 pt-4 border-t">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-sm text-muted-foreground">Approved</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span className="text-sm text-muted-foreground">Submitted</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span className="text-sm text-muted-foreground">Rejected</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full border-2 border-dashed border-gray-300"></div>
              <span className="text-sm text-muted-foreground">Not logged</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Timesheets</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {myTimesheets.length === 0 ? (
            <EmptyState
              icon={Clock}
              title="No timesheets"
              description="Log your first timesheet to get started."
            />
          ) : (
            <div className="divide-y">
              {myTimesheets.slice(0, 10).map((ts) => (
                <div key={ts.id} className="p-4 flex items-center justify-between hover:bg-muted/50">
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <p className="text-sm font-medium">{formatDate(ts.date)}</p>
                      <p className="text-xs text-muted-foreground">
                        {ts.date.toLocaleDateString('en-US', { weekday: 'short' })}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium">{ts.totalHours} hours</p>
                      <p className="text-sm text-muted-foreground">
                        {ts.entries.length} task{ts.entries.length > 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <StatusBadge status={ts.status} />
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

function formatDateKey(date: Date): string {
  return date.toISOString().split('T')[0]
}

import { mockTimesheets } from '@/lib/mock-data'