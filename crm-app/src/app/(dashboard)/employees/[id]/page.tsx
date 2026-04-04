'use client'

import React, { useState, useMemo } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { Breadcrumb } from '@/components/layout/breadcrumb'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { StatusBadge, StatsCard, EmptyState } from '@/components/shared'
import { mockUsers, getUserById } from '@/lib/mock-data'
import { mockLeads, getLeadsByAssignee } from '@/lib/mock-data'
import { mockTasks, getTasksByAssignee } from '@/lib/mock-data'
import { mockAttendance, getAttendanceByEmployee, getAttendanceSummary } from '@/lib/mock-data'
import { mockTimesheets, getTimesheetsByEmployee, getEmployeeTimesheetSummary } from '@/lib/mock-data'
import { mockLeaves, getLeavesByEmployee, getLeaveBalance } from '@/lib/mock-data'
import { mockPayroll, getPayrollByEmployee } from '@/lib/mock-data'
import { formatDate, getInitials, formatCurrency, formatTime } from '@/lib/utils'
import { useAuth } from '@/context/auth-context'
import { canManageEmployees } from '@/lib/permissions'
import { 
  ArrowLeft, 
  Edit, 
  Mail, 
  Phone, 
  Calendar,
  Building,
  CheckCircle,
  Clock,
  FileText,
  DollarSign,
  User,
  ClipboardList,
  CalendarDays,
  IndianRupee,
  Download,
  Eye
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
  const employee = getUserById(employeeId)
  const initialTab = searchParams.get('tab') || 'profile'

  const [activeTab, setActiveTab] = useState(initialTab)

  if (!employee) {
    return (
      <div className="space-y-6">
        <Breadcrumb />
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Employee not found</p>
            <Link href="/employees">
              <Button className="mt-4">Back to Employees</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const canManage = currentUser && canManageEmployees(currentUser)
  const assignedLeads = getLeadsByAssignee(employeeId)
  const assignedTasks = getTasksByAssignee(employeeId)
  const attendanceSummary = getAttendanceSummary(employeeId)
  const timesheetSummary = getEmployeeTimesheetSummary(employeeId)
  const leaveBalance = getLeaveBalance(employeeId)
  const employeeLeaves = getLeavesByEmployee(employeeId)
  const employeePayroll = getPayrollByEmployee(employeeId)
  const employeeAttendance = getAttendanceByEmployee(employeeId)
  const employeeTimesheets = getTimesheetsByEmployee(employeeId)

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
                <StatusBadge status={employee.status} />
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
            <Link href={`/employees/${employee.id}?edit=true`}>
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
          title="Assigned Leads"
          value={assignedLeads.length}
          icon={User}
        />
        <StatsCard
          title="Active Tasks"
          value={assignedTasks.filter(t => t.status !== 'done').length}
          icon={ClipboardList}
        />
        <StatsCard
          title="Attendance Rate"
          value={`${Math.round((attendanceSummary.present / attendanceSummary.totalDays) * 100)}%`}
          icon={Calendar}
        />
        <StatsCard
          title="Hours This Month"
          value={`${timesheetSummary.totalHours}h`}
          icon={Clock}
        />
        <StatsCard
          title="Monthly Salary"
          value={formatCurrency(employee.salary || 0)}
          icon={IndianRupee}
        />
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="profile">
            <User className="h-4 w-4 mr-2" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="attendance">
            <Calendar className="h-4 w-4 mr-2" />
            Attendance
          </TabsTrigger>
          <TabsTrigger value="timesheets">
            <Clock className="h-4 w-4 mr-2" />
            Timesheets
          </TabsTrigger>
          <TabsTrigger value="leaves">
            <CalendarDays className="h-4 w-4 mr-2" />
            Leaves
          </TabsTrigger>
          <TabsTrigger value="payroll">
            <IndianRupee className="h-4 w-4 mr-2" />
            Payroll
          </TabsTrigger>
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
                    <p className="font-medium">{employee.phone}</p>
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
                      <span className="text-sm text-muted-foreground">Attendance Rate</span>
                      <span className="text-sm font-medium">
                        {Math.round((attendanceSummary.present / attendanceSummary.totalDays) * 100)}%
                      </span>
                    </div>
                    <Progress 
                      value={(attendanceSummary.present / attendanceSummary.totalDays) * 100} 
                      className="h-2" 
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Task Completion</span>
                      <span className="text-sm font-medium">
                        {assignedTasks.length > 0 
                          ? Math.round((assignedTasks.filter(t => t.status === 'done').length / assignedTasks.length) * 100)
                          : 0}%
                      </span>
                    </div>
                    <Progress 
                      value={assignedTasks.length > 0 
                        ? (assignedTasks.filter(t => t.status === 'done').length / assignedTasks.length) * 100
                        : 0} 
                      className="h-2" 
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Lead Conversion</span>
                      <span className="text-sm font-medium">
                        {assignedLeads.length > 0
                          ? Math.round((assignedLeads.filter(l => l.status === 'converted').length / assignedLeads.length) * 100)
                          : 0}%
                      </span>
                    </div>
                    <Progress 
                      value={assignedLeads.length > 0
                        ? (assignedLeads.filter(l => l.status === 'converted').length / assignedLeads.length) * 100
                        : 0} 
                      className="h-2" 
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Tasks</CardTitle>
              </CardHeader>
              <CardContent>
                {assignedTasks.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No tasks assigned</p>
                ) : (
                  <div className="space-y-3">
                    {assignedTasks.slice(0, 5).map(task => (
                      <div key={task.id} className="flex items-center justify-between p-3 rounded-lg border">
                        <div>
                          <p className="font-medium">{task.title}</p>
                          <p className="text-sm text-muted-foreground">Due: {formatDate(task.deadline)}</p>
                        </div>
                        <StatusBadge status={task.status} />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Assigned Leads</CardTitle>
              </CardHeader>
              <CardContent>
                {assignedLeads.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No leads assigned</p>
                ) : (
                  <div className="space-y-3">
                    {assignedLeads.slice(0, 5).map(lead => (
                      <div key={lead.id} className="flex items-center justify-between p-3 rounded-lg border">
                        <div>
                          <p className="font-medium">{lead.name}</p>
                          <p className="text-sm text-muted-foreground">{lead.courseInterested}</p>
                        </div>
                        <StatusBadge status={lead.status} />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="attendance" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Present Days</p>
                    <p className="text-2xl font-bold text-green-600">{attendanceSummary.present}</p>
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
                    <p className="text-sm text-muted-foreground">Absent Days</p>
                    <p className="text-2xl font-bold text-red-600">{attendanceSummary.absent}</p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Late Arrivals</p>
                    <p className="text-2xl font-bold text-yellow-600">{attendanceSummary.late}</p>
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
                    <p className="text-sm text-muted-foreground">Avg Hours</p>
                    <p className="text-2xl font-bold">{attendanceSummary.averageHours.toFixed(1)}h</p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <Clock className="h-5 w-5 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Attendance History</CardTitle>
              <CardDescription>Last 30 days attendance records</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {employeeAttendance.length === 0 ? (
                <EmptyState
                  icon={Calendar}
                  title="No attendance records"
                  description="Attendance records will appear here."
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Check In</TableHead>
                      <TableHead>Check Out</TableHead>
                      <TableHead>Hours</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {employeeAttendance.slice(0, 20).map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>{formatDate(record.date)}</TableCell>
                        <TableCell>{record.checkIn ? formatTime(record.checkIn) : '-'}</TableCell>
                        <TableCell>{record.checkOut ? formatTime(record.checkOut) : '-'}</TableCell>
                        <TableCell>{record.hoursWorked}h</TableCell>
                        <TableCell>
                          <Badge className={
                            record.status === 'present' ? 'bg-green-100 text-green-800' :
                            record.status === 'late' ? 'bg-yellow-100 text-yellow-800' :
                            record.status === 'absent' ? 'bg-red-100 text-red-800' :
                            'bg-purple-100 text-purple-800'
                          }>
                            {record.status.replace('_', ' ')}
                          </Badge>
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Hours</p>
                    <p className="text-2xl font-bold">{timesheetSummary.totalHours}h</p>
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
                    <p className="text-sm text-muted-foreground">Pending</p>
                    <p className="text-2xl font-bold text-yellow-600">{timesheetSummary.submitted}</p>
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
                    <p className="text-2xl font-bold text-green-600">{timesheetSummary.approved}</p>
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
                    <p className="text-sm text-muted-foreground">Rejected</p>
                    <p className="text-2xl font-bold text-red-600">{timesheetSummary.rejected}</p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                    <Clock className="h-5 w-5 text-red-600" />
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
                      <TableHead>Hours</TableHead>
                      <TableHead>Tasks</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {employeeTimesheets.map((ts) => (
                      <TableRow key={ts.id}>
                        <TableCell>{formatDate(ts.date)}</TableCell>
                        <TableCell>{ts.totalHours}h</TableCell>
                        <TableCell>{ts.entries.length} tasks</TableCell>
                        <TableCell><StatusBadge status={ts.status} /></TableCell>
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

        <TabsContent value="leaves" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Sick Leave</p>
                    <p className="text-2xl font-bold">{leaveBalance.sick} days</p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                    <CalendarDays className="h-5 w-5 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Casual Leave</p>
                    <p className="text-2xl font-bold">{leaveBalance.casual} days</p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <CalendarDays className="h-5 w-5 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Paid Leave</p>
                    <p className="text-2xl font-bold">{leaveBalance.paid} days</p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                    <CalendarDays className="h-5 w-5 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Leave History</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {employeeLeaves.length === 0 ? (
                <EmptyState
                  icon={CalendarDays}
                  title="No leave requests"
                  description="Leave requests will appear here."
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>From</TableHead>
                      <TableHead>To</TableHead>
                      <TableHead>Days</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {employeeLeaves.map((leave) => (
                      <TableRow key={leave.id}>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">{leave.type}</Badge>
                        </TableCell>
                        <TableCell>{formatDate(leave.startDate)}</TableCell>
                        <TableCell>{formatDate(leave.endDate)}</TableCell>
                        <TableCell>{leave.days}</TableCell>
                        <TableCell className="max-w-xs truncate">{leave.reason}</TableCell>
                        <TableCell><StatusBadge status={leave.status} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payroll" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Salary Structure</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-lg bg-muted">
                  <p className="text-xs text-muted-foreground">Basic Salary</p>
                  <p className="text-xl font-bold">{formatCurrency(employee.salary * 0.67)}</p>
                </div>
                <div className="p-4 rounded-lg bg-muted">
                  <p className="text-xs text-muted-foreground">HRA</p>
                  <p className="text-xl font-bold">{formatCurrency(employee.salary * 0.2)}</p>
                </div>
                <div className="p-4 rounded-lg bg-muted">
                  <p className="text-xs text-muted-foreground">Allowances</p>
                  <p className="text-xl font-bold">{formatCurrency(employee.salary * 0.13)}</p>
                </div>
                <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                  <p className="text-xs text-green-600">Gross Salary</p>
                  <p className="text-xl font-bold text-green-700">{formatCurrency(employee.salary || 0)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payslip History</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {employeePayroll.length === 0 ? (
                <EmptyState
                  icon={IndianRupee}
                  title="No payroll records"
                  description="Payroll records will appear here."
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Month</TableHead>
                      <TableHead>Gross</TableHead>
                      <TableHead>Deductions</TableHead>
                      <TableHead>Net</TableHead>
                      <TableHead>Days Worked</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {employeePayroll.map((pay) => (
                      <TableRow key={pay.id}>
                        <TableCell>{pay.month} {pay.year}</TableCell>
                        <TableCell>{formatCurrency(pay.salary.gross)}</TableCell>
                        <TableCell className="text-red-600">-{formatCurrency(pay.salary.deductions)}</TableCell>
                        <TableCell className="font-semibold text-green-600">{formatCurrency(pay.salary.net)}</TableCell>
                        <TableCell>{pay.daysWorked}/{pay.daysInMonth}</TableCell>
                        <TableCell><StatusBadge status={pay.status} /></TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link href={`/payroll/${pay.id}`}>
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Button>
                            </Link>
                            <Button variant="ghost" size="sm">
                              <Download className="h-4 w-4 mr-1" />
                              PDF
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}