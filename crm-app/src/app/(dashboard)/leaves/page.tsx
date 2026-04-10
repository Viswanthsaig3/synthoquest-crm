'use client'

import React, { useEffect, useState } from 'react'
import { useAuth } from '@/context/auth-context'
import { Breadcrumb } from '@/components/layout/breadcrumb'
import { PageHeader, StatusBadge, EmptyState, PermissionGuard } from '@/components/shared'
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

import { formatDate } from '@/lib/utils'
import { hasPermission } from '@/lib/client-permissions'
import { FileText, Plus, Calendar, CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { LeavesSubNav } from '@/components/leaves/leaves-subnav'
import type { Leave, LeaveBalance } from '@/types/leave'
import { useToast } from '@/components/ui/toast'

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

export default function LeavesPage() {
  const { user, token } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [myLeaves, setMyLeaves] = useState<Leave[]>([])
  const [leaveBalance, setLeaveBalance] = useState<LeaveBalance>({ sick: 0, casual: 0, paid: 0 })
  const [pendingLeaves, setPendingLeaves] = useState<Leave[]>([])

  useEffect(() => {
    if (!user || !token) return
    
    async function fetchData() {
      try {
        const now = new Date()
        const currentMonth = now.getMonth() + 1
        const currentYear = now.getFullYear()
        
        const [leavesRes, balanceRes, pendingRes] = await Promise.all([
          fetch('/api/leaves', {
            headers: { Authorization: `Bearer ${token}` }
          }),
          fetch(`/api/leaves/balance?month=${currentMonth}&year=${currentYear}`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          hasPermission(user, 'leaves.approve') 
            ? fetch('/api/leaves?status=pending', {
                headers: { Authorization: `Bearer ${token}` }
              })
            : Promise.resolve(null)
        ])
        
        if (leavesRes.ok) {
          const leavesData = await leavesRes.json()
          setMyLeaves(leavesData.data || [])
        }
        
        if (balanceRes.ok) {
          const balanceData = await balanceRes.json()
          setLeaveBalance(balanceData.data || { sick: 0, casual: 0, paid: 0 })
        }
        
        if (pendingRes && pendingRes.ok) {
          const pendingData = await pendingRes.json()
          setPendingLeaves(pendingData.data || [])
        }
      } catch (error) {
        console.error('Error fetching leaves data:', error)
        toast({
          title: 'Error',
          description: 'Failed to load leave data',
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [user, token, toast])

  if (!user) return null

  const isAdmin = hasPermission(user, 'leaves.approve')

  const pageTitle = isAdmin ? 'Leave Management' : 'My Leaves'
  const pageDescription = isAdmin 
    ? `${pendingLeaves.length} pending requests` 
    : 'Manage your leave requests'

  const currentMonthLabel = `${MONTHS[new Date().getMonth()]} ${new Date().getFullYear()}`

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <PermissionGuard check={(u) => hasPermission(u, 'leaves.apply') || hasPermission(u, 'leaves.approve')} fallbackMessage="You don't have permission to view leaves.">
      <div className="space-y-6">
        <Breadcrumb />
        <LeavesSubNav />

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <PageHeader
            title={pageTitle}
            description={pageDescription}
            action={!isAdmin ? { label: 'Apply Leave', href: '/leaves/apply' } : undefined}
          />
          {isAdmin && (
            <div className="flex items-center gap-2">
              <Link href="/leaves/calendar">
                <Button variant="outline">
                  <Calendar className="h-4 w-4 mr-2" />
                  View Calendar
                </Button>
              </Link>
              <Link href="/leaves/balances">
                <Button variant="outline">
                  Manage Balances
                </Button>
              </Link>
            </div>
          )}
        </div>

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
          <>
            <div className="p-4 rounded-lg bg-blue-50 border border-blue-200 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium">Monthly Leave Allocation</p>
                <p>Your leave balance is allocated monthly. Unused days do not carry over to the next month.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Sick Leave</p>
                      <p className="text-3xl font-bold">{leaveBalance.sick}</p>
                      <p className="text-xs text-muted-foreground">days remaining</p>
                      <p className="text-xs text-blue-600 mt-1">for {currentMonthLabel}</p>
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
                      <p className="text-xs text-blue-600 mt-1">for {currentMonthLabel}</p>
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
                      <p className="text-xs text-blue-600 mt-1">for {currentMonthLabel}</p>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
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
    </PermissionGuard>
  )
}