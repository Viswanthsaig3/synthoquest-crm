'use client'

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useAuth } from '@/context/auth-context'
import { Breadcrumb } from '@/components/layout/breadcrumb'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'

import { formatCurrency, formatDate, getInitials } from '@/lib/utils'
import { ArrowLeft, Download, Printer, CheckCircle, Clock, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { fetchPayrollRecord, markPayrollPaid } from '@/lib/api/payroll'
import { canProcessPayroll } from '@/lib/permissions'
import { useToast } from '@/components/ui/toast'
import type { PayrollRecordWithEmployee } from '@/types/payroll'
import { MONTH_NAMES, WORKER_TYPE_LABELS } from '@/types/payroll'

function Separator({ className }: { className?: string }) {
  return <div className={`h-px bg-border ${className || ''}`} />
}

function formatHours(hours: number): string {
  if (hours === 0) return '0h'
  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

export default function PayslipDetailPage() {
  const params = useParams()
  const { user } = useAuth()
  const { toast } = useToast()
  const payrollId = params.id as string
  const [payroll, setPayroll] = useState<PayrollRecordWithEmployee | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [markingPaid, setMarkingPaid] = useState(false)
  const [markPaidOpen, setMarkPaidOpen] = useState(false)
  const [paidOn, setPaidOn] = useState(new Date().toISOString().split('T')[0])
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer')
  const [paymentRef, setPaymentRef] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const record = await fetchPayrollRecord(payrollId)
        setPayroll(record)
      } catch (error) {
        console.error('Failed to load payroll record:', error)
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [payrollId])

  const handleMarkPaid = async () => {
    if (!payroll) return
    setMarkingPaid(true)
    try {
      const updated = await markPayrollPaid(payroll.id, {
        paidOn,
        paymentMethod: paymentMethod as 'bank_transfer' | 'cash' | 'cheque' | 'upi',
        paymentReference: paymentRef || undefined,
      })
      setPayroll({ ...payroll, ...updated })
      toast({ title: 'Success', description: 'Payment marked as paid' })
      setMarkPaidOpen(false)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to mark as paid',
        variant: 'destructive',
      })
    } finally {
      setMarkingPaid(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Breadcrumb />
        <div className="text-center py-12 text-muted-foreground">Loading payslip...</div>
      </div>
    )
  }

  if (!payroll) {
    return (
      <div className="space-y-6">
        <Breadcrumb />
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Payslip not found</p>
            <Link href="/payroll">
              <Button className="mt-4">Back to Payroll</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const canProcess = user ? canProcessPayroll(user) : false
  const monthName = MONTH_NAMES ? MONTH_NAMES[payroll.month - 1] : String(payroll.month)

  // Estimate hours from the payroll record data
  // overtimeHours field actually stores total overtime, and payable days can approximate work
  const estimatedTotalHours = payroll.presentDays * 8 // rough estimate if actual hours not stored

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Breadcrumb />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/payroll">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Payslip</h1>
            <p className="text-muted-foreground">{monthName} {payroll.year}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {payroll.status === 'processed' && canProcess && (
            <Dialog open={markPaidOpen} onOpenChange={setMarkPaidOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Mark Paid
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Mark as Paid</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <label className="text-sm font-medium">Payment Date</label>
                    <Input type="date" value={paidOn} onChange={(e) => setPaidOn(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Payment Method</label>
                    <Select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                      <option value="bank_transfer">Bank Transfer</option>
                      <option value="cash">Cash</option>
                      <option value="cheque">Cheque</option>
                      <option value="upi">UPI</option>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Reference Number</label>
                    <Input value={paymentRef} onChange={(e) => setPaymentRef(e.target.value)} placeholder="Optional" />
                  </div>
                  <Button onClick={handleMarkPaid} disabled={markingPaid} className="w-full">
                    {markingPaid ? 'Processing...' : 'Confirm Payment'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
          <Button variant="outline">
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button>
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-12 w-12">
                <AvatarFallback>
                  {payroll.employeeName ? getInitials(payroll.employeeName) : '?'}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle>{payroll.employeeName}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {payroll.employeeDepartment} - {payroll.employeeRole?.replace('_', ' ')}
                </p>
                <p className="text-xs text-muted-foreground">
                  {WORKER_TYPE_LABELS[payroll.workerType] || payroll.workerType}
                </p>
              </div>
            </div>
            <Badge
              className="capitalize"
              variant={payroll.status === 'paid' ? 'default' : 'secondary'}
            >
              {payroll.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {/* Summary grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
            <div>
              <p className="text-sm text-muted-foreground">Pay Period</p>
              <p className="font-medium">{monthName} {payroll.year}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pay Date</p>
              <p className="font-medium">{payroll.paidOn ? formatDate(payroll.paidOn) : 'Pending'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Days Worked</p>
              <p className="font-medium">{payroll.presentDays}/{payroll.totalDays}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Payable Days</p>
              <p className="font-medium">{payroll.payableDays}</p>
            </div>
          </div>

          <Separator className="my-6" />

          {/* Hours-based calculation breakdown */}
          <div className="space-y-6">
            <div>
              <h4 className="font-semibold mb-4 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Salary Calculation (Hours-Based)
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Monthly Salary (Full)</span>
                  <span className="font-medium">{formatCurrency(payroll.grossEarnings > 0 ? payroll.grossEarnings : payroll.netPay)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Days Present</span>
                  <span className="font-medium">{payroll.presentDays} of {payroll.totalDays} days</span>
                </div>
                {payroll.paidLeaves > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Paid Leaves</span>
                    <span className="font-medium">{payroll.paidLeaves} days</span>
                  </div>
                )}
                {payroll.unpaidLeaves > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Unpaid Leaves</span>
                    <span className="font-medium text-red-600">{payroll.unpaidLeaves} days</span>
                  </div>
                )}
                {payroll.halfDays > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Half Days</span>
                    <span className="font-medium">{payroll.halfDays}</span>
                  </div>
                )}
              </div>
            </div>

            {payroll.overtimeHours > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Overtime Detected
                </h4>
                <p className="text-sm text-blue-700">
                  This employee has <strong>{formatHours(payroll.overtimeHours)} overtime</strong> beyond expected hours.
                  Admin/HR can manually add bonus pay if needed.
                </p>
              </div>
            )}

            {payroll.notes && (
              <div>
                <h4 className="font-semibold mb-2">Notes</h4>
                <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">{payroll.notes}</p>
              </div>
            )}
          </div>

          <Separator className="my-6" />

          {/* Net pay highlight */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold">Net Pay</span>
              <span className="text-2xl font-bold text-green-700">{formatCurrency(payroll.netPay)}</span>
            </div>
            {payroll.paidOn && payroll.paymentMethod && (
              <p className="text-xs text-green-600 mt-1">
                Paid on {formatDate(payroll.paidOn)} via {payroll.paymentMethod.replace('_', ' ')}
                {payroll.paymentReference ? ` (Ref: ${payroll.paymentReference})` : ''}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
