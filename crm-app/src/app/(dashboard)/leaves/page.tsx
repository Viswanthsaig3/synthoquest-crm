'use client'

import React from 'react'
import { useAuth } from '@/context/auth-context'
import { Breadcrumb } from '@/components/layout/breadcrumb'
import { PageHeader, StatusBadge, EmptyState } from '@/components/shared'
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
import { mockLeaves, getLeavesByEmployee, getLeaveBalance, getPendingLeaves } from '@/lib/mock-data'
import { formatDate } from '@/lib/utils'
import { FileText, Plus, Calendar, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import Link from 'next/link'

export default function LeavesPage() {
  const { user } = useAuth()

  if (!user) return null

  const isAdmin = user.role === 'admin' || user.role === 'hr' || user.role === 'team_lead'
  const myLeaves = isAdmin ? mockLeaves : getLeavesByEmployee(user.id)
  const leaveBalance = getLeaveBalance(user.id)
  const pendingLeaves = getPendingLeaves()

  const pageTitle = isAdmin ? 'Leave Management' : 'My Leaves'
  const pageDescription = isAdmin 
    ? `${pendingLeaves.length} pending requests` 
    : 'Manage your leave requests'

  return (
    <div className="space-y-6">
      <Breadcrumb />
      
      <PageHeader
        title={pageTitle}
        description={pageDescription}
        action={!isAdmin ? { label: 'Apply Leave', href: '/leaves/apply' } : undefined}
      />

      {isAdmin && pendingLeaves.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="font-medium text-yellow-800">{pendingLeaves.length} pending leave requests</p>
                <p className="text-sm text-yellow-600">Review and approve team leave requests</p>
              </div>
            </div>
            <Link href="/leaves/approvals">
              <Button>View Approvals</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {!isAdmin && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Sick Leave</p>
                  <p className="text-3xl font-bold">{leaveBalance.sick}</p>
                  <p className="text-xs text-muted-foreground">days remaining</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                  <FileText className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Casual Leave</p>
                  <p className="text-3xl font-bold">{leaveBalance.casual}</p>
                  <p className="text-xs text-muted-foreground">days remaining</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Paid Leave</p>
                  <p className="text-3xl font-bold">{leaveBalance.paid}</p>
                  <p className="text-xs text-muted-foreground">days remaining</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{isAdmin ? 'All Leave Requests' : 'Leave History'}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {myLeaves.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No leave requests"
              description={isAdmin ? "No leave requests found." : "You haven't applied for any leaves yet."}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  {isAdmin && <TableHead>Employee</TableHead>}
                  <TableHead>Type</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>To</TableHead>
                  <TableHead>Days</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {myLeaves.map((leave) => (
                  <TableRow key={leave.id}>
                    {isAdmin && <TableCell>{leave.employeeName}</TableCell>}
                    <TableCell>
                      <Badge variant="outline" className="capitalize">{leave.type}</Badge>
                    </TableCell>
                    <TableCell>{formatDate(leave.startDate)}</TableCell>
                    <TableCell>{formatDate(leave.endDate)}</TableCell>
                    <TableCell>{leave.days}</TableCell>
                    <TableCell className="max-w-xs truncate">{leave.reason}</TableCell>
                    <TableCell>
                      <StatusBadge status={leave.status} />
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