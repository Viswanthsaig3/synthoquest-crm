'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { Breadcrumb } from '@/components/layout/breadcrumb'
import { PageHeader, EmptyState } from '@/components/shared'
import { AttendanceSubNav } from '@/components/attendance/attendance-subnav'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AlertTriangle, Loader2, ShieldAlert, MapPin, User, Clock } from 'lucide-react'
import { useToast } from '@/components/ui/toast'
import { formatDate, formatTime, getErrorMessage } from '@/lib/utils'
import { useAuth } from '@/context/auth-context'
import { hasPermission } from '@/lib/client-permissions'
import { getAccessToken } from '@/lib/api/client'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface SpoofingRecord {
  id: string
  userId: string
  date: string
  checkInTime: string
  checkInLat: number
  checkInLng: number
  checkInDistanceMeters: number
  checkInInRadius: boolean
  userName?: string
  userEmail?: string
}

interface SelfUpdatedLocation {
  userId: string
  userName: string
  userEmail: string
  latitude: number
  longitude: number
  updatedAt: string
  updatedBy: string
}

interface AnomaliesData {
  spoofing: SpoofingRecord[]
  impossibleTravel: SpoofingRecord[]
  verificationFailed: SpoofingRecord[]
  selfUpdatedLocations: SelfUpdatedLocation[]
}

