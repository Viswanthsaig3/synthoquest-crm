'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { Breadcrumb } from '@/components/layout/breadcrumb'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { StatusBadge, StatsCard, EmptyState } from '@/components/shared'
import { formatDate, getInitials, formatCurrency, formatTime, getErrorMessage } from '@/lib/utils'
import { useAuth } from '@/context/auth-context'
import { canManageAssignedEmployees, canManageEmployees } from '@/lib/permissions'
import { getEmployeeById } from '@/lib/api/employees'
import { getTasks } from '@/lib/api/tasks'
import { getTimesheets } from '@/lib/api/timesheets'
import { canViewEmployeeAttendanceHistory } from '@/lib/client-permissions'
import { getAccessToken } from '@/lib/api/client'
import type { User as UserType } from '@/types/user'
import type { Task } from '@/lib/db/queries/tasks'
import type { Timesheet } from '@/types/timesheet'
import type { AttendanceRecord } from '@/types/time-entry'
import { 
  ArrowLeft, 
  Edit, 
  Mail, 
  Phone, 
  Calendar,
  Building,
  CheckCircle,
  Clock,
  User as UserIcon,
  ClipboardList,
  IndianRupee,
  Eye,
  Loader2
} from 'lucide-react'
import Link from 'next/link'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export default function EmployeeProfilePage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user: currentUser } = useAuth()
  const employeeId = params.id as string
  const initialTab = searchParams.get('tab') || 'profile'

  const [loading, setLoading] = useState(true)
  const [employee, setEmployee] = useState<UserType | null>(null)
  const [assignedTasks, setAssignedTasks] = useState<Task[]>([])
  const [employeeTimesheets, setEmployeeTimesheets] = useState<Timesheet[]>([])
  const [activeTab, setActiveTab] = useState(initialTab)
  const [error, setError] = useState<string | null>(null)
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [attendanceLoading, setAttendanceLoading] = useState(false)

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const [employeeRes, tasksRes, timesheetsRes] = await Promise.all([
          getEmployeeById(employeeId),
          getTasks({ assignedTo: employeeId, limit: 100 }),
          getTimesheets({ employeeId, limit: 50 }),
        ])
        
        setEmployee(employeeRes.data)
        setAssignedTasks(tasksRes.data)
        setEmployeeTimesheets(timesheetsRes.data)
      } catch (err: unknown) {
        setError(getErrorMessage(err, 'Failed to load employee data'))
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [employeeId])

  useEffect(() => {
    if (!employee || !currentUser) return
    if (!canViewEmployeeAttendanceHistory(currentUser, employee)) return

    const run = async () => {
      try {
        setAttendanceLoading(true)
        const from = new Date()
        from.setDate(from.getDate() - 89)
        const fromDate = from.toISOString().split('T')[0]
        const toDate = new Date().toISOString().split('T')[0]
        const token = getAccessToken()
        const res = await fetch(
          `/api/attendance/history?userId=${encodeURIComponent(employee.id)}&fromDate=${fromDate}&toDate=${toDate}`,
          { headers: { Authorization: `Bearer ${token}` } }
        )
        const json = await res.json()
        if (!res.ok) throw new Error(json.error)
        setAttendanceRecords(json.data || [])
      } catch {
        setAttendanceRecords([])
      } finally {
        setAttendanceLoading(false)
      }
    }

    void run()
  }, [employee, currentUser])

  useEffect(() => {
    if (!employee || !currentUser) return
    const showAttendance =
      canViewEmployeeAttendanceHistory(currentUser, employee)
    const legacyTab = activeTab === 'leaves' || activeTab === 'payroll'
    const attendanceDenied = activeTab === 'attendance' && !showAttendance
    if (legacyTab || attendanceDenied) {
      setActiveTab('profile')
      const url = new URL(window.location.href)
      url.searchParams.set('tab', 'profile')
      window.history.replaceState({}, '', url.toString())
    }
  }, [employee, currentUser, activeTab])

  if (loading) {
    return (
      <div className="space-y-6">
        <Breadcrumb />
        <Card>
          <CardContent className="py-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
            <p className="text-muted-foreground mt-4">Loading employee data...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error || !employee) {
    return (
      <div className="space-y-6">
        <Breadcrumb />
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">{error || 'Employee not found'}</p>
            <Link href="/employees">
              <Button className="mt-4">Back to Employees</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const canManage =
    currentUser &&
    (canManageEmployees(currentUser) ||
      (canManageAssignedEmployees(currentUser) && employee.managedBy === currentUser.id))

  const showAttendanceTab =
    !!currentUser && canViewEmployeeAttendanceHistory(currentUser, employee)
  const daysWithCheckIn90d = new Set(
    attendanceRecords.filter((r) => r.checkInTime).map((r) => r.date)
  ).size

  const totalTimesheetHours = employeeTimesheets.reduce((sum, ts) => sum + (ts.totalHours || 0), 0)
  const timesheetDayCount = employeeTimesheets.length

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    const url = new URL(window.location.href)
    url.searchParams.set('tab', value)
    window.history.replaceState({}, '', url.toString())
  }

  return (
    <div className="space-y-6">
      <Breadcrumb />
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/employees">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={employee.avatar || undefined} />
              <AvatarFallback className="text-xl">{getInitials(employee.name)}</AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold">{employee.name}</h1>
                <Badge className={
                  employee.status === 'active' ? 'bg-green-100 text-green-800' :
                  employee.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                  'bg-red-100 text-red-800'
                }>
                  {employee.status}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Badge variant="outline" className="capitalize">{employee.department}</Badge>
                <span>•</span>
                <Badge className="capitalize">{employee.role.replace('_', ' ')}</Badge>
              </div>
            </div>
          </div>
        </div>
        {canManage && (
          <div className="flex items-center gap-2">
            <Link href={`/employees/${employee.id}/edit`}>
              <Button variant="outline">
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </Link>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <StatsCard
          title="Assigned Tasks"
          value={assignedTasks.filter(t => t.status !== 'completed' && t.status !== 'cancelled').length}
          icon={ClipboardList}
        />
        <StatsCard
          title="Completed Tasks"
          value={assignedTasks.filter(t => t.status === 'completed').length}
          icon={CheckCircle}
        />
        <StatsCard
          title="Days with check-in"
          value={String(daysWithCheckIn90d)}
          description="Last 90 days"
          icon={Calendar}
        />
        <StatsCard
          title="Timesheet Hours"
          value={`${totalTimesheetHours.toFixed(1)}h`}
          icon={Clock}
        />
        <StatsCard
          title="Monthly Salary"
          value={
            employee.compensationType === 'unpaid'
              ? 'Unpaid'
              : formatCurrency(employee.compensationAmount ?? employee.salary ?? 0)
          }
          icon={IndianRupee}
        />
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList
          className={`grid w-full ${showAttendanceTab ? 'grid-cols-4' : 'grid-cols-3'}`}
        >
          <TabsTrigger value="profile">
            <UserIcon className="h-4 w-4 mr-2" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="tasks">
            <ClipboardList className="h-4 w-4 mr-2" />
            Tasks
          </TabsTrigger>
          <TabsTrigger value="timesheets">
            <Clock className="h-4 w-4 mr-2" />
            Timesheets
          </TabsTrigger>
          {showAttendanceTab && (
            <TabsTrigger value="attendance">
              <Calendar className="h-4 w-4 mr-2" />
              Attendance
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{employee.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="font-medium">{employee.phone || 'Not provided'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Join Date</p>
                    <p className="font-medium">{formatDate(new Date(employee.joinDate))}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Department</p>
                    <p className="font-medium capitalize">{employee.department}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Check-in days (90d)</span>
                      <span className="text-sm font-medium">
                        {Math.min(100, Math.round((daysWithCheckIn90d / 90) * 100))}%
                      </span>
                    </div>
                    <Progress
                      value={Math.min(100, (daysWithCheckIn90d / 90) * 100)}
                      className="h-2"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Task Completion</span>
                      <span className="text-sm font-medium">
                        {assignedTasks.length > 0 
                          ? Math.round((assignedTasks.filter(t => t.status === 'completed').length / assignedTasks.length) * 100)
                          : 0}%
                      </span>
                    </div>
                    <Progress 
                      value={assignedTasks.length > 0 
                        ? (assignedTasks.filter(t => t.status === 'completed').length / assignedTasks.length) * 100
                        : 0} 
                      className="h-2" 
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Recent Tasks</CardTitle>
              </CardHeader>
              <CardContent>
                {assignedTasks.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No tasks assigned</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {assignedTasks.slice(0, 5).map(task => (
                        <TableRow key={task.id}>
                          <TableCell className="font-medium">{task.title}</TableCell>
                          <TableCell className="capitalize">{task.type}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={
                              task.priority === 'urgent' ? 'border-red-500 text-red-700' :
                              task.priority === 'high' ? 'border-orange-500 text-orange-700' :
                              task.priority === 'medium' ? 'border-blue-500 text-blue-700' :
                              'border-gray-500 text-gray-700'
                            }>
                              {task.priority}
                            </Badge>
                          </TableCell>
                          <TableCell>{task.dueDate ? formatDate(new Date(task.dueDate)) : 'No due date'}</TableCell>
                          <TableCell>
                            <Badge className={
                              task.status === 'completed' ? 'bg-green-100 text-green-800' :
                              task.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                              task.status === 'pending' ? 'bg-gray-100 text-gray-800' :
                              task.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }>
                              {task.status.replace('_', ' ')}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="tasks" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>All Assigned Tasks</CardTitle>
              <CardDescription>{assignedTasks.length} tasks assigned to this employee</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {assignedTasks.length === 0 ? (
                <EmptyState
                  icon={ClipboardList}
                  title="No tasks assigned"
                  description="Tasks assigned to this employee will appear here."
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Hours</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assignedTasks.map((task) => (
                      <TableRow key={task.id}>
                        <TableCell className="font-medium">{task.title}</TableCell>
                        <TableCell className="capitalize">{task.type}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={
                            task.priority === 'urgent' ? 'border-red-500 text-red-700' :
                            task.priority === 'high' ? 'border-orange-500 text-orange-700' :
                            task.priority === 'medium' ? 'border-blue-500 text-blue-700' :
                            'border-gray-500 text-gray-700'
                          }>
                            {task.priority}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={
                            task.status === 'completed' ? 'bg-green-100 text-green-800' :
                            task.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                            task.status === 'pending' ? 'bg-gray-100 text-gray-800' :
                            task.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }>
                            {task.status.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>{task.dueDate ? formatDate(new Date(task.dueDate)) : '-'}</TableCell>
                        <TableCell>{task.actualHours || 0}h / {task.estimatedHours || 0}h</TableCell>
                        <TableCell className="text-right">
                          <Link href={`/tasks/${task.id}`}>
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
        </TabsContent>

        <TabsContent value="timesheets" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Hours</p>
                    <p className="text-2xl font-bold">{totalTimesheetHours.toFixed(1)}h</p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <Clock className="h-5 w-5 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Days with logs</p>
                    <p className="text-2xl font-bold">{timesheetDayCount}</p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Timesheet Records</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {employeeTimesheets.length === 0 ? (
                <EmptyState
                  icon={Clock}
                  title="No timesheets"
                  description="Timesheet records will appear here."
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Total Hours</TableHead>
                      <TableHead>Regular</TableHead>
                      <TableHead>Overtime</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {employeeTimesheets.map((ts) => (
                      <TableRow key={ts.id}>
                        <TableCell>
                          {formatDate(new Date(ts.workDate))}
                        </TableCell>
                        <TableCell>{ts.totalHours?.toFixed(1) || 0}h</TableCell>
                        <TableCell>{ts.regularHours?.toFixed(1) || 0}h</TableCell>
                        <TableCell>{ts.overtimeHours?.toFixed(1) || 0}h</TableCell>
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
        </TabsContent>

        {showAttendanceTab && (
          <TabsContent value="attendance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Attendance history</CardTitle>
                <CardDescription>
                  Last 90 days — check-in/out times and geofence evaluation (office / home).
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {attendanceLoading ? (
                  <div className="py-12 text-center">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : attendanceRecords.length === 0 ? (
                  <EmptyState
                    icon={Calendar}
                    title="No attendance rows"
                    description="No records in this period."
                  />
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Check in</TableHead>
                        <TableHead>Check out</TableHead>
                        <TableHead>In radius (in)</TableHead>
                        <TableHead>In radius (out)</TableHead>
                        <TableHead>Distance in (m)</TableHead>
                        <TableHead>Distance out (m)</TableHead>
                        <TableHead>Late</TableHead>
                        <TableHead>Hours</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {attendanceRecords.map((r) => (
                        <TableRow key={r.id}>
                          <TableCell>{formatDate(new Date(r.date))}</TableCell>
                          <TableCell>
                            {r.checkInTime ? formatTime(new Date(r.checkInTime)) : '—'}
                          </TableCell>
                          <TableCell>
                            {r.checkOutTime ? formatTime(new Date(r.checkOutTime)) : '—'}
                          </TableCell>
                          <TableCell>
                            {r.checkInInRadius === true ? 'Yes' : r.checkInInRadius === false ? 'No' : '—'}
                          </TableCell>
                          <TableCell>
                            {r.checkOutInRadius === true ? 'Yes' : r.checkOutInRadius === false ? 'No' : '—'}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {r.checkInDistanceMeters != null ? Math.round(r.checkInDistanceMeters) : '—'}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {r.checkOutDistanceMeters != null ? Math.round(r.checkOutDistanceMeters) : '—'}
                          </TableCell>
                          <TableCell>
                            {r.isLate ? `Yes (${r.lateByMinutes}m)` : 'No'}
                          </TableCell>
                          <TableCell>{r.totalHours?.toFixed(1) ?? '—'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
