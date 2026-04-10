'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/context/auth-context'
import { Breadcrumb } from '@/components/layout/breadcrumb'
import { PageHeader, StatusBadge, EmptyState } from '@/components/shared'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Select } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

import { formatCurrency } from '@/lib/utils'
import { canProcessPayroll } from '@/lib/permissions'
import {
  IndianRupee,
  CheckCircle,
  Clock,
  FileText,
  Play,
  Users,
  AlertCircle,
} from 'lucide-react'
import Link from 'next/link'
import { fetchPayrollEligibleEmployees, fetchPayrollSummary, runPayroll, fetchEmployeeHoursData } from '@/lib/api/payroll'
import type { EmployeeHoursData } from '@/lib/api/payroll'
import { useToast } from '@/components/ui/toast'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

interface EligibleEmployee {
  id: string
  name: string
  email: string
  department: string
  role: string
  avatar: string | null
  workerType: string
  label: string
  compensationAmount: number | null
  hasSalaryStructure: boolean
}

export default function PayrollRunPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [employees, setEmployees] = useState<EligibleEmployee[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [totalPaid, setTotalPaid] = useState(0)
  const [totalPending, setTotalPending] = useState(0)
  const [hoursMap, setHoursMap] = useState<Map<string, EmployeeHoursData>>(new Map())

  const loadData = useCallback(async () => {
    if (!user) return
    setIsLoading(true)
    try {
      const [empResult, summary, hoursData] = await Promise.all([
        fetchPayrollEligibleEmployees(),
        fetchPayrollSummary(selectedMonth, selectedYear),
        fetchEmployeeHoursData({ month: selectedMonth, year: selectedYear }).catch(() => null),
      ])
      setEmployees(empResult)
      setTotalPaid(summary.totalPaid)
      setTotalPending(summary.totalPending)
      if (hoursData) {
        const map = new Map<string, EmployeeHoursData>()
        hoursData.employees.forEach(e => map.set(e.id, e))
        setHoursMap(map)
      }
    } catch (error) {
      console.error('Failed to load payroll data:', error)
      toast({ title: 'Error', description: 'Failed to load payroll data', variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }, [user, selectedMonth, selectedYear, toast])

  useEffect(() => {
    loadData()
  }, [loadData])

  if (!user) return null

  const canProcess = canProcessPayroll(user)

  if (!canProcess) {
    return (
      <div className="space-y-6">
        <Breadcrumb />
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">{"You don't have permission to access this page."}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const handleSelectAll = () => {
    if (selectedEmployees.length === employees.length) {
      setSelectedEmployees([])
    } else {
      setSelectedEmployees(employees.map((e) => e.id))
    }
  }

  const handleSelectEmployee = (employeeId: string) => {
    if (selectedEmployees.includes(employeeId)) {
      setSelectedEmployees(selectedEmployees.filter((id) => id !== employeeId))
    } else {
      setSelectedEmployees([...selectedEmployees, employeeId])
    }
  }

  const handleRunPayroll = async () => {
    if (selectedEmployees.length === 0) {
      toast({
        title: 'No employees selected',
        description: 'Please select employees to run payroll.',
        variant: 'destructive',
      })
      return
    }

    setIsProcessing(true)
    try {
      const result = await runPayroll({
        month: selectedMonth,
        year: selectedYear,
        selectedUserIds: selectedEmployees,
      })

      toast({
        title: 'Payroll processed',
        description: `Payroll processed for ${result.records.length} employees. Total: ${formatCurrency(result.run.totalNet)}`,
      })

      setSelectedEmployees([])
      loadData()
    } catch (error) {
      toast({
        title: 'Payroll failed',
        description: error instanceof Error ? error.message : 'Failed to process payroll',
        variant: 'destructive',
      })
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="space-y-6">
      <Breadcrumb />

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Payroll Management</h1>
          <p className="text-muted-foreground">Process and manage employee payroll</p>
        </div>
        <Link href="/payroll">
          <Button variant="outline">View Payslips</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Already Paid</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(totalPaid)}</p>
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
                <p className="text-sm text-muted-foreground">Eligible Employees</p>
                <p className="text-2xl font-bold">{employees.length}</p>
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
                <p className="text-sm text-muted-foreground">Selected</p>
                <p className="text-2xl font-bold text-blue-600">{selectedEmployees.length}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Play className="h-5 w-5" />
                Run Payroll
              </CardTitle>
              <CardDescription>Select employees and generate payroll</CardDescription>
            </div>
            <div className="flex items-center gap-2 md:ml-auto">
              <Select
                value={String(selectedMonth)}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="w-36"
              >
                {MONTHS.map((month, i) => (
                  <option key={month} value={i + 1}>{month}</option>
                ))}
              </Select>
              <Select
                value={String(selectedYear)}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="w-28"
              >
                <option value="2026">2026</option>
                <option value="2025">2025</option>
                <option value="2024">2024</option>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading employees...</div>
          ) : employees.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
              <p className="text-muted-foreground">No eligible employees found. Ensure employees have compensation set up.</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={selectedEmployees.length === employees.length}
                    onCheckedChange={handleSelectAll}
                  />
                  <span className="text-sm font-medium">Select All ({employees.length})</span>
                </div>
                <Button
                  onClick={handleRunPayroll}
                  disabled={selectedEmployees.length === 0 || isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Run Payroll ({selectedEmployees.length})
                    </>
                  )}
                </Button>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10"></TableHead>
                    <TableHead>Employee</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Compensation</TableHead>
                    <TableHead>Hours Worked</TableHead>
                    <TableHead>Structure</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employees.map((emp) => (
                    <TableRow
                      key={emp.id}
                      className={selectedEmployees.includes(emp.id) ? 'bg-blue-50' : ''}
                    >
                      <TableCell>
                        <Checkbox
                          checked={selectedEmployees.includes(emp.id)}
                          onCheckedChange={() => handleSelectEmployee(emp.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-7 w-7">
                            <AvatarFallback className="text-xs">
                              {emp.name?.split(' ').map((n) => n[0]).join('') || '?'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm">{emp.name}</p>
                            <p className="text-xs text-muted-foreground">{emp.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs px-2 py-1 rounded-full bg-muted">
                          {emp.label}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm">{emp.department}</TableCell>
                      <TableCell className="text-sm font-medium">
                        {emp.compensationAmount ? formatCurrency(emp.compensationAmount) : '-'}
                      </TableCell>
                      <TableCell>
                        {hoursMap.has(emp.id) ? (
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">
                              {Math.round(hoursMap.get(emp.id)!.totalHoursWorked)}h
                            </span>
                            <span className={`text-xs font-bold ${
                              hoursMap.get(emp.id)!.completionPercentage >= 100 ? 'text-green-600' :
                              hoursMap.get(emp.id)!.completionPercentage >= 80 ? 'text-blue-600' :
                              hoursMap.get(emp.id)!.completionPercentage >= 50 ? 'text-yellow-600' :
                              'text-red-600'
                            }`}>
                              {hoursMap.get(emp.id)!.completionPercentage.toFixed(0)}%
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {emp.hasSalaryStructure ? (
                          <span className="text-xs text-green-600">Configured</span>
                        ) : (
                          <span className="text-xs text-yellow-600">
                            {emp.workerType === 'paid_intern' ? 'Stipend-based' : 'Not set'}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
