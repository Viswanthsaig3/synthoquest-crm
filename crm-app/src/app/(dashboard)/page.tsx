'use client'

import { useAuth } from '@/context/auth-context'
import { Breadcrumb } from '@/components/layout/breadcrumb'
import { StatsCard } from '@/components/shared/stats-card'
import { QuickActions } from '@/components/shared/quick-actions'
import { RecentActivity } from '@/components/shared/recent-activity'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { mockLeads, mockTasks, mockUsers } from '@/lib/mock-data'
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
} from 'lucide-react'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

const leadConversionData = [
  { name: 'Mon', new: 5, converted: 2 },
  { name: 'Tue', new: 4, converted: 3 },
  { name: 'Wed', new: 6, converted: 2 },
  { name: 'Thu', new: 3, converted: 4 },
  { name: 'Fri', new: 7, converted: 3 },
  { name: 'Sat', new: 2, converted: 1 },
  { name: 'Sun', new: 1, converted: 0 },
]

const taskCompletionData = [
  { name: 'Week 1', completed: 24, pending: 8 },
  { name: 'Week 2', completed: 28, pending: 6 },
  { name: 'Week 3', completed: 32, pending: 4 },
  { name: 'Week 4', completed: 26, pending: 10 },
]

const leadSourceData = [
  { name: 'Google Ads', value: 45, color: '#3b82f6' },
  { name: 'Referral', value: 30, color: '#10b981' },
  { name: 'Organic', value: 25, color: '#f59e0b' },
]

const attendanceData = [
  { name: 'Week 1', present: 95, absent: 3, late: 2 },
  { name: 'Week 2', present: 92, absent: 5, late: 3 },
  { name: 'Week 3', present: 97, absent: 2, late: 1 },
  { name: 'Week 4', present: 94, absent: 4, late: 2 },
]

