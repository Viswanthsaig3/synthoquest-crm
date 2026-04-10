'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/context/auth-context'
import { Breadcrumb } from '@/components/layout/breadcrumb'
import { PageHeader, StatusBadge, EmptyState, PermissionGuard } from '@/components/shared'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Select } from '@/components/ui/select'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

import { formatCurrency } from '@/lib/utils'
import { canViewAllPayroll, canViewOwnPayroll, canProcessPayroll } from '@/lib/permissions'
import { DollarSign, Download, Eye, FileText, Play, IndianRupee, Clock } from 'lucide-react'
import Link from 'next/link'
import { fetchPayrollRecords, fetchPayrollSummary } from '@/lib/api/payroll'
import { useToast } from '@/components/ui/toast'
import type { PayrollRecordWithEmployee, PayrollSummary, MONTH_NAMES } from '@/types/payroll'

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
] as const

export default function PayrollPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [records, setRecords] = useState<PayrollRecordWithEmployee[]>([])
  const [summary, setSummary] = useState<PayrollSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [filterMonth, setFilterMonth] = useState<number>(new Date().getMonth() + 1)
  const [filterYear, setFilterYear] = useState<number>(new Date().getFullYear())

  const showAllPayroll = user ? canViewAllPayroll(user) : false
  const canProcess = user ? canProcessPayroll(user) : false

  const loadData = useCallback(async () => {
    if (!user) return
    setIsLoading(true)
    try {
      const [recordsResult, summaryResult] = await Promise.all([
        fetchPayrollRecords({
          month: filterMonth,
          year: filterYear,
          page: 1,
          limit: 50,
        }),
        fetchPayrollSummary(filterMonth, filterYear),
      ])
      setRecords(recordsResult.data)
      setSummary(summaryResult)
    } catch (error) {
      console.error('Failed to load payroll data:', error)
      toast({ title: 'Error', description: 'Failed to load payroll data', variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }, [user, filterMonth, filterYear, toast])

  useEffect(() => {
    loadData()
  }, [loadData])

  if (!user) return null

  const stats = summary || {
    totalPaid: 0, totalProcessed: 0, totalPending: 0,
    paidCount: 0, processedCount: 0, pendingCount: 0, totalEmployees: 0,
  }

  return (
    <PermissionGuard check={(u) => canViewAllPayroll(u) || canViewOwnPayroll(u)} fallbackMessage="You don't have permission to view payroll.">
      <div className="space-y-6">
        <Breadcrumb />

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <PageHeader
          title="Payroll"
          description={showAllPayroll ? 'Manage employee payroll and payslips' : 'View your salary and payslip history'}
        />
        <div className="flex items-center gap-2">
          <Select
            value={String(filterMonth)}
            onChange={(e) => setFilterMonth(Number(e.target.value))}
            className="w-36"
          >
            {MONTHS.map((m, i) => (
              <option key={m} value={i + 1}>{m}</option>
            ))}
          </Select>
          <Select
            value={String(filterYear)}
            onChange={(e) => setFilterYear(Number(e.target.value))}
            className="w-28"
          >
            {[2024, 2025, 2026].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </Select>
          {showAllPayroll && (
            <Link href="/payroll/hours">
              <Button variant="outline">
                <Clock className="h-4 w-4 mr-2" />
                Hours Tracker
              </Button>
            </Link>
          )}
          {canProcess && (
            <Link href="/payroll/run">
              <Button>
                <Play className="h-4 w-4 mr-2" />
                Run Payroll
              </Button>
            </Link>
          )}
        </div>
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
                  <p className="text-2xl font-bold">{stats.totalEmployees}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>
            Payslip History - {MONTHS[filterMonth - 1]} {filterYear}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : records.length === 0 ? (
            <EmptyState
              icon={DollarSign}
              title="No payroll records"
              description="Payroll records will appear here after running payroll."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  {showAllPayroll && <TableHead>Employee</TableHead>}
                  <TableHead>Type</TableHead>
                  <TableHead>Gross</TableHead>
                  <TableHead>Deductions</TableHead>
                  <TableHead>Net</TableHead>
                  <TableHead>Days Worked</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((payroll) => (
                  <TableRow key={payroll.id}>
                    {showAllPayroll && (
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-7 w-7">
                            <AvatarFallback className="text-xs">
                              {payroll.employeeName?.split(' ').map((n) => n[0]).join('') || '?'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm">{payroll.employeeName}</p>
                            <p className="text-xs text-muted-foreground">{payroll.employeeDepartment}</p>
                          </div>
                        </div>
                      </TableCell>
                    )}
                    <TableCell>
                      <span className="text-xs px-2 py-1 rounded-full bg-muted capitalize">
                        {payroll.workerType.replace('_', ' ')}
                      </span>
                    </TableCell>
                    <TableCell>{formatCurrency(payroll.grossEarnings)}</TableCell>
                    <TableCell className="text-red-600">{formatCurrency(payroll.totalDeductions)}</TableCell>
                    <TableCell className="font-semibold text-green-600">{formatCurrency(payroll.netPay)}</TableCell>
                    <TableCell>{payroll.presentDays}/{payroll.totalDays}</TableCell>
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
