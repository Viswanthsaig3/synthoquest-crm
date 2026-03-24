'use client'

import React from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Breadcrumb } from '@/components/layout/breadcrumb'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { StatusBadge, StatsCard } from '@/components/shared'
import { mockUsers, getUserById } from '@/lib/mock-data'
import { mockLeads, getLeadsByAssignee } from '@/lib/mock-data'
import { mockTasks, getTasksByAssignee } from '@/lib/mock-data'
import { mockAttendance, getAttendanceByEmployee, getAttendanceSummary } from '@/lib/mock-data'
import { formatDate, getInitials, formatCurrency } from '@/lib/utils'
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Mail, 
  Phone, 
  Calendar,
  Building,
  CheckCircle,
  Clock,
  FileText,
  DollarSign
} from 'lucide-react'
import Link from 'next/link'

export default function EmployeeProfilePage() {
  const params = useParams()
  const router = useRouter()
  const employeeId = params.id as string
  const employee = getUserById(employeeId)

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

  const assignedLeads = getLeadsByAssignee(employeeId)
  const assignedTasks = getTasksByAssignee(employeeId)
  const attendanceSummary = getAttendanceSummary(employeeId)

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
              <AvatarImage src={employee.avatar} />
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
        <div className="flex items-center gap-2">
          <Link href={`/employees/${employee.id}?edit=true`}>
            <Button variant="outline">
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </Link>
          <Button variant="destructive">
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard
          title="Assigned Leads"
          value={assignedLeads.length}
          icon={FileText}
        />
        <StatsCard
          title="Active Tasks"
          value={assignedTasks.filter(t => t.status !== 'done').length}
          icon={CheckCircle}
        />
        <StatsCard
          title="Attendance Rate"
          value={`${Math.round((attendanceSummary.present / attendanceSummary.totalDays) * 100)}%`}
          icon={Clock}
        />
        <StatsCard
          title="Monthly Salary"
          value={formatCurrency(employee.salary)}
          icon={DollarSign}
        />
      </div>

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
                <p className="font-medium">{formatDate(employee.joinDate)}</p>
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
            <CardTitle>Attendance Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                <p className="text-sm text-green-600">Present Days</p>
                <p className="text-2xl font-bold text-green-700">{attendanceSummary.present}</p>
              </div>
              <div className="p-4 rounded-lg bg-red-50 border border-red-200">
                <p className="text-sm text-red-600">Absent Days</p>
                <p className="text-2xl font-bold text-red-700">{attendanceSummary.absent}</p>
              </div>
              <div className="p-4 rounded-lg bg-yellow-50 border border-yellow-200">
                <p className="text-sm text-yellow-600">Late Days</p>
                <p className="text-2xl font-bold text-yellow-700">{attendanceSummary.late}</p>
              </div>
              <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                <p className="text-sm text-blue-600">Avg Hours</p>
                <p className="text-2xl font-bold text-blue-700">{attendanceSummary.averageHours.toFixed(1)}h</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Tasks</CardTitle>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Assigned Leads</CardTitle>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>
      </div>
    </div>
  )
}