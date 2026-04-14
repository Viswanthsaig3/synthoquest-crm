'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { Breadcrumb } from '@/components/layout/breadcrumb'
import { PageHeader, EmptyState } from '@/components/shared'
import { AttendanceSubNav } from '@/components/attendance/attendance-subnav'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select } from '@/components/ui/select'
import { AlertCircle, Loader2, ExternalLink } from 'lucide-react'
import type { AttendanceGeofenceWarning } from '@/types/time-entry'
import { useToast } from '@/components/ui/toast'
import { formatDate, formatTime, getErrorMessage } from '@/lib/utils'
import { useAuth } from '@/context/auth-context'
import { hasPermission } from '@/lib/client-permissions'
import { getAccessToken } from '@/lib/api/client'

export default function AttendanceWarningsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [warnings, setWarnings] = useState<AttendanceGeofenceWarning[]>([])
  const [statusFilter, setStatusFilter] = useState<string>('')
  const canViewWarnings = hasPermission(user, 'attendance.view_warnings')

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true)
        const token = getAccessToken()
        const params = new URLSearchParams()
        if (statusFilter) params.set('status', statusFilter)
        params.set('limit', '200')
        const response = await fetch(`/api/attendance/warnings?${params.toString()}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        const result = await response.json()
        if (!response.ok) throw new Error(result.error || 'Failed to load warnings')
        setWarnings(result.data || [])
      } catch (error: unknown) {
        toast({
          title: 'Error',
          description: getErrorMessage(error, 'Failed to load warnings'),
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
    }
    void run()
  }, [statusFilter, toast])

  const openCount = useMemo(
    () => warnings.filter((warning) => warning.status === 'open').length,
    [warnings]
  )

  if (!canViewWarnings) {
    return (
      <div className="space-y-6">
        <Breadcrumb />
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            You do not have permission to view geofence warnings.
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Breadcrumb />
        <Card>
          <CardContent className="py-12 text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Breadcrumb />
      <PageHeader
        title="Geofence Warnings"
        description={`${openCount} open warning${openCount === 1 ? '' : 's'}`}
      />

      <AttendanceSubNav />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <CardTitle>Out-of-radius attendance events</CardTitle>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-[180px]"
            >
              <option value="">All Status</option>
              <option value="open">Open</option>
              <option value="reviewed">Reviewed</option>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {warnings.length === 0 ? (
            <EmptyState
              icon={AlertCircle}
              title="No warnings found"
              description="All attendance actions are currently within configured radius."
            />
          ) : (
            <div className="space-y-3">
              {warnings.map((warning) => (
                <div key={warning.id} className="rounded-lg border p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-medium">
                        {warning.userName || warning.userEmail || warning.userId}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {warning.eventDate ? formatDate(new Date(warning.eventDate)) : formatDate(new Date(warning.createdAt))} -{' '}
                        {warning.eventType === 'check_in' ? 'Check-in' : 'Check-out'}{' '}
                        {warning.eventTime ? `at ${formatTime(new Date(warning.eventTime))}` : ''}
                      </p>
                    </div>
                    <Badge variant={warning.status === 'open' ? 'destructive' : 'outline'}>
                      {warning.status}
                    </Badge>
                  </div>
                  <div className="mt-3 grid gap-2 text-sm text-muted-foreground md:grid-cols-2">
                    <p>
                      Distance: <span className="font-medium text-foreground">{warning.distanceMeters ?? '-'}m</span>
                    </p>
                    <p>
                      Allowed radius:{' '}
                      <span className="font-medium text-foreground">{warning.allowedRadiusMeters ?? '-'}m</span>
                    </p>
                    <p>
                      Nearest reference:{' '}
                      <span className="font-medium text-foreground">{warning.nearestType}</span>
                    </p>
                    <p>
                      Coordinates:{' '}
                      <span className="font-medium text-foreground">
                        {warning.latitude ?? '-'}, {warning.longitude ?? '-'}
                      </span>
                    </p>
                  </div>
                  {warning.warningReason && (
                    <p className="mt-2 text-sm text-red-600">{warning.warningReason}</p>
                  )}
                  <div className="mt-3">
                    <a
                      href={`https://www.google.com/maps?q=${warning.latitude},${warning.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline flex items-center gap-1"
                    >
                      <ExternalLink className="h-3 w-3" />
                      View location on map
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
