'use client'

import React from 'react'
import { useAuth } from '@/context/auth-context'
import { Breadcrumb } from '@/components/layout/breadcrumb'
import { PageHeader, StatusBadge, EmptyState } from '@/components/shared'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { mockPayroll, getPayrollByEmployee } from '@/lib/mock-data'
import { formatCurrency, formatDate } from '@/lib/utils'
import { DollarSign, Download, Eye, FileText } from 'lucide-react'
import Link from 'next/link'

export default function PayrollPage() {
  const { user } = useAuth()

  if (!user) return null

  const payrollRecords = user.role === 'admin' || user.role === 'hr'
    ? mockPayroll
    : getPayrollByEmployee(user.id)

  const currentMonthPayroll = payrollRecords.find(p => 
    p.month === 'January' && p.year === 2024
  )

  return (
    <div className="space-y-6">
      <Breadcrumb />
      
      <PageHeader
        title="Payroll"
        description="View salary and payslip history"
      />

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
                {payrollRecords.map((payroll) => (
                  <TableRow key={payroll.id}>
                    <TableCell className="font-medium">{payroll.employeeName}</TableCell>
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
  )
}