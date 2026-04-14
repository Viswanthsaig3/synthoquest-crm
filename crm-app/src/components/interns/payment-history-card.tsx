'use client'

import React, { useEffect, useState } from 'react'
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
import { formatDate, formatCurrency } from '@/lib/utils'
import { useToast } from '@/components/ui/toast'
import { getInternPaymentSummary, createInternPayment, deleteInternPayment } from '@/lib/api/intern-payments'
import { canManageInternPayments } from '@/lib/permissions'
import { useAuth } from '@/context/auth-context'
import { Loader2, Plus, Trash2, AlertCircle, IndianRupee } from 'lucide-react'
import type { InternPaymentSummary, InternPayment } from '@/types/intern-payment'
import AddPaymentModal from './add-payment-modal'

interface PaymentHistoryCardProps {
  internId: string
}

export default function PaymentHistoryCard({ internId }: PaymentHistoryCardProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState<InternPaymentSummary | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)

  const canManagePayments = user ? canManageInternPayments(user) : false

  useEffect(() => {
    loadPaymentSummary()
  }, [internId])

  const loadPaymentSummary = async () => {
    try {
      setLoading(true)
      const res = await getInternPaymentSummary(internId)
      setSummary(res.data)
    } catch (error) {
      console.error('Failed to load payment summary:', error)
      toast({
        title: 'Error',
        description: 'Failed to load payment history',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAddPayment = async (data: { amount: number; paymentMethod: string; paymentDate?: string; receiptNumber?: string; notes?: string }) => {
    try {
      await createInternPayment(internId, {
        amount: data.amount,
        paymentMethod: data.paymentMethod as InternPayment['paymentMethod'],
        paymentDate: data.paymentDate,
        receiptNumber: data.receiptNumber,
        notes: data.notes,
      })
      toast({
        title: 'Payment recorded',
        description: `₹${data.amount.toLocaleString()} has been recorded successfully.`,
      })
      setShowAddModal(false)
      loadPaymentSummary()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to record payment',
        variant: 'destructive',
      })
    }
  }

  const handleDeletePayment = async (paymentId: string) => {
    if (!window.confirm('Are you sure you want to delete this payment record?')) return
    
    try {
      await deleteInternPayment(internId, paymentId)
      toast({
        title: 'Payment deleted',
        description: 'Payment record has been removed.',
      })
      loadPaymentSummary()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete payment',
        variant: 'destructive',
      })
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  if (!summary) {
    return null
  }

  const isFullyPaid = summary.remainingBalance <= 0
  const hasBalance = summary.remainingBalance > 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IndianRupee className="h-5 w-5" />
          Payment Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">Total Fee</p>
            <p className="text-2xl font-bold">{formatCurrency(summary.totalFee)}</p>
          </div>
          <div className="p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">Total Paid</p>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(summary.totalPaid)}</p>
          </div>
          <div className={`p-4 rounded-lg ${hasBalance ? 'bg-orange-50' : 'bg-green-50'}`}>
            <p className="text-sm text-muted-foreground">Remaining Balance</p>
            <p className={`text-2xl font-bold ${hasBalance ? 'text-orange-600' : 'text-green-600'}`}>
              {formatCurrency(summary.remainingBalance)}
            </p>
          </div>
        </div>

        {hasBalance && (
          <div className="flex items-center gap-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <AlertCircle className="h-5 w-5 text-orange-600" />
            <span className="text-sm text-orange-700">
              Outstanding balance: {formatCurrency(summary.remainingBalance)} remaining
            </span>
          </div>
        )}

        {isFullyPaid && summary.totalFee > 0 && (
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
            <Badge className="bg-green-600">Fully Paid</Badge>
            <span className="text-sm text-green-700">All payments have been completed</span>
          </div>
        )}

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Payment History</h3>
            {canManagePayments && (
              <Button size="sm" onClick={() => setShowAddModal(true)}>
                <Plus className="h-4 w-4 mr-1" />
                Add Payment
              </Button>
            )}
          </div>

          {summary.payments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <IndianRupee className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No payment records yet</p>
              {canManagePayments && (
                <Button variant="outline" size="sm" className="mt-4" onClick={() => setShowAddModal(true)}>
                  Record first payment
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Receipt #</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summary.payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>{formatDate(payment.paymentDate)}</TableCell>
                    <TableCell className="font-medium text-green-600">
                      {formatCurrency(payment.amount)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {payment.paymentMethod.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>{payment.receiptNumber || '-'}</TableCell>
                    <TableCell className="text-right">
                      {canManagePayments && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-600 hover:bg-red-50"
                          onClick={() => handleDeletePayment(payment.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </CardContent>

      <AddPaymentModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddPayment}
        remainingBalance={summary.remainingBalance}
      />
    </Card>
  )
}