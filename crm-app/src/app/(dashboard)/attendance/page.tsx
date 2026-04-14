'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Breadcrumb } from '@/components/layout/breadcrumb'
import { AttendanceSubNav } from '@/components/attendance/attendance-subnav'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'
import { formatDate, formatTime } from '@/lib/utils'
import { AlertCircle, Clock, Loader2, LogIn, LogOut, Activity, MapPin, RefreshCw, ExternalLink, Settings } from 'lucide-react'
import type { AttendanceRecord, TodayAttendanceSummary } from '@/types/time-entry'
import { fetchWithAccessTokenRefresh } from '@/lib/api/auth-fetch'
import { getCurrentPositionForAttendance } from '@/lib/client-geolocation'
import { useAttendanceHeartbeat } from '@/hooks/use-attendance-heartbeat'
import Link from 'next/link'

interface UserLocation {
  latitude: number | null
  longitude: number | null
  loading: boolean
  error: string | null
}

interface OfficeLocation {
  latitude: number | null
  longitude: number | null
  radiusMeters: number
  requireGeolocation: boolean
}

interface HomeLocation {
  latitude: number
  longitude: number
  radiusMeters: number
  label?: string
}

export default function AttendancePage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState<TodayAttendanceSummary | null>(null)
  const [tick, setTick] = useState(0)
  const [showAutoCheckoutAlert, setShowAutoCheckoutAlert] = useState(false)
  const [userLocation, setUserLocation] = useState<UserLocation>({
    latitude: null,
    longitude: null,
    loading: false,
    error: null,
  })
  const [officeLocation, setOfficeLocation] = useState<OfficeLocation>({
    latitude: null,
    longitude: null,
    radiusMeters: 500,
    requireGeolocation: false,
  })
  const [homeLocation, setHomeLocation] = useState<HomeLocation | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [distanceInfo, setDistanceInfo] = useState<{
    toOffice: number | null
    toHome: number | null
    nearest: 'office' | 'home' | null
    inRadius: boolean | null
  }>({ toOffice: null, toHome: null, nearest: null, inRadius: null })

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const [attRes, officeRes, homeRes] = await Promise.all([
        fetchWithAccessTokenRefresh('/api/attendance/today'),
        fetchWithAccessTokenRefresh('/api/attendance/office-location'),
        fetchWithAccessTokenRefresh('/api/settings/home-location'),
      ])
      
      const attData = await attRes.json()
      setSummary(attData.data || null)
      
      if (officeRes.ok) {
        const officeData = await officeRes.json()
        setOfficeLocation({
          latitude: officeData.data?.officeLat,
          longitude: officeData.data?.officeLng,
          radiusMeters: officeData.data?.allowedRadiusMeters || 500,
          requireGeolocation: officeData.data?.requireGeolocation || false,
        })
      }
      
      if (homeRes.ok) {
        const homeData = await homeRes.json()
        setHomeLocation(homeData.data || null)
      }
    } catch (error) {
      console.error('Error fetching attendance:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const calculateDistance = useCallback((lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371000
    const toRad = (deg: number) => (deg * Math.PI) / 180
    const dLat = toRad(lat2 - lat1)
    const dLng = toRad(lng2 - lng1)
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
    return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)))
  }, [])

  const fetchUserLocation = useCallback(async () => {
    setUserLocation({ ...userLocation, loading: true, error: null })
    const loc = await getCurrentPositionForAttendance()
    if (loc.ok) {
      const newUserLocation = {
        latitude: loc.latitude,
        longitude: loc.longitude,
        loading: false,
        error: null,
      }
      setUserLocation(newUserLocation)

      if (officeLocation.latitude && officeLocation.longitude) {
        const toOffice = calculateDistance(loc.latitude, loc.longitude, officeLocation.latitude, officeLocation.longitude)
        let toHome: number | null = null
        let nearest: 'office' | 'home' | null = 'office'

        if (homeLocation) {
          toHome = calculateDistance(loc.latitude, loc.longitude, homeLocation.latitude, homeLocation.longitude)
          nearest = toHome < toOffice ? 'home' : 'office'
        }

        const nearestRadius = nearest === 'office' ? officeLocation.radiusMeters : (homeLocation?.radiusMeters || 300)
        const nearestDist = nearest === 'office' ? toOffice : (toHome ?? toOffice)

        setDistanceInfo({
          toOffice,
          toHome,
          nearest,
          inRadius: nearestDist <= nearestRadius,
        })
      }
    } else {
      setUserLocation({
        latitude: null,
        longitude: null,
        loading: false,
        error: loc.message,
      })
    }
  }, [userLocation, officeLocation, homeLocation, calculateDistance])

  const openSession = summary?.openSession ?? null
  const isCheckedIn = Boolean(openSession)

  const handleAutoCheckout = useCallback(() => {
    setShowAutoCheckoutAlert(true)
    toast({
      title: 'Session ended',
      description: 'You were automatically checked out due to inactivity.',
      variant: 'destructive',
    })
    fetchData()
  }, [fetchData, toast])

  const handleHeartbeatError = useCallback((error: Error) => {
    console.error('[Heartbeat] Error in hook:', error)
  }, [])

  useAttendanceHeartbeat({
    isCheckedIn,
    sessionId: openSession?.id,
    onAutoCheckout: handleAutoCheckout,
    onError: handleHeartbeatError,
  })

  useEffect(() => {
    if (!openSession?.checkInTime) return
    const interval = setInterval(() => setTick((t) => t + 1), 1000)
    return () => clearInterval(interval)
  }, [openSession?.id])

  const handleAttendanceAction = async (method: 'POST' | 'PUT') => {
    setActionLoading(true)
    try {
      const loc = await getCurrentPositionForAttendance()
      if (!loc.ok) {
        toast({
          title: 'Location required',
          description: loc.message,
          variant: 'destructive',
        })
        setUserLocation({
          latitude: null,
          longitude: null,
          loading: false,
          error: loc.message,
        })
        setActionLoading(false)
        return
      }

      setUserLocation({
        latitude: loc.latitude,
        longitude: loc.longitude,
        loading: false,
        error: null,
      })

      const res = await fetchWithAccessTokenRefresh('/api/attendance/today', {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          latitude: loc.latitude,
          longitude: loc.longitude,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        const errorMessage = data.error || 'Attendance action failed'

        if (data.code === 'LOCATION_VERIFICATION_FAILED') {
          toast({
            title: 'Location Verification Failed',
            description: data.details?.reason || 'Server could not verify your location.',
            variant: 'destructive',
          })
        } else if (data.code === 'IMPOSSIBLE_TRAVEL') {
          toast({
            title: 'Location Mismatch Detected',
            description: `Your GPS location is ${data.details?.ipGpsDistance} from your IP location. This may indicate GPS spoofing.`,
            variant: 'destructive',
          })
        } else {
          toast({
            title: 'Error',
            description: errorMessage,
            variant: 'destructive',
          })
        }

        if (data.details?.suggestion) {
          console.info('Suggestion:', data.details.suggestion)
        }
        if (data.details?.contactAdmin) {
          console.info('Contact admin:', data.details.contactAdmin)
        }

        setActionLoading(false)
        return
      }

      const session = data.data as AttendanceRecord

      if (method === 'POST') {
        if (data.warning) {
          toast({
            title: 'Checked in with warning',
            description: data.warning,
            variant: 'destructive',
          })
        } else if (session?.checkInInRadius === false) {
          toast({
            title: 'Checked in (outside radius)',
            description: `Location: ${loc.latitude.toFixed(4)}, ${loc.longitude.toFixed(4)}. Distance: ${session.checkInDistanceMeters}m. This has been flagged for admin review.`,
            variant: 'destructive',
          })
        } else if (session?.isLate) {
          toast({
            title: 'Checked in',
            description: `You are ${session.lateByMinutes} minutes late. Location: ${loc.latitude.toFixed(4)}, ${loc.longitude.toFixed(4)}`,
          })
        } else {
          toast({
            title: 'Checked in successfully',
            description: `Location: ${loc.latitude.toFixed(4)}, ${loc.longitude.toFixed(4)}`,
          })
        }
      } else {
        toast({
          title: 'Checked out',
          description: `Session duration: ${session?.totalHours?.toFixed(1) ?? '?'} hours`,
        })
      }

      fetchData()
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Attendance action failed'
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      })
    } finally {
      setActionLoading(false)
    }
  }

  const formatElapsed = (ms: number) => {
    const absMs = Math.abs(ms)
    const h = Math.floor(absMs / 3600000)
    const m = Math.floor((absMs % 3600000) / 60000)
    const s = Math.floor((absMs % 60000) / 1000)
    const formatted = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    return ms < 0 ? `-${formatted}` : formatted
  }

  const runningMs = useMemo(() => {
    if (!openSession?.checkInTime) return 0
    const elapsed = Date.now() - new Date(openSession.checkInTime).getTime()
    return Math.max(0, elapsed)
  }, [openSession?.checkInTime, openSession?.id, tick])
  const completedH = summary?.completedHoursToday ?? 0
  const totalDayHours = completedH + runningMs / 3600000

  const completedSessions = (summary?.sessions ?? []).filter((s) => s.checkOutTime)
  const firstLate = (summary?.sessions ?? []).find((s) => s.isLate)
  const hasUserLocation = userLocation.latitude !== null && userLocation.longitude !== null
  const needsHomeLocation = officeLocation.requireGeolocation && !homeLocation && !isCheckedIn

  if (loading) {
    return (
      <div className="space-y-6">
        <Breadcrumb />
        <Card>
          <CardContent className="py-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Breadcrumb />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Attendance</h1>
          <p className="text-muted-foreground">{formatDate(new Date())}</p>
        </div>
        <AttendanceSubNav />
      </div>

      {needsHomeLocation && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="py-6">
            <div className="flex items-start gap-4">
              <AlertCircle className="h-6 w-6 text-red-600 shrink-0" />
              <div className="flex-1">
                <h3 className="font-semibold text-red-700 mb-1">Home location required</h3>
                <p className="text-sm text-red-600 mb-4">
                  You must set your home/work location before you can check in. This ensures attendance integrity.
                </p>
                <Link href="/settings/home-location">
                  <Button variant="destructive">
                    <Settings className="h-4 w-4 mr-2" />
                    Set Home Location
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Today</CardTitle>
          <CardDescription>
            Multiple sessions per day: check out to end a block, then check in again when you resume.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center py-6 bg-muted/50 rounded-lg space-y-2">
            <p className="text-5xl font-mono font-bold">
              {openSession ? formatElapsed(runningMs) : '00:00:00'}
            </p>
            <p className="text-sm text-muted-foreground">Current session (HH : MM : SS)</p>
            <p className="text-lg font-semibold text-primary">
              Total today: {totalDayHours.toFixed(2)}h
            </p>
          </div>

          {!openSession && !needsHomeLocation && (
            <Card className="border-muted">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Location Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {userLocation.loading ? (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Getting your location...</span>
                  </div>
                ) : hasUserLocation ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">Your Position</p>
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-sm">
                            {userLocation.latitude?.toFixed(6)}, {userLocation.longitude?.toFixed(6)}
                          </span>
                          <a
                            href={`https://www.google.com/maps?q=${userLocation.latitude},${userLocation.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline flex items-center gap-1"
                          >
                            <ExternalLink className="h-3 w-3" />
                            Map
                          </a>
                        </div>
                      </div>

                      {distanceInfo.nearest && (
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-muted-foreground">Distance Status</p>
                          <div className={`flex items-center gap-2 ${distanceInfo.inRadius ? 'text-green-600' : 'text-orange-600'}`}>
                            {distanceInfo.inRadius ? (
                              <MapPin className="h-4 w-4" />
                            ) : (
                              <AlertCircle className="h-4 w-4" />
                            )}
                            <span className="text-sm">
                              {distanceInfo.inRadius ? 'In allowed radius' : 'Outside allowed radius'}
                            </span>
                          </div>
                          {distanceInfo.toOffice !== null && (
                            <p className="text-xs text-muted-foreground">
                              {distanceInfo.toHome !== null 
                                ? `Office: ${distanceInfo.toOffice}m, Home: ${distanceInfo.toHome}m`
                                : `Office: ${distanceInfo.toOffice}m`
                              }
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={fetchUserLocation}
                        disabled={actionLoading}
                      >
                        <RefreshCw className="h-3 w-3 mr-1" />
                        Refresh Location
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {userLocation.error ? (
                      <div className="flex items-start gap-2 text-red-600">
                        <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                        <span className="text-sm">{userLocation.error}</span>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Click below to get your current location before checking in.
                      </p>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={fetchUserLocation}
                      disabled={actionLoading}
                    >
                      <MapPin className="h-3 w-3 mr-1" />
                      Get My Location
                    </Button>
                  </div>
                )}

                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm font-medium text-muted-foreground mb-3">Allowed Locations</p>
                  <div className="space-y-3">
                    {officeLocation.latitude && officeLocation.longitude && (
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-3 w-3 text-blue-500" />
                          <span>Office</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono">{officeLocation.latitude.toFixed(4)}, {officeLocation.longitude.toFixed(4)}</span>
                          <a
                            href={`https://www.google.com/maps?q=${officeLocation.latitude},${officeLocation.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline"
                          >
                            Map
                          </a>
                        </div>
                      </div>
                    )}
                    
                    {homeLocation && (
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-3 w-3 text-green-500" />
                          <span>{homeLocation.label || 'Home'}</span>
                          <span className="text-xs text-muted-foreground">(you)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono">{homeLocation.latitude.toFixed(4)}, {homeLocation.longitude.toFixed(4)}</span>
                          <a
                            href={`https://www.google.com/maps?q=${homeLocation.latitude},${homeLocation.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline"
                          >
                            Map
                          </a>
                        </div>
                      </div>
                    )}

                    {!homeLocation && officeLocation.requireGeolocation && (
                      <div className="flex items-center gap-2 text-sm text-orange-600">
                        <AlertCircle className="h-3 w-3" />
                        <span>No home location set</span>
                        <Link href="/settings/home-location" className="text-xs text-primary hover:underline ml-2">
                          Set now
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {completedSessions.length > 0 && (
            <div className="space-y-2 text-sm border rounded-lg p-3">
              <p className="font-medium text-muted-foreground">Completed sessions</p>
              <ul className="space-y-2">
                {completedSessions.map((s, i) => (
                  <li key={s.id} className="flex justify-between gap-2 border-b border-border/50 pb-2 last:border-0 last:pb-0">
                    <span>
                      #{i + 1}{' '}
                      {s.checkInTime && formatTime(new Date(s.checkInTime))} –{' '}
                      {s.checkOutTime && formatTime(new Date(s.checkOutTime))}
                    </span>
                    <span className="font-medium tabular-nums">{s.totalHours?.toFixed(2) ?? '—'}h</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {openSession && (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">This session started</span>
                <span className="font-medium">
                  {openSession.checkInTime
                    ? formatTime(new Date(openSession.checkInTime))
                    : '—'}
                </span>
              </div>
              {openSession.checkInLat && openSession.checkInLng && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Check-in location</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm">
                      {openSession.checkInLat.toFixed(4)}, {openSession.checkInLng.toFixed(4)}
                    </span>
                    <a
                      href={`https://www.google.com/maps?q=${openSession.checkInLat},${openSession.checkInLng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline"
                    >
                      Map
                    </a>
                  </div>
                </div>
              )}
              {openSession.lastActivity && (
                <div className="flex items-center gap-2 text-green-600">
                  <Activity className="h-4 w-4 shrink-0" />
                  <span>Last activity: {formatTime(new Date(openSession.lastActivity))}</span>
                </div>
              )}
              {openSession.autoCheckout && (
                <div className="flex items-center gap-2 text-orange-600">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>
                    Auto-checkout ({openSession.autoCheckoutReason || 'system'})
                  </span>
                </div>
              )}
              {openSession.checkInInRadius === false && (
                <div className="flex items-center gap-2 text-red-600">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>
                    Check-in outside radius ({openSession.checkInDistanceMeters ?? '-'}m from{' '}
                    {openSession.checkInNearestType || 'reference'})
                  </span>
                </div>
              )}
            </div>
          )}

          {showAutoCheckoutAlert && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-sm">
              <div className="flex items-center gap-2 text-orange-700 font-medium mb-2">
                <AlertCircle className="h-4 w-4" />
                <span>Auto-checkout detected</span>
              </div>
              <p className="text-orange-600">
                Your session was automatically ended due to inactivity. If this was incorrect,
                please contact your manager or HR to request an adjustment.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => setShowAutoCheckoutAlert(false)}
              >
                Dismiss
              </Button>
            </div>
          )}

          {!openSession && firstLate && (
            <div className="flex items-center gap-2 text-yellow-600 text-sm">
              <AlertCircle className="h-4 w-4" />
              <span>Late on first arrival today by {firstLate.lateByMinutes} minutes</span>
            </div>
          )}

          {completedSessions.some(
            (s) => s.checkOutInRadius === false || s.checkInInRadius === false
          ) && (
            <div className="flex items-center gap-2 text-red-600 text-sm">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>One or more sessions have a geofence warning (see History).</span>
            </div>
          )}

          {!openSession ? (
            <Button 
              onClick={() => handleAttendanceAction('POST')} 
              className="w-full h-14 text-lg"
              disabled={actionLoading || needsHomeLocation}
            >
              {actionLoading ? (
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              ) : (
                <LogIn className="h-5 w-5 mr-2" />
              )}
              {actionLoading ? 'Checking in...' : 'Check In'}
            </Button>
          ) : (
            <Button 
              onClick={() => handleAttendanceAction('PUT')} 
              variant="destructive" 
              className="w-full h-14 text-lg"
              disabled={actionLoading}
            >
              {actionLoading ? (
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              ) : (
                <LogOut className="h-5 w-5 mr-2" />
              )}
              {actionLoading ? 'Checking out...' : 'Check Out'}
            </Button>
          )}

          {!openSession && completedSessions.length > 0 && (
            <p className="text-center text-sm text-muted-foreground">
              <Clock className="inline h-4 w-4 mr-1 align-text-bottom" />
              Start another work block with Check In when you return.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}