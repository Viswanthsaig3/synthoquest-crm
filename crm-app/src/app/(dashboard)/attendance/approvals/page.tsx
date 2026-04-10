'use client'

import React from 'react'
import Link from 'next/link'
import { Breadcrumb } from '@/components/layout/breadcrumb'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PageHeader, PermissionGuard } from '@/components/shared'
import { canApproveTimesheet } from '@/lib/permissions'

export default function AttendanceApprovalsPage() {
  return (
    <PermissionGuard check={canApproveTimesheet}>
      <div className="space-y-6">
        <Breadcrumb />
        <PageHeader
          title="Attendance Approvals Deprecated"
          description="Time-entry approvals are deprecated. Use timesheet approvals."
        />

        <Card>
          <CardHeader>
            <CardTitle>Use Timesheet Approvals</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              The canonical approval flow is now `timesheets + timesheet_entries`.
            </p>
            <Link href="/timesheets/approvals">
              <Button>Go to Timesheet Approvals</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </PermissionGuard>
  )
}
