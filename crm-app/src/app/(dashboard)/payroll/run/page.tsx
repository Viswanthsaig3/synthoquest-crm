'use client'

import React, { useState, useMemo } from 'react'
import { useAuth } from '@/context/auth-context'
import { Breadcrumb } from '@/components/layout/breadcrumb'
import { PageHeader, StatusBadge, EmptyState } from '@/components/shared'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Select } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import { mockPayroll, getPayrollStats, getPayrollByMonth, getAllPayroll, getPendingPayroll } from '@/lib/mock-data'
import { mockUsers } from '@/lib/mock-data/users'
import { formatCurrency, formatDate, getInitials } from '@/lib/utils'
import { canProcessPayroll, canViewAllPayroll } from '@/lib/permissions'
import { 
  IndianRupee, 
  CheckCircle, 
  Clock, 
  FileText, 
  Download, 
  Play,
  Users,
  AlertCircle
} from 'lucide-react'
import Link from 'next/link'
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
  'July', 'August', 'September', 'October', 'November', 'December'
]

const CURRENT_YEAR = 2024

export default function PayrollRunPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [selectedMonth, setSelectedMonth] = useState('January')
  const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR)
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([])
  const [isProcessing, setIsProcessing] = useState(false)

  if (!user) return null

  const canProcess = canProcessPayroll(user)
  const canViewAll = canViewAllPayroll(user)

  if (!canViewAll) {
    return (
      <div className="space-y-6">
        <Breadcrumb />
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">You don't have permission to access this page.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const stats = getPayrollStats()
  const allPayroll = getAllPayroll()
  const monthPayroll = getPayrollByMonth(selectedMonth, selectedYear)
  const pendingPayroll = getPendingPayroll()

  const employees = mockUsers.filter(u => u.role === 'employee' || u.role === 'sales_rep')

  const selectedMonthPayroll = useMemo(() => {
    return employees.filter(emp => 
      !monthPayroll.some(p => p.employeeId === emp.id)
    )
  }, [employees, monthPayroll])

  const handleSelectAll = () => {
    if (selectedEmployees.length === selectedMonthPayroll.length) {
      setSelectedEmployees([])
    } else {
      setSelectedEmployees(selectedMonthPayroll.map(e => e.id))
    }
  }

  const handleSelectEmployee = (employeeId: string) => {
    if (selectedEmployees.includes(employeeId)) {
      setSelectedEmployees(selectedEmployees.filter(id => id !== employeeId))
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
    
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    toast({
      title: 'Payroll processed',
      description: `Payroll has been processed for ${selectedEmployees.length} employees.`,
    })
    
    setSelectedEmployees([])
    setIsProcessing(false)
  }

  const handleMarkPaid = (payrollId: string) => {
    toast({
      title: 'Payment marked as paid',
      description: 'The payment has been marked as paid.',
    })
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

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Paid</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalPaid)}</p>
                <p className="text-xs text-muted-foreground">{stats.paidCount} employees</p>
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
                <p className="text-sm text-muted-foreground">Processed</p>
                <p className="text-2xl font-bold text-blue-600">{formatCurrency(stats.totalProcessed)}</p>
                <p className="text-xs text-muted-foreground">{stats.processedCount} employees</p>
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
                <p className="text-2xl font-bold text-yellow-600">{formatCurrency(stats.totalPending)}</p>
                <p className="text-xs text-muted-foreground">{stats.pendingCount} employees</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Employees</p>
                <p className="text-2xl font-bold">{employees.length}</p>
                <p className="text-xs text-muted-foreground">Active</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {pendingPayroll.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="font-medium text-yellow-800">{pendingPayroll.length} payroll records pending processing</p>
                <p className="text-sm text-yellow-600">Review and mark as processed or paid</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {canProcess && (
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Play className="h-5 w-5" />
                  Run Payroll
                </CardTitle>
                <CardDescription>Generate payroll for employees</CardDescription>
              </div>
              <div className="flex items-center gap-2 md:ml-auto">
                <Select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-36"
                >
                  {MONTHS.map(month => (
                    <option key={month} value={month}>{month}</option>
                  ))}
                </Select>
                <Select
                  value={selectedYear.toString()}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="w-28"
                >
                  <option value="2024">2024</option>
                  <option value="2023">2023</option>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {selectedMonthPayroll.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <p className="text-muted-foreground">Payroll for {selectedMonth} {selectedYear} has already been generated for all employees.</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={selectedEmployees.length === selectedMonthPayroll.length}
                      onCheckedChange={handleSelectAll}
                    />
                    <span className="text-sm font-medium">Select All</span>
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

                <div className="border rounded-lg divide-y">
                  {selectedMonthPayroll.map((emp) => (
                    <div key={emp.id} className="flex items-center justify-between p-3">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={selectedEmployees.includes(emp.id)}
                          onCheckedChange={() => handleSelectEmployee(emp.id)}
                        />
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={emp.avatar} />
                          <AvatarFallback>{getInitials(emp.name)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{emp.name}</p>
                          <p className="text-xs text-muted-foreground capitalize">{emp.department}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(emp.salary)}</p>
                        <p className="text-xs text-muted-foreground">Monthly salary</p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Recent Payroll Records</CardTitle>
          <CardDescription>View and manage processed payroll</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {allPayroll.length === 0 ? (
            <EmptyState
              icon={IndianRupee}
              title="No payroll records"
              description="Run payroll to generate records."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Month</TableHead>
                  <TableHead>Gross</TableHead>
                  <TableHead>Deductions</TableHead>
                  <TableHead>Net</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allPayroll.slice(0, 15).map((pay) => {
                  const employee = mockUsers.find(u => u.id === pay.employeeId)
                  return (
                    <TableRow key={pay.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={employee?.avatar} />
                            <AvatarFallback>{employee ? getInitials(employee.name) : '?'}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{pay.employeeName}</span>
                        </div>
                      </TableCell>
                      <TableCell>{pay.month} {pay.year}</TableCell>
                      <TableCell>{formatCurrency(pay.salary.gross)}</TableCell>
                      <TableCell className="text-red-600">-{formatCurrency(pay.salary.deductions)}</TableCell>
                      <TableCell className="font-semibold text-green-600">{formatCurrency(pay.salary.net)}</TableCell>
                      <TableCell>
                        <StatusBadge status={pay.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {pay.status === 'processed' && canProcess && (
                            <Button variant="outline" size="sm" onClick={() => handleMarkPaid(pay.id)}>
                              Mark Paid
                            </Button>
                          )}
                          <Link href={`/payroll/${pay.id}`}>
                            <Button variant="ghost" size="sm">
                              View
                            </Button>
                          </Link>
                          <Button variant="ghost" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}