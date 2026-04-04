'use client'

import { useAuth } from '@/context/auth-context'
import { Breadcrumb } from '@/components/layout/breadcrumb'
import { StatsCard } from '@/components/shared/stats-card'
import { QuickActions } from '@/components/shared/quick-actions'
import { RecentActivity } from '@/components/shared/recent-activity'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { mockLeads, mockTasks, mockUsers, mockStudents, mockPayments, mockBatches, mockCertificates, mockInterns, getInternStats } from '@/lib/mock-data'
import { getLeadsByAssignee, getUnclaimedLeads, getLeadsUpcomingFollowUps, getRecentCalls, getLeadStatsByType, getPendingApprovals } from '@/lib/mock-data/leads'
import { COURSE_FEES } from '@/lib/constants'
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
import Link from 'next/link'

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
  
  const totalStudents = mockStudents.length
  const activeStudents = mockStudents.filter(s => s.status === 'active').length
  const totalRevenue = mockPayments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0)
  const totalDue = mockStudents.reduce((sum, s) => sum + s.totalDue, 0)
  const activeBatches = mockBatches.filter(b => b.status === 'ongoing' || b.status === 'upcoming').length
  const issuedCertificates = mockCertificates.length

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
          title="Active Students"
          value={activeStudents}
          description={`${totalStudents} total enrolled`}
          icon={GraduationCap}
          trend={{ value: 8, isPositive: true }}
        />
        <StatsCard
          title="Total Revenue"
          value={formatCurrency(totalRevenue)}
          description={`${formatCurrency(totalDue)} pending`}
          icon={IndianRupee}
          trend={{ value: 18, isPositive: true }}
        />
        <StatsCard
          title="Active Batches"
          value={activeBatches}
          description={`${mockBatches.filter(b => b.status === 'upcoming').length} upcoming`}
          icon={BookOpen}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Student Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Active</span>
                <span className="font-medium">{mockStudents.filter(s => s.status === 'active').length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Completed</span>
                <span className="font-medium">{mockStudents.filter(s => s.status === 'completed').length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Dropped</span>
                <span className="font-medium text-red-600">{mockStudents.filter(s => s.status === 'dropped').length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">On Hold</span>
                <span className="font-medium text-orange-600">{mockStudents.filter(s => s.status === 'on_hold').length}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-muted-foreground">Collected</span>
                  <span className="font-medium text-green-600">{formatCurrency(totalRevenue)}</span>
                </div>
                <Progress value={75} className="h-2" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-muted-foreground">Pending</span>
                  <span className="font-medium text-red-600">{formatCurrency(totalDue)}</span>
                </div>
                <Progress value={25} className="h-2 [&>div]:bg-red-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Quick Stats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Certificates Issued</span>
                <Badge>{issuedCertificates}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Conversion Rate</span>
                <Badge className="bg-green-100 text-green-800">{Math.round((convertedLeads / totalLeads) * 100)}%</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Employees</span>
                <Badge variant="outline">{activeEmployees}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
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
            { label: 'Add Student', href: '/students/new', icon: GraduationCap },
            { label: 'Create Batch', href: '/batches/new', icon: BookOpen },
            { label: 'View Reports', href: '/reports', icon: BarChart3 },
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

  const renderHRDashboard = () => {
    const internStats = getInternStats()
    const pendingApprovals = getPendingApprovals()
    const leadStatsByType = getLeadStatsByType()
    
    return (
    <div className="space-y-6">
      <Breadcrumb />
      
      {pendingApprovals.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              <div>
                <span className="font-medium text-orange-800">{pendingApprovals.length} Pending Approvals</span>
                <span className="text-sm text-orange-700 ml-2">Intern applications awaiting your review</span>
              </div>
              <Link href="/interns" className="ml-auto">
                <Button size="sm" variant="outline" className="border-orange-300 text-orange-700">
                  Review Now
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Students"
          value={totalStudents}
          description={`${activeStudents} active`}
          icon={GraduationCap}
        />
        <StatsCard
          title="Active Interns"
          value={internStats.active}
          description={`${internStats.total} total`}
          icon={Briefcase}
        />
        <StatsCard
          title="Total Revenue"
          value={formatCurrency(totalRevenue)}
          description={`₹${(totalDue/1000).toFixed(0)}K pending`}
          icon={IndianRupee}
        />
        <StatsCard
          title="Certificates Issued"
          value={issuedCertificates}
          description="This month"
          icon={Award}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Lead Types Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-2 rounded-lg bg-blue-50">
                <div>
                  <p className="font-medium text-sm">Student Leads</p>
                  <p className="text-xs text-muted-foreground">Course enrollment</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-blue-600">{leadStatsByType['lt_student']?.total || 0}</p>
                  <p className="text-xs text-green-600">{leadStatsByType['lt_student']?.converted || 0} converted</p>
                </div>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-green-50">
                <div>
                  <p className="font-medium text-sm">Intern Leads</p>
                  <p className="text-xs text-muted-foreground">Internship applications</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-600">{leadStatsByType['lt_intern']?.total || 0}</p>
                  <p className="text-xs text-green-600">{leadStatsByType['lt_intern']?.converted || 0} converted</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Recent Enrollments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockStudents.slice(0, 4).map(student => (
                <div key={student.id} className="flex items-center justify-between p-2 rounded-lg border">
                  <div>
                    <p className="font-medium text-sm">{student.name}</p>
                    <p className="text-xs text-muted-foreground">{student.enrollments[0]?.courseName || 'No course'}</p>
                  </div>
                  <Badge variant="outline" className="text-xs">{formatDate(student.convertedAt)}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Interns by Department
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(internStats.byDepartment).map(([dept, count]) => (
                <div key={dept} className="flex items-center justify-between p-2 rounded-lg border">
                  <span className="text-sm capitalize">{dept}</span>
                  <Badge variant="outline">{count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Due Payments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockStudents.filter(s => s.totalDue > 0).slice(0, 4).map(student => (
                <div key={student.id} className="flex items-center justify-between p-2 rounded-lg border">
                  <div>
                    <p className="font-medium text-sm">{student.name}</p>
                    <p className="text-xs text-muted-foreground">{student.enrollments[0]?.courseName}</p>
                  </div>
                  <span className="text-sm font-medium text-red-600">{formatCurrency(student.totalDue)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
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
            { label: 'Add Student', href: '/students/new', icon: GraduationCap },
            { label: 'View Interns', href: '/interns', icon: Briefcase },
            { label: 'Record Payment', href: '/payments/new', icon: CreditCard },
            { label: 'Issue Certificate', href: '/certificates', icon: Award },
          ]}
        />
      </div>

      <RecentActivity />
    </div>
  )
}

const renderTeamLeadDashboard = () => {
    const teamLeads = mockLeads.filter(l => l.assignedTo === user.id || l.convertedBy === user.id)
    const teamConvertedLeads = teamLeads.filter(l => l.status === 'converted')
    const teamConversionRate = teamLeads.length > 0 ? Math.round((teamConvertedLeads.length / teamLeads.length) * 100) : 0
    const teamRevenue = teamConvertedLeads.reduce((sum, l) => sum + (l.courseInterested ? (COURSE_FEES[l.courseInterested] || 0) : 0), 0)
    const teamStudents = mockStudents.filter(s => s.convertedBy === user.id)

    return (
    <div className="space-y-6">
      <Breadcrumb />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="My Leads"
          value={teamLeads.length}
          description={`${teamConvertedLeads.length} converted`}
          icon={Users}
        />
        <StatsCard
          title="Conversion Rate"
          value={`${teamConversionRate}%`}
          description={`${teamConvertedLeads.length} of ${teamLeads.length} leads`}
          icon={TrendingUp}
        />
        <StatsCard
          title="My Students"
          value={teamStudents.length}
          description="Converted by me"
          icon={GraduationCap}
        />
        <StatsCard
          title="My Revenue"
          value={formatCurrency(teamRevenue)}
          description="From conversions"
          icon={IndianRupee}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              My Lead Pipeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <span className="text-muted-foreground">New Leads</span>
                <span className="font-medium">{teamLeads.filter(l => l.status === 'new').length}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <span className="text-muted-foreground">In Progress</span>
                <span className="font-medium">{teamLeads.filter(l => ['contacted', 'follow_up', 'qualified'].includes(l.status)).length}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border bg-green-50">
                <span className="text-muted-foreground">Converted</span>
                <span className="font-medium text-green-600">{teamConvertedLeads.length}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <span className="text-muted-foreground">Lost</span>
                <span className="font-medium text-red-600">{teamLeads.filter(l => l.status === 'lost').length}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <QuickActions
          actions={[
            { label: 'View Leads', href: '/leads', icon: Users },
            { label: 'My Students', href: '/students', icon: GraduationCap },
            { label: 'Approve Timesheets', href: '/timesheets/approvals', icon: Clock },
            { label: 'View Reports', href: '/reports', icon: BarChart3 },
          ]}
        />
      </div>

      <RecentActivity />
    </div>
  )
}

  const renderSalesRepDashboard = () => {
    const myLeads = getLeadsByAssignee(user.id)
    const unclaimedLeads = getUnclaimedLeads()
    const upcomingFollowUps = getLeadsUpcomingFollowUps(user.id)
    const recentCalls = getRecentCalls(user.id, 5)
    
    const myConversions = myLeads.filter(l => l.status === 'converted').length
    const totalCalls = myLeads.reduce((sum, l) => sum + l.totalCalls, 0)
    const revenue = myLeads
      .filter(l => l.status === 'converted')
      .reduce((sum, l) => sum + (l.courseInterested ? (COURSE_FEES[l.courseInterested] || 0) : 0), 0)

    const formatDuration = (seconds: number): string => {
      const mins = Math.floor(seconds / 60)
      const secs = seconds % 60
      return `${mins}m ${secs}s`
    }

    const myStudents = mockStudents.filter(s => s.convertedBy === user.id)

    return (
      <div className="space-y-6">
        <Breadcrumb />
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="My Leads"
            value={myLeads.length}
            description={`${unclaimedLeads.length} available to claim`}
            icon={Users}
          />
          <StatsCard
            title="My Students"
            value={myStudents.length}
            description="Converted leads"
            icon={GraduationCap}
          />
          <StatsCard
            title="Conversions"
            value={myConversions}
            description="This week"
            icon={CheckCircle}
          />
          <StatsCard
            title="Revenue"
            value={`₹${(revenue / 1000).toFixed(0)}K`}
            description="From conversions"
            icon={DollarSign}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Flame className="h-5 w-5 text-red-500" />
                  Available to Claim
                </CardTitle>
                <Link href="/leads/pool">
                  <Button variant="ghost" size="sm">
                    View All <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {unclaimedLeads.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No leads available</p>
              ) : (
                <div className="space-y-3">
                  {unclaimedLeads.slice(0, 3).map((lead) => {
                    const estValue = lead.courseInterested ? (COURSE_FEES[lead.courseInterested] || 0) : 0
                    return (
                      <div key={lead.id} className="flex items-center justify-between p-3 rounded-lg border">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-full bg-red-100">
                            {lead.priority === 'hot' ? (
                              <Flame className="h-4 w-4 text-red-500" />
                            ) : lead.priority === 'warm' ? (
                              <Zap className="h-4 w-4 text-orange-500" />
                            ) : (
                              <Phone className="h-4 w-4 text-blue-500" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{lead.name}</p>
                            <p className="text-xs text-muted-foreground">{lead.courseInterested}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-green-600">₹{estValue.toLocaleString()}</p>
                          <Badge variant="outline" className="capitalize text-xs">{lead.priority}</Badge>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-orange-500" />
                  Today's Follow-ups
                </CardTitle>
                <Link href="/leads/mine">
                  <Button variant="ghost" size="sm">
                    View All <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {upcomingFollowUps.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No follow-ups scheduled</p>
              ) : (
                <div className="space-y-3">
                  {upcomingFollowUps.slice(0, 3).map((lead) => (
                    <div key={lead.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div>
                        <p className="font-medium">{lead.name}</p>
                        <p className="text-xs text-muted-foreground">{lead.courseInterested}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <p className="text-sm text-orange-600">
                            {lead.nextFollowUpAt && formatDate(lead.nextFollowUpAt)}
                          </p>
                        </div>
                        <Link href={`/leads/${lead.id}?action=call`}>
                          <Button size="sm">
                            <Phone className="h-4 w-4" />
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

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Recent Call Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentCalls.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No recent calls</p>
            ) : (
              <div className="space-y-2">
                {recentCalls.map((call) => {
                  const lead = mockLeads.find(l => l.id === call.leadId)
                  return (
                    <div key={call.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-green-100">
                          {call.outcome === 'answered' ? (
                            <Phone className="h-4 w-4 text-green-600" />
                          ) : (
                            <PhoneOff className="h-4 w-4 text-gray-400" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{lead?.name}</p>
                          <p className="text-xs text-muted-foreground">{call.remarks.substring(0, 50)}...</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm">{formatDate(call.createdAt)}</p>
                        <p className="text-xs text-muted-foreground">
                          {call.outcome === 'answered' ? formatDuration(call.duration) : call.outcome.replace('_', ' ')}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <QuickActions
          actions={[
            { label: 'Lead Pool', href: '/leads/pool', icon: Users },
            { label: 'My Leads', href: '/leads/mine', icon: Target },
            { label: 'My Students', href: '/students', icon: GraduationCap },
            { label: 'Apply Leave', href: '/leaves/apply', icon: Calendar },
          ]}
        />
      </div>
    )
  }

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
    case 'sales_rep':
      return renderSalesRepDashboard()
    case 'employee':
    default:
      return renderEmployeeDashboard()
  }
}