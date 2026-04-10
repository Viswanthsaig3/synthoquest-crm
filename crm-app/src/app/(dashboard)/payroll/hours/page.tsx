'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/context/auth-context'
import { Breadcrumb } from '@/components/layout/breadcrumb'
import { PageHeader, PermissionGuard } from '@/components/shared'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

import { formatCurrency, getInitials } from '@/lib/utils'
import { canViewAllPayroll } from '@/lib/permissions'
import {
  Clock,
  Users,
  TrendingUp,
  TrendingDown,
  Timer,
  ChevronDown,
  ChevronRight,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from 'lucide-react'
import Link from 'next/link'
import { fetchEmployeeHoursData } from '@/lib/api/payroll'
import type { EmployeeHoursData, EmployeeHoursResponse, DailyBreakdown } from '@/lib/api/payroll'
import { useToast } from '@/components/ui/toast'

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function formatTime(isoString: string | null): string {
  if (!isoString) return '—'
  try {
    const d = new Date(isoString)
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
  } catch {
    return '—'
  }
}

function formatHours(hours: number): string {
  if (hours === 0) return '0h'
  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

function getCompletionColor(pct: number): string {
  if (pct >= 100) return 'text-green-600'
  if (pct >= 80) return 'text-blue-600'
  if (pct >= 50) return 'text-yellow-600'
  return 'text-red-600'
}

function getCompletionBg(pct: number): string {
  if (pct >= 100) return 'bg-green-500'
  if (pct >= 80) return 'bg-blue-500'
  if (pct >= 50) return 'bg-yellow-500'
  return 'bg-red-500'
}

function getStatusBadge(status: string) {
  const map: Record<string, { label: string; className: string }> = {
    present: { label: 'Present', className: 'bg-green-100 text-green-800' },
    late: { label: 'Late', className: 'bg-yellow-100 text-yellow-800' },
    half_day: { label: 'Half Day', className: 'bg-orange-100 text-orange-800' },
    absent: { label: 'Absent', className: 'bg-red-100 text-red-800' },
  }
  const { label, className } = map[status] || { label: status, className: 'bg-gray-100 text-gray-800' }
  return <Badge className={`${className} text-xs`}>{label}</Badge>
}

// Daily breakdown panel for an employee
function DailyBreakdownPanel({ breakdown, standardHours }: { breakdown: DailyBreakdown[]; standardHours: number }) {
  if (breakdown.length === 0) {
    return (
      <div className="py-6 text-center text-sm text-muted-foreground">
        No attendance records for this period
      </div>
    )
  }

  // Group by week
  const weeks: DailyBreakdown[][] = []
  let currentWeek: DailyBreakdown[] = []
  let weekTotal = 0

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="text-xs w-28">Date</TableHead>
            <TableHead className="text-xs">Day</TableHead>
            <TableHead className="text-xs">Check In</TableHead>
            <TableHead className="text-xs">Check Out</TableHead>
            <TableHead className="text-xs">Sessions</TableHead>
            <TableHead className="text-xs">Hours</TableHead>
            <TableHead className="text-xs">Status</TableHead>
            <TableHead className="text-xs">vs Expected</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {breakdown.map((day) => {
            const dayDate = new Date(day.date + 'T00:00:00')
            const dayName = dayDate.toLocaleDateString('en-IN', { weekday: 'short' })
            const dayFormatted = dayDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
            const diff = day.totalHours - standardHours
            const firstSession = day.sessions[0]
            const lastSession = day.sessions[day.sessions.length - 1]

            return (
              <TableRow key={day.date} className="hover:bg-muted/30">
                <TableCell className="text-xs font-medium">{dayFormatted}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{dayName}</TableCell>
                <TableCell className="text-xs font-mono">
                  {formatTime(firstSession?.checkIn ?? null)}
                </TableCell>
                <TableCell className="text-xs font-mono">
                  {formatTime(lastSession?.checkOut ?? null)}
                </TableCell>
                <TableCell className="text-xs">
                  {day.sessions.length > 1 ? (
                    <Badge variant="outline" className="text-xs">
                      {day.sessions.length} sessions
                    </Badge>
                  ) : '1'}
                </TableCell>
                <TableCell className="text-xs font-semibold">
                  {formatHours(day.totalHours)}
                </TableCell>
                <TableCell>{getStatusBadge(day.status)}</TableCell>
                <TableCell className="text-xs">
                  {diff > 0 ? (
                    <span className="text-green-600 flex items-center gap-0.5">
                      <ArrowUpRight className="h-3 w-3" />+{formatHours(diff)}
                    </span>
                  ) : diff < 0 ? (
                    <span className="text-red-600 flex items-center gap-0.5">
                      <ArrowDownRight className="h-3 w-3" />{formatHours(Math.abs(diff))}
                    </span>
                  ) : (
                    <span className="text-muted-foreground flex items-center gap-0.5">
                      <Minus className="h-3 w-3" />On track
                    </span>
                  )}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}

export default function HoursTrackerPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [data, setData] = useState<EmployeeHoursResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth() + 1)
  const [filterYear, setFilterYear] = useState(new Date().getFullYear())
  const [departmentFilter, setDepartmentFilter] = useState('')
  const [workerTypeFilter, setWorkerTypeFilter] = useState('')
  const [expandedEmployee, setExpandedEmployee] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    if (!user) return
    setIsLoading(true)
    try {
      const result = await fetchEmployeeHoursData({
        month: filterMonth,
        year: filterYear,
        department: departmentFilter || undefined,
        workerType: workerTypeFilter || undefined,
      })
      setData(result)
    } catch (error) {
      console.error('Failed to load hours data:', error)
      toast({ title: 'Error', description: 'Failed to load hours data', variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }, [user, filterMonth, filterYear, departmentFilter, workerTypeFilter, toast])

  useEffect(() => {
    loadData()
  }, [loadData])

  if (!user) return null

  const totals = data?.totals || {
    totalExpectedHours: 0,
    totalHoursWorked: 0,
    avgHoursPerEmployee: 0,
    totalDeficit: 0,
    employeeCount: 0,
  }

  // Get unique departments from loaded data
  const departments = data
    ? Array.from(new Set(data.employees.map(e => e.department))).sort()
    : []

  return (
    <PermissionGuard check={(u) => canViewAllPayroll(u)} fallbackMessage="You don't have permission to view hours tracking.">
      <div className="space-y-6">
        <Breadcrumb />

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Employee Hours Tracker</h1>
            <p className="text-muted-foreground">Track check-in/out hours and payroll impact for all employees</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Select
              value={String(filterMonth)}
              onChange={(e) => { setFilterMonth(Number(e.target.value)); setExpandedEmployee(null) }}
              className="w-36"
            >
              {MONTHS.map((m, i) => (
                <option key={m} value={i + 1}>{m}</option>
              ))}
            </Select>
            <Select
              value={String(filterYear)}
              onChange={(e) => { setFilterYear(Number(e.target.value)); setExpandedEmployee(null) }}
              className="w-28"
            >
              {[2024, 2025, 2026].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </Select>
            {departments.length > 0 && (
              <Select
                value={departmentFilter}
                onChange={(e) => { setDepartmentFilter(e.target.value); setExpandedEmployee(null) }}
                className="w-36"
              >
                <option value="">All Depts</option>
                {departments.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </Select>
            )}
            <Select
              value={workerTypeFilter}
              onChange={(e) => { setWorkerTypeFilter(e.target.value); setExpandedEmployee(null) }}
              className="w-40"
            >
              <option value="">All Types</option>
              <option value="paid_employee">Paid Employee</option>
              <option value="paid_intern">Paid Intern</option>
              <option value="unpaid_intern">Unpaid Intern</option>
              <option value="unpaid_employee">Unpaid Employee</option>
            </Select>
            <Link href="/payroll">
              <Button variant="outline" size="sm">Payroll →</Button>
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Expected</p>
                  <p className="text-2xl font-bold">{formatHours(totals.totalExpectedHours)}</p>
                  <p className="text-xs text-muted-foreground">{totals.employeeCount} employees</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <Timer className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Worked</p>
                  <p className="text-2xl font-bold">{formatHours(totals.totalHoursWorked)}</p>
                  <p className="text-xs text-muted-foreground">across all employees</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg per Employee</p>
                  <p className="text-2xl font-bold">{formatHours(totals.avgHoursPerEmployee)}</p>
                  <p className="text-xs text-muted-foreground">
                    {data?.settings?.expectedHoursPerMonth
                      ? `of ${formatHours(data.settings.expectedHoursPerMonth)} expected`
                      : ''}
                  </p>
                </div>
                <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                  <Users className="h-5 w-5 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {totals.totalDeficit > 0 ? 'Hours Deficit' : 'Hours Surplus'}
                  </p>
                  <p className={`text-2xl font-bold ${totals.totalDeficit > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {totals.totalDeficit > 0 ? '-' : '+'}{formatHours(Math.abs(totals.totalDeficit))}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {totals.totalDeficit > 0 ? 'below target' : 'above target'}
                  </p>
                </div>
                <div className={`h-10 w-10 rounded-full ${totals.totalDeficit > 0 ? 'bg-red-100' : 'bg-green-100'} flex items-center justify-center`}>
                  {totals.totalDeficit > 0
                    ? <TrendingDown className="h-5 w-5 text-red-600" />
                    : <TrendingUp className="h-5 w-5 text-green-600" />}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Employee Hours Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Hours Breakdown — {MONTHS[filterMonth - 1]} {filterYear}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="text-center py-12 text-muted-foreground">Loading hours data...</div>
            ) : !data || data.employees.length === 0 ? (
              <div className="text-center py-12">
                <Clock className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                <p className="text-muted-foreground">No employees found for the selected filters</p>
              </div>
            ) : (
              <div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-8"></TableHead>
                      <TableHead>Employee</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-center">Expected</TableHead>
                      <TableHead className="text-center">Worked</TableHead>
                      <TableHead className="text-center">Completion</TableHead>
                      <TableHead className="text-center">Avg/Day</TableHead>
                      <TableHead className="text-center">Days</TableHead>
                      <TableHead className="text-center">Overtime</TableHead>
                      {/* Only show salary column if there are paid employees */}
                      {data.employees.some(e => e.isPaid) && (
                        <TableHead className="text-right">Salary Impact</TableHead>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.employees.map((emp) => {
                      const isExpanded = expandedEmployee === emp.id
                      return (
                        <React.Fragment key={emp.id}>
                          <TableRow
                            className={`cursor-pointer transition-colors ${isExpanded ? 'bg-muted/50' : 'hover:bg-muted/30'}`}
                            onClick={() => setExpandedEmployee(isExpanded ? null : emp.id)}
                          >
                            <TableCell className="w-8 px-2">
                              {isExpanded
                                ? <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Avatar className="h-7 w-7">
                                  <AvatarFallback className="text-xs">
                                    {getInitials(emp.name)}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium text-sm">{emp.name}</p>
                                  <p className="text-xs text-muted-foreground">{emp.department}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs capitalize">
                                {emp.workerLabel}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center text-sm">
                              {formatHours(emp.expectedHours)}
                            </TableCell>
                            <TableCell className="text-center text-sm font-semibold">
                              {formatHours(emp.totalHoursWorked)}
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex flex-col items-center gap-1">
                                <span className={`text-sm font-bold ${getCompletionColor(emp.completionPercentage)}`}>
                                  {Math.min(emp.completionPercentage, 999).toFixed(1)}%
                                </span>
                                <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all ${getCompletionBg(emp.completionPercentage)}`}
                                    style={{ width: `${Math.min(emp.completionPercentage, 100)}%` }}
                                  />
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-center text-sm">
                              {formatHours(emp.avgDailyHours)}
                            </TableCell>
                            <TableCell className="text-center text-sm">
                              <span className="font-medium">{emp.daysPresent}</span>
                              <span className="text-muted-foreground">/{emp.totalDays}</span>
                            </TableCell>
                            <TableCell className="text-center text-sm">
                              {emp.overtimeHours > 0 ? (
                                <span className="text-blue-600 font-medium">+{formatHours(emp.overtimeHours)}</span>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </TableCell>
                            {data.employees.some(e => e.isPaid) && (
                              <TableCell className="text-right text-sm">
                                {emp.isPaid ? (
                                  <div>
                                    <p className="font-semibold text-green-600">
                                      {formatCurrency(emp.calculatedSalary)}
                                    </p>
                                    {emp.calculatedSalary < emp.monthlySalary && (
                                      <p className="text-xs text-muted-foreground line-through">
                                        {formatCurrency(emp.monthlySalary)}
                                      </p>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground text-xs">Unpaid</span>
                                )}
                              </TableCell>
                            )}
                          </TableRow>

                          {/* Expanded daily breakdown */}
                          {isExpanded && (
                            <TableRow>
                              <TableCell
                                colSpan={data.employees.some(e => e.isPaid) ? 10 : 9}
                                className="p-0 bg-muted/20"
                              >
                                <div className="p-4">
                                  <div className="flex items-center gap-4 mb-3">
                                    <h4 className="text-sm font-semibold">
                                      Daily Breakdown — {emp.name}
                                    </h4>
                                    <div className="flex gap-3 text-xs text-muted-foreground">
                                      <span>Present: <strong>{emp.daysPresent}</strong></span>
                                      <span>Absent: <strong>{emp.absentDays}</strong></span>
                                      <span>Paid Leave: <strong>{emp.paidLeaves}</strong></span>
                                      <span>Half Days: <strong>{emp.halfDays}</strong></span>
                                    </div>
                                  </div>
                                  <DailyBreakdownPanel
                                    breakdown={emp.dailyBreakdown}
                                    standardHours={data.settings.standardWorkingHours}
                                  />
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </React.Fragment>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PermissionGuard>
  )
}