export default function DashboardPage() {
  const { user } = useAuth()

  if (!user) return null

  const totalLeads = mockLeads.length
  const newLeads = mockLeads.filter(l => l.status === 'new').length
  const convertedLeads = mockLeads.filter(l => l.status === 'converted').length
  const activeTasks = mockTasks.filter(t => t.status !== 'done').length
  const completedTasks = mockTasks.filter(t => t.status === 'done').length
  const activeEmployees = mockUsers.filter(u => u.status === 'active').length

  const renderAdminDashboard = () => (
    <div className="space-y-6">
      <Breadcrumb />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Leads"
          value={totalLeads}
          description={`${newLeads} new leads this week`}
          icon={Users}
          trend={{ value: 12, isPositive: true }}
        />
        <StatsCard
          title="Conversion Rate"
          value={`${Math.round((convertedLeads / totalLeads) * 100)}%`}
          description={`${convertedLeads} leads converted`}
          icon={TrendingUp}
          trend={{ value: 5, isPositive: true }}
        />
        <StatsCard
          title="Active Tasks"
          value={activeTasks}
          description={`${completedTasks} completed`}
          icon={CheckCircle}
          trend={{ value: 8, isPositive: false }}
        />
        <StatsCard
          title="Total Employees"
          value={activeEmployees}
          description="Active team members"
          icon={Users}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Lead Conversion Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={leadConversionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="new" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} name="New Leads" />
                <Area type="monotone" dataKey="converted" stackId="2" stroke="#10b981" fill="#10b981" fillOpacity={0.6} name="Converted" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Lead Sources
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={leadSourceData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {leadSourceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Task Completion Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={taskCompletionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="completed" fill="#10b981" name="Completed" />
                  <Bar dataKey="pending" fill="#f59e0b" name="Pending" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <QuickActions
          actions={[
            { label: 'Add Lead', href: '/leads/new', icon: Plus },
            { label: 'Add Employee', href: '/employees/new', icon: Users },
            { label: 'View Reports', href: '/payroll', icon: FileText },
            { label: 'Manage Roles', href: '/settings/roles', icon: Target },
          ]}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentActivity />
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Attendance Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={attendanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="present" fill="#10b981" name="Present" />
                <Bar dataKey="absent" fill="#ef4444" name="Absent" />
                <Bar dataKey="late" fill="#f59e0b" name="Late" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )

  const renderHRDashboard = () => (
    <div className="space-y-6">
      <Breadcrumb />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Employees"
          value={activeEmployees}
          description="Active team members"
          icon={Users}
        />
        <StatsCard
          title="Present Today"
          value={Math.round(activeEmployees * 0.9)}
          description="Checked in today"
          icon={Calendar}
        />
        <StatsCard
          title="Pending Leaves"
          value={3}
          description="Awaiting approval"
          icon={Clock}
        />
        <StatsCard
          title="Payroll Processed"
          value="85%"
          description="This month"
          icon={DollarSign}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Attendance Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={attendanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="present" fill="#10b981" name="Present" />
                <Bar dataKey="absent" fill="#ef4444" name="Absent" />
                <Bar dataKey="late" fill="#f59e0b" name="Late" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <QuickActions
          actions={[
            { label: 'Add Employee', href: '/employees/new', icon: Users },
            { label: 'Approve Leaves', href: '/leaves/approvals', icon: CheckCircle },
            { label: 'View Attendance', href: '/attendance', icon: Calendar },
            { label: 'Process Payroll', href: '/payroll', icon: DollarSign },
          ]}
        />
      </div>

      <RecentActivity />
    </div>
  )

  const renderTeamLeadDashboard = () => (
    <div className="space-y-6">
      <Breadcrumb />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Team Tasks"
          value={mockTasks.length}
          description={`${taskCompletionData[3].completed} completed`}
          icon={CheckCircle}
        />
        <StatsCard
          title="Assigned Leads"
          value={totalLeads}
          description={`${convertedLeads} converted`}
          icon={Users}
        />
        <StatsCard
          title="Pending Timesheets"
          value={2}
          description="Awaiting approval"
          icon={Clock}
        />
        <StatsCard
          title="Team Size"
          value={4}
          description="Team members"
          icon={Users}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Team Task Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={taskCompletionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="completed" fill="#10b981" name="Completed" />
                <Bar dataKey="pending" fill="#f59e0b" name="Pending" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <QuickActions
          actions={[
            { label: 'Create Task', href: '/tasks/new', icon: CheckCircle },
            { label: 'Assign Lead', href: '/leads', icon: Users },
            { label: 'Approve Timesheets', href: '/timesheets/approvals', icon: Clock },
            { label: 'Approve Leaves', href: '/leaves/approvals', icon: Calendar },
          ]}
        />
      </div>

      <RecentActivity />
    </div>
  )

  const renderEmployeeDashboard = () => (
    <div className="space-y-6">
      <Breadcrumb />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="My Tasks"
          value={mockTasks.length}
          description={`${mockTasks.filter(t => t.status === 'done').length} completed`}
          icon={CheckCircle}
        />
        <StatsCard
          title="Assigned Leads"
          value={mockLeads.length}
          description={`${mockLeads.filter(l => l.status === 'converted').length} converted`}
          icon={Users}
        />
        <StatsCard
          title="Hours This Week"
          value="42h"
          description="Timesheet status"
          icon={Clock}
        />
        <StatsCard
          title="Leave Balance"
          value="12 days"
          description="Available leaves"
          icon={Calendar}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              My Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockTasks.slice(0, 5).map(task => (
                <div key={task.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <p className="font-medium">{task.title}</p>
                    <p className="text-sm text-muted-foreground">Due: {task.deadline.toLocaleDateString()}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs ${
                    task.status === 'done' ? 'bg-green-100 text-green-800' :
                    task.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {task.status.replace('_', ' ')}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <QuickActions
          actions={[
            { label: 'Update Task', href: '/tasks', icon: CheckCircle },
            { label: 'Submit Timesheet', href: '/timesheets/new', icon: Clock },
            { label: 'Apply Leave', href: '/leaves/apply', icon: Calendar },
            { label: 'Mark Attendance', href: '/attendance', icon: Users },
          ]}
        />
      </div>

      <RecentActivity />
    </div>
  )

  switch (user.role) {
    case 'admin':
      return renderAdminDashboard()
    case 'hr':
      return renderHRDashboard()
    case 'team_lead':
      return renderTeamLeadDashboard()
    case 'employee':
    default:
      return renderEmployeeDashboard()
  }
}