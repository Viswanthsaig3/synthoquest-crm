'use client'

import React, { useState, useMemo } from 'react'
import { useAuth } from '@/context/auth-context'
import { Breadcrumb } from '@/components/layout/breadcrumb'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { mockStudents, mockLeads, mockPayments, mockBatches } from '@/lib/mock-data'
import { formatCurrency, formatDate } from '@/lib/utils'
import { canViewReports } from '@/lib/permissions'
import {
  TrendingUp,
  TrendingDown,
  Users,
  GraduationCap,
  IndianRupee,
  Target,
  BarChart3,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  BookOpen,
  CreditCard,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from 'recharts'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

export default function ReportsPage() {
  const { user } = useAuth()
  const [selectedPeriod, setSelectedPeriod] = useState('month')

  if (!user || !canViewReports(user)) {
    return (
      <div className="space-y-6">
        <Breadcrumb />
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">You don't have permission to view reports.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const activeStudents = mockStudents.filter(s => s.status === 'active').length
  const totalStudents = mockStudents.length
  const totalLeads = mockLeads.length
  const convertedLeads = mockLeads.filter(l => l.status === 'converted').length
  const conversionRate = totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0
  const totalRevenue = mockPayments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0)
  const totalDue = mockStudents.reduce((sum, s) => sum + s.totalDue, 0)

  const leadsBySource = mockLeads.reduce((acc, lead) => {
    const source = lead.source
    acc[source] = (acc[source] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const sourceData = Object.entries(leadsBySource).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
  }))

  const leadsByStatus = mockLeads.reduce((acc, lead) => {
    const status = lead.status
    acc[status] = (acc[status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const statusData = Object.entries(leadsByStatus).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1).replace('_', ' '),
    value,
  }))

  const courseEnrollments = mockStudents.reduce((acc, student) => {
    student.enrollments.forEach(e => {
      acc[e.courseName] = (acc[e.courseName] || 0) + 1
    })
    return acc
  }, {} as Record<string, number>)

  const courseData = Object.entries(courseEnrollments)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, enrollments]) => ({ name: name.length > 15 ? name.substring(0, 15) + '...' : name, enrollments }))

  const monthlyRevenue = [
    { month: 'Aug', revenue: 180000, collected: 165000 },
    { month: 'Sep', revenue: 220000, collected: 200000 },
    { month: 'Oct', revenue: 280000, collected: 260000 },
    { month: 'Nov', revenue: 310000, collected: 295000 },
    { month: 'Dec', revenue: 250000, collected: 240000 },
    { month: 'Jan', revenue: totalRevenue, collected: totalRevenue * 0.9 },
  ]

  const batchOccupancy = mockBatches
    .filter(b => b.status !== 'completed')
    .map(b => ({
      name: b.name,
      enrolled: b.enrolledCount,
      capacity: b.maxCapacity,
      occupancy: Math.round((b.enrolledCount / b.maxCapacity) * 100),
    }))

  return (
    <div className="space-y-6">
      <Breadcrumb />
      
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Reports & Analytics</h1>
          <p className="text-muted-foreground">Overview of your institute's performance</p>
        </div>
        <div className="flex gap-2">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </select>
          <Button variant="outline">
            Export Report
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Students</p>
                <p className="text-2xl font-bold">{totalStudents}</p>
                <div className="flex items-center gap-1 text-sm text-green-600 mt-1">
                  <ArrowUpRight className="h-4 w-4" />
                  <span>+12% from last month</span>
                </div>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <GraduationCap className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Conversion Rate</p>
                <p className="text-2xl font-bold">{conversionRate}%</p>
                <div className="flex items-center gap-1 text-sm text-green-600 mt-1">
                  <ArrowUpRight className="h-4 w-4" />
                  <span>+5% from last month</span>
                </div>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <Target className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">{formatCurrency(totalRevenue)}</p>
                <div className="flex items-center gap-1 text-sm text-green-600 mt-1">
                  <ArrowUpRight className="h-4 w-4" />
                  <span>+18% from last month</span>
                </div>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <IndianRupee className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Dues</p>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(totalDue)}</p>
                <div className="flex items-center gap-1 text-sm text-orange-600 mt-1">
                  <ArrowDownRight className="h-4 w-4" />
                  <span>{mockStudents.filter(s => s.totalDue > 0).length} students</span>
                </div>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <CreditCard className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
            <CardDescription>Monthly revenue vs collected amount</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyRevenue}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => `₹${(value / 1000)}k`} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} />
                <Line type="monotone" dataKey="collected" stroke="#10b981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Course Enrollments</CardTitle>
            <CardDescription>Top courses by enrollment</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={courseData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="enrollments" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Lead Sources</CardTitle>
            <CardDescription>Distribution of leads by source</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPieChart>
                <Pie
                  data={sourceData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {sourceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </RechartsPieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Lead Status Distribution</CardTitle>
            <CardDescription>Current status of all leads</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </RechartsPieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Batch Occupancy</CardTitle>
          <CardDescription>Current enrollment status of active batches</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {batchOccupancy.map((batch) => (
              <div key={batch.name} className="flex items-center gap-4">
                <div className="w-28 font-medium text-sm">{batch.name}</div>
                <div className="flex-1">
                  <Progress 
                    value={batch.occupancy} 
                    className={`h-3 ${batch.occupancy >= 90 ? '[&>div]:bg-red-500' : batch.occupancy >= 70 ? '[&>div]:bg-orange-500' : ''}`}
                  />
                </div>
                <div className="w-24 text-sm text-right">
                  {batch.enrolled}/{batch.capacity} ({batch.occupancy}%)
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}