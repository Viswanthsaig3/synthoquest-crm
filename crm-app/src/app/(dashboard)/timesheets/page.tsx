'use client'

import React, { useMemo } from 'react'
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
import { mockTimesheets, getTimesheetsByEmployee, getPendingTimesheets } from '@/lib/mock-data'
import { formatDate } from '@/lib/utils'
import { Clock, Plus, Eye, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import Link from 'next/link'

export default function TimesheetsPage() {
  const { user } = useAuth()

  if (!user) return null

  const isAdmin = user.role === 'admin' || user.role === 'hr' || user.role === 'team_lead'
  const myTimesheets = isAdmin ? mockTimesheets : getTimesheetsByEmployee(user.id)
  const pendingTimesheets = getPendingTimesheets()

  const pageTitle = isAdmin ? 'Timesheet Management' : 'My Timesheets'
  const pageDescription = isAdmin 
    ? `${pendingTimesheets.length} pending approvals` 
    : `${myTimesheets.length} timesheet records`

  return (
    <div className="space-y-6">
      <Breadcrumb />
      
      <PageHeader
        title={pageTitle}
        description={pageDescription}
        action={!isAdmin ? { label: 'Submit Timesheet', href: '/timesheets/new' } : undefined}
      />

      {isAdmin && pendingTimesheets.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="font-medium text-yellow-800">{pendingTimesheets.length} pending timesheet approvals</p>
                <p className="text-sm text-yellow-600">Review and approve team timesheets</p>
              </div>
            </div>
            <Link href="/timesheets/approvals">
              <Button>View Approvals</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          {myTimesheets.length === 0 ? (
            <EmptyState
              icon={Clock}
              title="No timesheets"
              description="Submit your first timesheet entry."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Week</TableHead>
                  {isAdmin && <TableHead>Employee</TableHead>}
                  <TableHead>Total Hours</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Approved By</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {myTimesheets.map((ts) => (
                  <TableRow key={ts.id}>
                    <TableCell>
                      <div className="font-medium">
                        Week of {formatDate(ts.weekStartDate)}
                      </div>
                    </TableCell>
                    {isAdmin && <TableCell>{ts.employeeName}</TableCell>}
                    <TableCell>
                      <Badge variant="outline">{ts.totalHours}h</Badge>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={ts.status} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {ts.approvedBy || '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/timesheets/${ts.id}`}>
                        <Button variant="ghost" size="icon">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
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