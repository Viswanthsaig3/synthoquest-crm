'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useAuth } from '@/context/auth-context'
import { Breadcrumb } from '@/components/layout/breadcrumb'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Select } from '@/components/ui/select'

import { formatDate, getInitials } from '@/lib/utils'
import { hasPermission } from '@/lib/client-permissions'
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Users,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Loader2
} from 'lucide-react'
import Link from 'next/link'
import { LeavesSubNav } from '@/components/leaves/leaves-subnav'
import type { Leave } from '@/types/leave'
import type { User } from '@/types/user'

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

const LEAVE_COLORS = {
  sick: 'bg-red-100 text-red-800 border-red-200',
  casual: 'bg-blue-100 text-blue-800 border-blue-200',
  paid: 'bg-green-100 text-green-800 border-green-200',
}

export default function LeaveCalendarPage() {
  const { user, token } = useAuth()
  const [loading, setLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedEmployee, setSelectedEmployee] = useState<string>('')
  const [filteredLeaves, setFilteredLeaves] = useState<Leave[]>([])
  const [managedUsers, setManagedUsers] = useState<User[]>([])

  useEffect(() => {
    if (!user || !token) return
    
    async function fetchData() {
      try {
        const year = currentDate.getFullYear()
        const month = currentDate.getMonth() + 1
        
        const [leavesRes, usersRes] = await Promise.all([
          fetch(`/api/leaves?year=${year}&month=${month}`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          hasPermission(user, 'leaves.approve') 
            ? fetch('/api/employees', {
                headers: { Authorization: `Bearer ${token}` }
              })
            : Promise.resolve(null)
        ])
        
        if (leavesRes.ok) {
          const data = await leavesRes.json()
          setFilteredLeaves(data.data || [])
        }
        
        if (usersRes && usersRes.ok) {
          const data = await usersRes.json()
          setManagedUsers(data.data || [])
        }
      } catch (error) {
        console.error('Error fetching calendar data:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [user, token, currentDate])

  if (!user) return null

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const isAdmin = hasPermission(user, 'leaves.approve')
  const visibleEmployeeIds = managedUsers.map(u => u.id)
  
  const currentMonth = currentDate.getMonth()
  const currentYear = currentDate.getFullYear()

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month, 1).getDay()
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate)
    if (direction === 'next') {
      newDate.setMonth(newDate.getMonth() + 1)
    } else {
      newDate.setMonth(newDate.getMonth() - 1)
    }
    setCurrentDate(newDate)
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  const getLeavesForDay = (day: number) => {
    const dayDate = new Date(currentYear, currentMonth, day)
    return filteredLeaves.filter(leave => {
      const start = new Date(leave.startDate)
      const end = new Date(leave.endDate)
      return dayDate >= start && dayDate <= end
    })
  }

  const daysInMonth = getDaysInMonth(currentMonth, currentYear)
  const firstDay = getFirstDayOfMonth(currentMonth, currentYear)
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)
  const emptyDays = Array.from({ length: firstDay === 0 ? 6 : firstDay - 1 }, (_, i) => i)

  const today = new Date()
  const isToday = (day: number) => {
    return day === today.getDate() && 
           currentMonth === today.getMonth() && 
           currentYear === today.getFullYear()
  }
  
  const employeeOptions = [
    { value: '', label: 'All Team Members' },
    ...managedUsers.map(u => ({ value: u.id, label: u.name }))
  ]

  const pendingLeaves = filteredLeaves.filter(l => l.status === 'pending').length
  const approvedLeaves = filteredLeaves.filter(l => l.status === 'approved').length

  return (
    <div className="space-y-6">
      <Breadcrumb />
      <LeavesSubNav />

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Leave Calendar</h1>
          <p className="text-muted-foreground">View team leave schedule</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/leaves/approvals">
            <Button variant="outline">
              {pendingLeaves > 0 && (
                <Badge className="mr-2 bg-yellow-100 text-yellow-800">{pendingLeaves}</Badge>
              )}
              Pending Approvals
            </Button>
          </Link>
          <Link href="/leaves">
            <Button variant="outline">Leave List</Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Team Members</p>
                <p className="text-2xl font-bold">{visibleEmployeeIds.length}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{pendingLeaves}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Approved</p>
                <p className="text-2xl font-bold text-green-600">{approvedLeaves}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Leaves</p>
                <p className="text-2xl font-bold">{filteredLeaves.length}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                <FileText className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={() => navigateMonth('prev')}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={() => navigateMonth('next')}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  {MONTHS[currentMonth]} {currentYear}
                </CardTitle>
              </div>
            </div>
            <div className="flex items-center gap-2 md:ml-auto">
              <Button variant="outline" size="sm" onClick={goToToday}>
                Today
              </Button>
              <Select
                value={selectedEmployee}
                onChange={(e) => setSelectedEmployee(e.target.value)}
                className="w-48"
              >
                {employeeOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
              <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
                {day}
              </div>
            ))}
            
            {emptyDays.map((_, index) => (
              <div key={`empty-${index}`} className="min-h-[100px] p-1 bg-muted/20 rounded"></div>
            ))}
            
            {days.map((day) => {
              const dayLeaves = getLeavesForDay(day)
              const hasLeaves = dayLeaves.length > 0
              const isWeekend = (firstDay + day - 1) % 7 >= 5
              
              return (
                <div
                  key={day}
                  className={`min-h-[100px] p-1 rounded border transition-colors ${
                    isToday(day) 
                      ? 'border-primary bg-primary/5' 
                      : isWeekend 
                        ? 'bg-muted/30 border-transparent'
                        : hasLeaves 
                          ? 'bg-card border-border'
                          : 'bg-card border-transparent hover:border-border'
                  }`}
                >
                  <div className={`text-sm font-medium mb-1 ${isToday(day) ? 'text-primary' : ''}`}>
                    {day}
                  </div>
                  <div className="space-y-1">
                    {dayLeaves.slice(0, 2).map((leave) => (
                      <div
                        key={leave.id}
                        className={`text-xs px-1 py-0.5 rounded truncate ${LEAVE_COLORS[leave.type]}`}
                        title={`${leave.employeeName}: ${leave.type}`}
                      >
                        {leave.employeeName}
                      </div>
                    ))}
                    {dayLeaves.length > 2 && (
                      <div className="text-xs text-muted-foreground px-1">
                        +{dayLeaves.length - 2} more
                      </div>
                    )}
                    {dayLeaves.length === 0 && (
                      <p className="text-xs text-muted-foreground text-center py-2 opacity-50">-</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="flex items-center gap-6 mt-6 pt-4 border-t">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-red-100 border border-red-200"></div>
              <span className="text-sm text-muted-foreground">Sick Leave</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-blue-100 border border-blue-200"></div>
              <span className="text-sm text-muted-foreground">Casual Leave</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-100 border border-green-200"></div>
              <span className="text-sm text-muted-foreground">Paid Leave</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Leave Summary by Employee</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {(selectedEmployee ? managedUsers.filter(u => u.id === selectedEmployee) : managedUsers).map((emp) => {
              const empLeaves = filteredLeaves.filter(l => l.employeeId === emp.id)
              const pending = empLeaves.filter(l => l.status === 'pending').length
              const approved = empLeaves.filter(l => l.status === 'approved').length
              
              return (
                <div key={emp.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={emp.avatar || undefined} />
                      <AvatarFallback>{getInitials(emp.name)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{emp.name}</p>
                      <p className="text-sm text-muted-foreground capitalize">{emp.department}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {pending > 0 && (
                      <Badge className="bg-yellow-100 text-yellow-800">
                        {pending} pending
                      </Badge>
                    )}
                    {approved > 0 && (
                      <Badge className="bg-green-100 text-green-800">
                        {approved} approved
                      </Badge>
                    )}
                    {empLeaves.length === 0 && (
                      <span className="text-sm text-muted-foreground">No leaves</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}