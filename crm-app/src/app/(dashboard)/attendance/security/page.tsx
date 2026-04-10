'use client'

import React, { useEffect, useState } from 'react'
import { Breadcrumb } from '@/components/layout/breadcrumb'
import { PageHeader } from '@/components/shared'
import { AttendanceSubNav } from '@/components/attendance/attendance-subnav'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { useAuth } from '@/context/auth-context'
import { canViewAttendanceAdjustments } from '@/lib/client-permissions'
import { formatDate, formatTime } from '@/lib/utils'
import { Loader2, ShieldAlert, AlertTriangle, Info, ExternalLink } from 'lucide-react'
import { useToast } from '@/components/ui/toast'
import { getAccessToken } from '@/lib/api/client'

type SecurityEvent = {
  id: string
  userId: string
  attendanceRecordId: string | null
  eventType: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  details: Record<string, unknown>
  ipAddress: string | null
  userAgent: string | null
  detectedAt: string
  reviewedAt: string | null
  reviewNotes: string | null
  user: {
    id: string
    name: string
    email: string
  } | null
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  multiple_sessions: 'Multiple Active Sessions',
  device_change: 'Device Changed',
  rapid_heartbeat: 'Rapid Heartbeat',
  location_mismatch: 'Location Mismatch',
  suspicious_pattern: 'Suspicious Pattern',
}

const SEVERITY_COLORS: Record<string, string> = {
  low: 'bg-blue-100 text-blue-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800',
}

export default function AttendanceSecurityPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const canAccess = canViewAttendanceAdjustments(user)

  const [loading, setLoading] = useState(true)
  const [events, setEvents] = useState<SecurityEvent[]>([])
  const [severityFilter, setSeverityFilter] = useState<string>('all')
  const [eventTypeFilter, setEventTypeFilter] = useState<string>('all')
  const [fromDate, setFromDate] = useState<string>('')
  const [toDate, setToDate] = useState<string>('')

  const loadEvents = async () => {
    try {
      setLoading(true)
      const token = getAccessToken()
      const params = new URLSearchParams()
      if (severityFilter !== 'all') params.set('severity', severityFilter)
      if (eventTypeFilter !== 'all') params.set('eventType', eventTypeFilter)
      if (fromDate) params.set('fromDate', fromDate)
      if (toDate) params.set('toDate', toDate)

      const res = await fetch(`/api/attendance/security?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to load events')
      setEvents(data.data || [])
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to load events',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (canAccess) {
      loadEvents()
    }
  }, [severityFilter, eventTypeFilter, fromDate, toDate])

  if (!user) return null

  if (!canAccess) {
    return (
      <div className="space-y-6">
        <Breadcrumb />
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            You do not have permission to view security events.
          </CardContent>
        </Card>
      </div>
    )
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <ShieldAlert className="h-4 w-4 text-red-600" />
      case 'high':
        return <AlertTriangle className="h-4 w-4 text-orange-600" />
      default:
        return <Info className="h-4 w-4 text-blue-600" />
    }
  }

  return (
    <div className="space-y-6">
      <Breadcrumb />
      <PageHeader
        title="Attendance Security"
        description="Monitor suspicious activity and security events."
      />

      <AttendanceSubNav />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5" />
            Security Events
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <div className="space-y-2">
              <Label>Severity</Label>
              <Select 
                value={severityFilter} 
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="w-40"
              >
                <option value="all">All</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Event Type</Label>
              <Select 
                value={eventTypeFilter} 
                onChange={(e) => setEventTypeFilter(e.target.value)}
                className="w-48"
              >
                <option value="all">All</option>
                <option value="multiple_sessions">Multiple Sessions</option>
                <option value="device_change">Device Change</option>
                <option value="rapid_heartbeat">Rapid Heartbeat</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>From</Label>
              <Input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-40"
              />
            </div>
            <div className="space-y-2">
              <Label>To</Label>
              <Input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-40"
              />
            </div>
          </div>

          {loading ? (
            <div className="py-12 text-center">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : events.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              No security events found.
            </div>
          ) : (
            <div className="space-y-3">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="border rounded-lg p-4 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      {getSeverityIcon(event.severity)}
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {EVENT_TYPE_LABELS[event.eventType] || event.eventType}
                          </span>
                          <Badge className={SEVERITY_COLORS[event.severity]}>
                            {event.severity}
                          </Badge>
                          {event.reviewedAt && (
                            <Badge variant="outline" className="text-green-600">
                              Reviewed
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {event.user ? `${event.user.name} (${event.user.email})` : 'Unknown user'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Detected: {formatDate(new Date(event.detectedAt))} at{' '}
                          {formatTime(new Date(event.detectedAt))}
                        </p>
                        {event.ipAddress && (
                          <p className="text-xs text-muted-foreground font-mono">
                            IP: {event.ipAddress}
                          </p>
                        )}
                        {event.details && Object.keys(event.details).length > 0 && (
                          <div className="mt-2 p-2 bg-muted rounded text-xs">
                            <pre>{JSON.stringify(event.details, null, 2)}</pre>
                          </div>
                        )}
                      </div>
                    </div>
                    {event.attendanceRecordId && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          window.open(`/attendance/team`, '_blank')
                        }}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    )}
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