'use client'

import React, { useState, useMemo } from 'react'
import { useAuth } from '@/context/auth-context'
import { Breadcrumb } from '@/components/layout/breadcrumb'
import { PageHeader, EmptyState, PermissionGuard } from '@/components/shared'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { mockPayments, mockStudents } from '@/lib/mock-data'
import { PAYMENT_STATUSES, PAYMENT_METHODS, COURSES } from '@/lib/constants'
import { formatDate, formatCurrency } from '@/lib/utils'
import { canViewAllPayments, canViewAssignedPayments, canCreatePayment } from '@/lib/permissions'
import { CreditCard, Eye, Download, Plus, IndianRupee, Calendar } from 'lucide-react'
import Link from 'next/link'

export default function PaymentsPage() {
  const { user } = useAuth()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [methodFilter, setMethodFilter] = useState('')

  if (!user) return null

  const canView = canViewAllPayments(user) || canViewAssignedPayments(user)

  const visiblePayments = useMemo(() => {
    if (!user) return []
    return canViewAllPayments(user) ? mockPayments : mockPayments.filter(p => p.collectedBy === user.id)
  }, [user])

  const filteredPayments = useMemo(() => {
    return visiblePayments.filter(payment => {
      const matchesSearch = payment.studentName.toLowerCase().includes(search.toLowerCase()) ||
        payment.receiptNumber.toLowerCase().includes(search.toLowerCase()) ||
        payment.courseName.toLowerCase().includes(search.toLowerCase())
      const matchesStatus = !statusFilter || payment.status === statusFilter
      const matchesMethod = !methodFilter || payment.method === methodFilter
      return matchesSearch && matchesStatus && matchesMethod
    })
  }, [visiblePayments, search, statusFilter, methodFilter])

  const canAdd = canCreatePayment(user)

  const totalAmount = filteredPayments.reduce((sum, p) => sum + p.amount, 0)
  const paidAmount = filteredPayments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0)

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-orange-100 text-orange-800',
      partial: 'bg-blue-100 text-blue-800',
      paid: 'bg-green-100 text-green-800',
      overdue: 'bg-red-100 text-red-800',
      refunded: 'bg-purple-100 text-purple-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  return (
    <PermissionGuard check={(u) => canViewAllPayments(u) || canViewAssignedPayments(u)} fallbackMessage="You don't have permission to view payments.">
      <div className="space-y-6">
        <Breadcrumb />
        
        <PageHeader
          title="Payments"
          description={`${filteredPayments.length} payment records found`}
          action={canAdd ? { label: 'Record Payment', href: '/payments/new' } : undefined}
        search={{ placeholder: 'Search payments...', value: search, onChange: setSearch }}
        filters={[
          { options: PAYMENT_STATUSES, value: statusFilter, onChange: setStatusFilter, placeholder: 'All Statuses' },
          { options: PAYMENT_METHODS, value: methodFilter, onChange: setMethodFilter, placeholder: 'All Methods' },
        ]}
        exportData
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-full">
                <IndianRupee className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Transactions</p>
                <p className="text-2xl font-bold">{formatCurrency(totalAmount)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-full">
                <CreditCard className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Collected</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(paidAmount)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 rounded-full">
                <Calendar className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">This Month</p>
                <p className="text-2xl font-bold">{formatCurrency(paidAmount * 0.4)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          {filteredPayments.length === 0 ? (
            <EmptyState
              icon={CreditCard}
              title="No payments found"
              description="Payment records will appear here."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Receipt #</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-medium">{payment.receiptNumber}</TableCell>
                    <TableCell>
                      <Link href={`/students/${payment.studentId}`} className="hover:text-primary">
                        {payment.studentName}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm">{payment.courseName}</p>
                        <p className="text-xs text-muted-foreground">{payment.batchName}</p>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{formatCurrency(payment.amount)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {payment.method.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(payment.status)}>
                        {payment.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(payment.paidAt || payment.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/payments/${payment.id}`}>
                        <Button variant="ghost" size="icon">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button variant="ghost" size="icon">
                        <Download className="h-4 w-4" />
                      </Button>
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