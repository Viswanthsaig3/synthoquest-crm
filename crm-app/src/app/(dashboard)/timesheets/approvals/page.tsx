'use client'

import React from 'react'
import { useAuth } from '@/context/auth-context'
import { Breadcrumb } from '@/components/layout/breadcrumb'
import { PageHeader, StatusBadge, EmptyState } from '@/components/shared'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { getPendingTimesheets } from '@/lib/mock-data'
import { mockUsers } from '@/lib/mock-data/users'
import { formatDate, getInitials } from '@/lib/utils'
import { Clock, CheckCircle, XCircle, Eye } from 'lucide-react'
import { useToast } from '@/components/ui/toast'

export default function TimesheetApprovalsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const pendingTimesheets = getPendingTimesheets()

  if (!user) return null

  const handleApprove = (id: string) => {
    toast({
      title: 'Timesheet approved',
      description: 'The timesheet has been approved successfully.',
    })
  }

  const handleReject = (id: string) => {
    toast({
      title: 'Timesheet rejected',
      description: 'The timesheet has been rejected.',
      variant: 'destructive',
    })
  }

  return (
    <div className="space-y-6">
      <Breadcrumb />
      
      <PageHeader
        title="Timesheet Approvals"
        description={`${pendingTimesheets.length} timesheets pending approval`}
      />

      <Card>
        <CardContent className="p-0">
          {pendingTimesheets.length === 0 ? (
            <EmptyState
              icon={Clock}
              title="No pending approvals"
              description="All timesheets have been reviewed."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Week</TableHead>
                  <TableHead>Total Hours</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingTimesheets.map((ts) => {
                  const employee = mockUsers.find(u => u.id === ts.employeeId)
                  return (
                    <TableRow key={ts.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={employee?.avatar} />
                            <AvatarFallback>{employee ? getInitials(employee.name) : '?'}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{ts.employeeName}</span>
                        </div>
                      </TableCell>
                      <TableCell>Week of {formatDate(ts.weekStartDate)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{ts.totalHours}h</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(ts.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleApprove(ts.id)}>
                            <CheckCircle className="h-4 w-4 mr-1 text-green-600" />
                            Approve
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleReject(ts.id)}>
                            <XCircle className="h-4 w-4 mr-1 text-red-600" />
                            Reject
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