'use client'

import { useAuth } from '@/context/auth-context'
import { Breadcrumb } from '@/components/layout/breadcrumb'
import { StatsCard } from '@/components/shared/stats-card'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

import { formatDate, formatTime, formatCurrency } from '@/lib/utils'
import {
  Users,
  TrendingUp,
  CheckCircle,
  Clock,
  DollarSign,
  Calendar,
  Target,
  BarChart3,
  FileText,
  Plus,
  Phone,
  Flame,
  Zap,
  PhoneOff,
  ArrowRight,
  GraduationCap,
  BookOpen,
  CreditCard,
  Award,
  IndianRupee,
  Briefcase,
  AlertCircle,
} from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState, useMemo } from 'react'
import { getDashboardSummary } from '@/lib/api/dashboard'
import type { Task } from '@/lib/db/queries/tasks'
import type { Timesheet } from '@/lib/db/queries/timesheets'
import type { User } from '@/types/user'
import { hasAnyPermission } from '@/lib/client-permissions'
import { isSidebarNavImplemented } from '@/lib/nav-visibility'

export default function DashboardPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [employees, setEmployees] = useState<User[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [timesheets, setTimesheets] = useState<Timesheet[]>([])

  useEffect(() => {
    async function fetchData() {
      if (!user) return
      
      try {
        setLoading(true)
        const summary = await getDashboardSummary()
        setEmployees(summary.data.employees || [])
        setTasks(summary.data.tasks || [])
        setTimesheets(summary.data.timesheets || [])
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user])

  const stats = useMemo(() => {
    const totalEmployees = employees.length
    const activeEmployees = employees.filter(e => e.status === 'active').length
    
    const totalTasks = tasks.length
    const completedTasks = tasks.filter(t => t.status === 'completed').length
    const activeTasks = tasks.filter(t => t.status !== 'completed' && t.status !== 'cancelled').length
    
    const totalHours = timesheets.reduce((sum, ts) => sum + (ts.totalHours || 0), 0)
    const avgHoursPerDay = timesheets.length > 0 ? totalHours / timesheets.length : 0

    return {
      totalEmployees,
      activeEmployees,
      totalTasks,
      completedTasks,
      activeTasks,
      totalHours,
      avgHoursPerDay
    }
  }, [employees, tasks, timesheets])

  if (!user) return null

  if (loading) {
    return (
      <div className="space-y-6">
        <Breadcrumb />
        <Card>
          <CardContent className="py-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
            <p className="text-muted-foreground mt-4">Loading dashboard...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const renderAdminDashboard = () => (
    <div className="space-y-6">
      <Breadcrumb />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Employees"
          value={stats.totalEmployees}
          description={`${stats.activeEmployees} active`}
          icon={Users}
        />
        <StatsCard
          title="Total Tasks"
          value={stats.totalTasks}
          description={`${stats.activeTasks} active`}
          icon={Target}
        />
        <StatsCard
          title="Completed Tasks"
          value={stats.completedTasks}
          description={`${stats.totalTasks > 0 ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0}% completion rate`}
          icon={CheckCircle}
        />
        <StatsCard
          title="Total Hours Logged"
          value={`${stats.totalHours.toFixed(1)}h`}
          description={`${stats.avgHoursPerDay.toFixed(1)}h avg/day`}
          icon={Clock}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Employees by Department
            </CardTitle>
          </CardHeader>
          <CardContent>
            {employees.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                No employees found
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(
                  employees.reduce((acc: Record<string, number>, emp) => {
                    acc[emp.department] = (acc[emp.department] || 0) + 1
                    return acc
                  }, {})
                ).map(([dept, count]) => (
                  <div key={dept} className="flex items-center justify-between">
                    <span className="text-sm capitalize">{dept}</span>
                    <div className="flex items-center gap-2">
                      <Progress 
                        value={(count / employees.length) * 100} 
                        className="h-2 w-24" 
                      />
                      <span className="text-sm font-medium">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Tasks by Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {tasks.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                No tasks found
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(
                  tasks.reduce((acc: Record<string, number>, task) => {
                    acc[task.status] = (acc[task.status] || 0) + 1
                    return acc
                  }, {})
                ).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between">
                    <span className="text-sm capitalize">{status.replace('_', ' ')}</span>
                    <div className="flex items-center gap-2">
                      <Progress 
                        value={(count / tasks.length) * 100} 
                        className="h-2 w-24" 
                      />
                      <span className="text-sm font-medium">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recent Timesheets
          </CardTitle>
        </CardHeader>
        <CardContent>
          {timesheets.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No timesheets found
            </div>
          ) : (
            <div className="space-y-4">
              {timesheets.slice(0, 5).map((ts) => {
                const employee = employees.find(e => e.id === ts.employeeId)
                return (
                  <div key={ts.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-medium">
                          {employee ? employee.name.charAt(0).toUpperCase() : '?'}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{employee?.name || 'Unknown'}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(new Date(ts.workDate))}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{ts.totalHours?.toFixed(1) || 0}h</p>
                      <p className="text-xs text-muted-foreground">Daily log</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )

  const renderEmployeeDashboard = () => (
    <div className="space-y-6">
      <Breadcrumb />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="My Tasks"
          value={tasks.filter(t => t.assignedTo === user.id).length}
          description={`${tasks.filter(t => t.assignedTo === user.id && t.status !== 'completed').length} active`}
          icon={Target}
        />
        <StatsCard
          title="Completed"
          value={tasks.filter(t => t.assignedTo === user.id && t.status === 'completed').length}
          description="Tasks completed"
          icon={CheckCircle}
        />
        <StatsCard
          title="Hours This Month"
          value={`${timesheets
            .filter(ts => ts.employeeId === user.id)
            .reduce((sum, ts) => sum + (ts.totalHours || 0), 0)
            .toFixed(1)}h`}
          description="Total logged"
          icon={Clock}
        />
        <StatsCard
          title="Pending Tasks"
          value={tasks.filter(t => t.assignedTo === user.id && t.status === 'pending').length}
          description="Awaiting start"
          icon={AlertCircle}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              My Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            {tasks.filter(t => t.assignedTo === user.id).length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                No tasks assigned to you
              </div>
            ) : (
              <div className="space-y-4">
                {tasks.filter(t => t.assignedTo === user.id).slice(0, 5).map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div>
                      <p className="font-medium">{task.title}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {task.type} • {task.priority} priority
                      </p>
                    </div>
                    <Badge className={
                      task.status === 'completed' ? 'bg-green-100 text-green-800' :
                      task.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                      task.status === 'pending' ? 'bg-gray-100 text-gray-800' :
                      'bg-yellow-100 text-yellow-800'
                    }>
                      {task.status.replace('_', ' ')}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Timesheets
            </CardTitle>
          </CardHeader>
          <CardContent>
            {timesheets.filter(ts => ts.employeeId === user.id).length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                No timesheets yet
              </div>
            ) : (
              <div className="space-y-4">
                {timesheets.filter(ts => ts.employeeId === user.id).slice(0, 5).map((ts) => (
                  <div key={ts.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div>
                      <p className="font-medium">
                        {formatDate(new Date(ts.workDate))}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {ts.totalHours?.toFixed(1) || 0} hours
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground">Daily log</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className={`grid grid-cols-2 gap-4 ${isSidebarNavImplemented('/leaves') ? 'md:grid-cols-4' : 'md:grid-cols-3'}`}
          >
            <Link href="/tasks">
              <Button variant="outline" className="w-full">
                <Target className="h-4 w-4 mr-2" />
                View Tasks
              </Button>
            </Link>
            <Link href="/timesheets">
              <Button variant="outline" className="w-full">
                <Clock className="h-4 w-4 mr-2" />
                Timesheets
              </Button>
            </Link>
            <Link href="/attendance">
              <Button variant="outline" className="w-full">
                <Calendar className="h-4 w-4 mr-2" />
                Attendance
              </Button>
            </Link>
            {isSidebarNavImplemented('/leaves') && (
              <Link href="/leaves">
                <Button variant="outline" className="w-full">
                  <FileText className="h-4 w-4 mr-2" />
                  Leave
                </Button>
              </Link>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const isAdmin = hasAnyPermission(user, ['employees.view_all', 'tasks.view_all', 'timesheets.view_all'])

  return isAdmin ? renderAdminDashboard() : renderEmployeeDashboard()
}