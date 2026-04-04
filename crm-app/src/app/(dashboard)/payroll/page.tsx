'use client'

import React from 'react'
import { useAuth } from '@/context/auth-context'
import { Breadcrumb } from '@/components/layout/breadcrumb'
import { PageHeader, StatusBadge, EmptyState, PermissionGuard } from '@/components/shared'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { mockPayroll, getPayrollByEmployee, getPayrollStats } from '@/lib/mock-data'
import { formatCurrency, formatDate } from '@/lib/utils'
import { canViewAllPayroll, canViewOwnPayroll, canProcessPayroll } from '@/lib/permissions'
import { DollarSign, Download, Eye, FileText, Play, IndianRupee } from 'lucide-react'
import Link from 'next/link'

export default function PayrollPage() {
  const { user } = useAuth()

  if (!user) return null

  const showAllPayroll = canViewAllPayroll(user)
  const canProcess = canProcessPayroll(user)
  const payrollRecords = showAllPayroll
    ? mockPayroll
    : getPayrollByEmployee(user.id)

  const stats = getPayrollStats()

  const currentMonthPayroll = payrollRecords.find(p => 
    p.month === 'January' && p.year === 2024 && (showAllPayroll || p.employeeId === user.id)
  )

  return (
    <PermissionGuard check={(u) => canViewAllPayroll(u) || canViewOwnPayroll(u)} fallbackMessage="You don't have permission to view payroll.">
      <div className="space-y-6">
        <Breadcrumb />
      
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <PageHeader
          title="Payroll"
          description={showAllPayroll ? "Manage employee payroll and payslips" : "View your salary and payslip history"}
        />
        {canProcess && (
          <Link href="/payroll/run">
            <Button>
              <Play className="h-4 w-4 mr-2" />
              Run Payroll
            </Button>
          </Link>
        )}
      </div>

      {showAllPayroll && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Paid</p>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalPaid)}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                  <IndianRupee className="h-5 w-5 text-green-600" />
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
                </div>
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-blue-600" />
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
                </div>
                <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Records</p>
                  <p className="text-2xl font-bold">{stats.paidCount + stats.processedCount + stats.pendingCount}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {currentMonthPayroll && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Current Month - {currentMonthPayroll.month} {currentMonthPayroll.year}</CardTitle>
              <StatusBadge status={currentMonthPayroll.status} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div>
                <p className="text-sm text-muted-foreground">Gross Salary</p>
                <p className="text-2xl font-bold">{formatCurrency(currentMonthPayroll.salary.gross)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Deductions</p>
                <p className="text-2xl font-bold text-red-600">-{formatCurrency(currentMonthPayroll.salary.deductions)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Days Worked</p>
                <p className="text-2xl font-bold">{currentMonthPayroll.daysWorked}/{currentMonthPayroll.daysInMonth}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Net Salary</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(currentMonthPayroll.salary.net)}</p>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t">
              <h4 className="font-medium mb-4">Salary Breakdown</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 rounded-lg bg-muted">
                  <p className="text-xs text-muted-foreground">Basic</p>
                  <p className="font-semibold">{formatCurrency(currentMonthPayroll.salary.basic)}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted">
                  <p className="text-xs text-muted-foreground">HRA</p>
                  <p className="font-semibold">{formatCurrency(currentMonthPayroll.salary.hra)}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted">
                  <p className="text-xs text-muted-foreground">Allowances</p>
                  <p className="font-semibold">{formatCurrency(currentMonthPayroll.salary.allowances)}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted">
                  <p className="text-xs text-muted-foreground">Deductions</p>
                  <p className="font-semibold text-red-600">{formatCurrency(currentMonthPayroll.salary.deductions)}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Payslip History</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {payrollRecords.length === 0 ? (
            <EmptyState
              icon={DollarSign}
              title="No payroll records"
              description="Payroll records will appear here."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  {showAllPayroll && <TableHead>Employee</TableHead>}
                  <TableHead>Month</TableHead>
                  <TableHead>Gross</TableHead>
                  <TableHead>Deductions</TableHead>
                  <TableHead>Net</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payrollRecords.map((payroll) => (
                  <TableRow key={payroll.id}>
                    {showAllPayroll && (
                      <TableCell className="font-medium">{payroll.employeeName}</TableCell>
                    )}
                    <TableCell>{payroll.month} {payroll.year}</TableCell>
                    <TableCell>{formatCurrency(payroll.salary.gross)}</TableCell>
                    <TableCell className="text-red-600">{formatCurrency(payroll.salary.deductions)}</TableCell>
                    <TableCell className="font-semibold text-green-600">{formatCurrency(payroll.salary.net)}</TableCell>
                    <TableCell>
                      <StatusBadge status={payroll.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/payroll/${payroll.id}`}>
                          <Button variant="ghost" size="icon">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button variant="ghost" size="icon">
                          <Download className="h-4 w-4" />
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
      </div>
    </PermissionGuard>
  )
}