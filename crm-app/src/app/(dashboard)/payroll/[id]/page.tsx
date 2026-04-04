'use client'

import React from 'react'
import { useParams } from 'next/navigation'
import { Breadcrumb } from '@/components/layout/breadcrumb'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

import { getPayrollById } from '@/lib/mock-data'
import { mockUsers } from '@/lib/mock-data/users'
import { formatCurrency, formatDate, getInitials } from '@/lib/utils'
import { ArrowLeft, Download, Printer } from 'lucide-react'
import Link from 'next/link'

export default function PayslipDetailPage() {
  const params = useParams()
  const payrollId = params.id as string
  const payroll = getPayrollById(payrollId)

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

  const employee = mockUsers.find(u => u.id === payroll.employeeId)

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
            <p className="text-muted-foreground">{payroll.month} {payroll.year}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
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
                <AvatarImage src={employee?.avatar || undefined} />
                <AvatarFallback>{employee ? getInitials(employee.name) : '?'}</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle>{payroll.employeeName}</CardTitle>
                <p className="text-sm text-muted-foreground">{employee?.department} - {employee?.role.replace('_', ' ')}</p>
              </div>
            </div>
            <Badge className="capitalize" variant={payroll.status === 'paid' ? 'default' : 'secondary'}>
              {payroll.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
            <div>
              <p className="text-sm text-muted-foreground">Pay Period</p>
              <p className="font-medium">{payroll.month} {payroll.year}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pay Date</p>
              <p className="font-medium">{payroll.paidAt ? formatDate(payroll.paidAt) : 'Pending'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Days Worked</p>
              <p className="font-medium">{payroll.daysWorked}/{payroll.daysInMonth}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Leaves Taken</p>
              <p className="font-medium">{payroll.leavesTaken} days</p>
            </div>
          </div>

          <Separator className="my-6" />

          <div className="grid grid-cols-2 gap-8">
            <div>
              <h4 className="font-semibold mb-4">Earnings</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Basic Salary</span>
                  <span className="font-medium">{formatCurrency(payroll.salary.basic)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">HRA</span>
                  <span className="font-medium">{formatCurrency(payroll.salary.hra)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Allowances</span>
                  <span className="font-medium">{formatCurrency(payroll.salary.allowances)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span>Gross Salary</span>
                  <span>{formatCurrency(payroll.salary.gross)}</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Deductions</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">PF Contribution</span>
                  <span className="font-medium">{formatCurrency(payroll.salary.deductions * 0.4)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ESI</span>
                  <span className="font-medium">{formatCurrency(payroll.salary.deductions * 0.2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Professional Tax</span>
                  <span className="font-medium">{formatCurrency(payroll.salary.deductions * 0.2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Other Deductions</span>
                  <span className="font-medium">{formatCurrency(payroll.salary.deductions * 0.2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold text-red-600">
                  <span>Total Deductions</span>
                  <span>{formatCurrency(payroll.salary.deductions)}</span>
                </div>
              </div>
            </div>
          </div>

          <Separator className="my-6" />

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold">Net Salary</span>
              <span className="text-2xl font-bold text-green-700">{formatCurrency(payroll.salary.net)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function Separator({ className }: { className?: string }) {
  return <div className={`h-px bg-border ${className || ''}`} />
}