export default function AttendanceAnomaliesPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<AnomaliesData | null>(null)
  const [summary, setSummary] = useState<{
    spoofingCount: number
    impossibleTravelCount: number
    verificationFailedCount: number
    selfUpdatedLocationsCount: number
    totalAnomalies: number
  } | null>(null)
  const canViewWarnings = hasPermission(user, 'attendance.view_warnings')

  useEffect(() => {
    if (!canViewWarnings) return

    const fetchData = async () => {
      try {
        setLoading(true)
        const token = getAccessToken()
        const response = await fetch('/api/attendance/anomalies?limit=100', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        const result = await response.json()
        if (!response.ok) throw new Error(result.error || 'Failed to load anomalies')
        setData(result.data)
        setSummary(result.summary)
      } catch (error: unknown) {
        toast({
          title: 'Error',
          description: getErrorMessage(error, 'Failed to load anomalies'),
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
    }

    void fetchData()
  }, [canViewWarnings, toast])

  const tabs = useMemo(() => {
    if (!data) return []
    return [
      { label: 'GPS Spoofing', data: data.spoofing, count: data.spoofing.length, icon: ShieldAlert },
      { label: 'Impossible Travel', data: data.impossibleTravel, count: data.impossibleTravel.length, icon: AlertTriangle },
      { label: 'Verification Failed', data: data.verificationFailed, count: data.verificationFailed.length, icon: MapPin },
      { label: 'Self-Registered Locations', data: data.selfUpdatedLocations, count: data.selfUpdatedLocations.length, icon: User },
    ]
  }, [data])

  if (!canViewWarnings) {
    return (
      <div className="space-y-6">
        <Breadcrumb />
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            You do not have permission to view attendance anomalies.
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
        title="Location Anomalies"
        description={`${summary?.totalAnomalies || 0} suspicious events detected`}
      />

      <AttendanceSubNav />

      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-red-200">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <ShieldAlert className="h-8 w-8 text-red-600" />
                <div>
                  <p className="text-2xl font-bold text-red-600">{summary.spoofingCount}</p>
                  <p className="text-sm text-muted-foreground">GPS Spoofing</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-orange-200">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-8 w-8 text-orange-600" />
                <div>
                  <p className="text-2xl font-bold text-orange-600">{summary.impossibleTravelCount}</p>
                  <p className="text-sm text-muted-foreground">Impossible Travel</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-yellow-200">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <MapPin className="h-8 w-8 text-yellow-600" />
                <div>
                  <p className="text-2xl font-bold text-yellow-600">{summary.verificationFailedCount}</p>
                  <p className="text-sm text-muted-foreground">Verification Failed</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-200">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <User className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold text-blue-600">{summary.selfUpdatedLocationsCount}</p>
                  <p className="text-sm text-muted-foreground">Self-Registered</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="spoofing">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="spoofing">Spoofing ({summary?.spoofingCount || 0})</TabsTrigger>
          <TabsTrigger value="travel">Travel ({summary?.impossibleTravelCount || 0})</TabsTrigger>
          <TabsTrigger value="verification">Verification ({summary?.verificationFailedCount || 0})</TabsTrigger>
          <TabsTrigger value="locations">Locations ({summary?.selfUpdatedLocationsCount || 0})</TabsTrigger>
        </TabsList>

        <TabsContent value="spoofing">
          <Card>
            <CardHeader>
              <CardTitle>GPS Spoofing Indicators</CardTitle>
              <p className="text-sm text-muted-foreground">
                Check-ins with distance &lt;5m from reference point (impossible GPS precision)
              </p>
            </CardHeader>
            <CardContent>
              {!data?.spoofing.length ? (
                <EmptyState
                  icon={ShieldAlert}
                  title="No spoofing detected"
                  description="All check-ins have realistic GPS precision."
                />
              ) : (
                <div className="space-y-3">
                  {data.spoofing.map((record) => (
                    <div key={record.id} className="rounded-lg border border-red-200 bg-red-50 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="font-medium">{record.userName || record.userEmail}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(new Date(record.checkInTime))} - {formatTime(new Date(record.checkInTime))}
                          </p>
                        </div>
                        <Badge variant="destructive">
                          {record.checkInDistanceMeters}m
                        </Badge>
                      </div>
                      <div className="mt-3 text-sm">
                        <p className="text-red-700">
                          Suspicious: GPS shows exact match to reference point (real GPS typically has 10-15m error)
                        </p>
                        <Link
                          href={`https://www.google.com/maps?q=${record.checkInLat},${record.checkInLng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          View location on map
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="travel">
          <Card>
            <CardHeader>
              <CardTitle>Impossible Travel Detected</CardTitle>
              <p className="text-sm text-muted-foreground">
                GPS location differs &gt;50km from IP-derived location
              </p>
            </CardHeader>
            <CardContent>
              {!data?.impossibleTravel.length ? (
                <EmptyState
                  icon={AlertTriangle}
                  title="No impossible travel"
                  description="All check-ins have consistent GPS and IP locations."
                />
              ) : (
                <div className="space-y-3">
                  {data.impossibleTravel.map((record) => (
                    <div key={record.id} className="rounded-lg border border-orange-200 bg-orange-50 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="font-medium">{record.userName || record.userEmail}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(new Date(record.checkInTime))}
                          </p>
                        </div>
                        <Badge variant="destructive">High Risk</Badge>
                      </div>
                      <div className="mt-3 text-sm text-orange-700">
                        <p>User claimed GPS location far from IP-derived location. Potential VPN/GPS spoofing.</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="verification">
          <Card>
            <CardHeader>
              <CardTitle>Verification Failed</CardTitle>
              <p className="text-sm text-muted-foreground">
                Check-ins where server-side IP verification was unavailable
              </p>
            </CardHeader>
            <CardContent>
              {!data?.verificationFailed.length ? (
                <EmptyState
                  icon={MapPin}
                  title="All verifications passed"
                  description="Server-side IP verification succeeded for all check-ins."
                />
              ) : (
                <div className="space-y-3">
                  {data.verificationFailed.map((record) => (
                    <div key={record.id} className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="font-medium">{record.userName || record.userEmail}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(new Date(record.checkInTime))}
                          </p>
                        </div>
                        <Badge variant="outline" className="border-yellow-500 text-yellow-700">
                          Verification Failed
                        </Badge>
                      </div>
                      <div className="mt-3 text-sm text-yellow-700">
                        <p>IP geolocation API was rate limited or unavailable. Check-in was accepted without server verification.</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="locations">
          <Card>
            <CardHeader>
              <CardTitle>Self-Registered Home Locations</CardTitle>
              <p className="text-sm text-muted-foreground">
                Users who set their own home location without admin verification
              </p>
            </CardHeader>
            <CardContent>
              {!data?.selfUpdatedLocations.length ? (
                <EmptyState
                  icon={User}
                  title="No self-registrations"
                  description="All home locations were verified by admin."
                />
              ) : (
                <div className="space-y-3">
                  {data.selfUpdatedLocations.map((loc) => (
                    <div key={loc.userId} className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="font-medium">{loc.userName}</p>
                          <p className="text-sm text-muted-foreground">{loc.userEmail}</p>
                        </div>
                        <Badge variant="outline" className="border-blue-500 text-blue-700">
                          Self-Registered
                        </Badge>
                      </div>
                      <div className="mt-3 grid gap-2 text-sm">
                        <p className="text-blue-700">
                          Updated: {formatDate(new Date(loc.updatedAt))}
                        </p>
                        <p>
                          Location: {loc.latitude.toFixed(4)}, {loc.longitude.toFixed(4)}
                          <Link
                            href={`https://www.google.com/maps?q=${loc.latitude},${loc.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline ml-2"
                          >
                            (View map)
                          </Link>
                        </p>
                      </div>
                      <div className="mt-3">
                        <Link href={`/admin/users/${loc.userId}`}>
                          <Button variant="outline" size="sm">
                            Review User
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}