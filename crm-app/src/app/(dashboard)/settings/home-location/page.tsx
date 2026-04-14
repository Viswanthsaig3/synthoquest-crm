'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/auth-context'
import { Breadcrumb } from '@/components/layout/breadcrumb'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/toast'
import { hasPermission } from '@/lib/client-permissions'
import { MapPin, Loader2, Save, Trash2, RefreshCw, ExternalLink, AlertCircle, Lock, Unlock } from 'lucide-react'
import { getAccessToken } from '@/lib/api/client'
import { getCurrentPositionForAttendance } from '@/lib/client-geolocation'
import Link from 'next/link'

interface HomeLocation {
  latitude: number
  longitude: number
  radiusMeters: number
  label?: string
  updatedAt: string
  isLocked?: boolean
}

export default function HomeLocationSettingsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [gettingLocation, setGettingLocation] = useState(false)
  const [homeLocation, setHomeLocation] = useState<HomeLocation | null>(null)
  const [isLocked, setIsLocked] = useState(false)
  const [formData, setFormData] = useState({
    latitude: '',
    longitude: '',
    radiusMeters: '300',
    label: 'Home',
  })

  const canManage = hasPermission(user, 'attendance.manage_home_location_self')
  const isAdmin = hasPermission(user, 'attendance.manage_home_location_all')

  useEffect(() => {
    if (user && !canManage) {
      router.replace('/settings/profile')
    }
  }, [user, canManage, router])

  const fetchHomeLocation = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/settings/home-location', {
        headers: { Authorization: `Bearer ${getAccessToken()}` },
      })
      const data = await res.json()
      if (res.ok) {
        setHomeLocation(data.data || null)
        setIsLocked(data.isLocked ?? false)
        if (data.data) {
          setFormData({
            latitude: data.data.latitude.toString(),
            longitude: data.data.longitude.toString(),
            radiusMeters: data.data.radiusMeters.toString(),
            label: data.data.label || 'Home',
          })
        }
      }
    } catch (error) {
      console.error('Failed to fetch home location:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (canManage) fetchHomeLocation()
  }, [canManage, fetchHomeLocation])

  const handleGetCurrentLocation = async () => {
    if (isLocked && !isAdmin) {
      toast({
        title: 'Location locked',
        description: 'Your home location is locked. Contact admin to change it.',
        variant: 'destructive',
      })
      return
    }

    setGettingLocation(true)
    const loc = await getCurrentPositionForAttendance()
    if (loc.ok) {
      setFormData({
        ...formData,
        latitude: loc.latitude.toFixed(6),
        longitude: loc.longitude.toFixed(6),
      })
      toast({
        title: 'Location captured',
        description: `Coordinates: ${loc.latitude.toFixed(4)}, ${loc.longitude.toFixed(4)}`,
      })
    } else {
      toast({
        title: 'Location error',
        description: loc.message,
        variant: 'destructive',
      })
    }
    setGettingLocation(false)
  }

  const handleSave = async () => {
    if (!formData.latitude || !formData.longitude) {
      toast({
        title: 'Missing coordinates',
        description: 'Please get your location or enter coordinates manually.',
        variant: 'destructive',
      })
      return
    }

    if (isLocked && !isAdmin) {
      toast({
        title: 'Location locked',
        description: 'Your home location is locked. Contact admin to change it.',
        variant: 'destructive',
      })
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/settings/home-location', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAccessToken()}`,
        },
        body: JSON.stringify({
          latitude: parseFloat(formData.latitude),
          longitude: parseFloat(formData.longitude),
          radiusMeters: parseInt(formData.radiusMeters) || 300,
          label: formData.label,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save')

      setHomeLocation(data.data)
      setIsLocked(data.data?.isLocked ?? true)
      toast({
        title: 'Home location saved',
        description: data.message || 'Your check-in location has been configured and locked.',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save home location',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!isAdmin) {
      toast({
        title: 'Not allowed',
        description: 'Only admin can remove home location.',
        variant: 'destructive',
      })
      return
    }

    setDeleting(true)
    try {
      const res = await fetch('/api/settings/home-location', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getAccessToken()}` },
      })
      if (!res.ok) throw new Error('Failed to delete')

      setHomeLocation(null)
      setIsLocked(false)
      setFormData({ latitude: '', longitude: '', radiusMeters: '300', label: 'Home' })
      toast({
        title: 'Home location removed',
        description: 'User can now set a new home location.',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to remove home location',
        variant: 'destructive',
      })
    } finally {
      setDeleting(false)
    }
  }

  if (!user || !canManage) return null

  const isFormDisabled = isLocked && !isAdmin

  return (
    <div className="space-y-6">
      <Breadcrumb />

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            <CardTitle>Home Location</CardTitle>
            {isLocked && (
              <div className="flex items-center gap-1 ml-2 text-orange-600">
                <Lock className="h-4 w-4" />
                <span className="text-sm font-medium">Locked</span>
              </div>
            )}
          </div>
          <CardDescription>
            {isLocked && !isAdmin
              ? 'Your home location is locked. Contact admin to change it.'
              : 'Set your allowed check-in location. This will be locked after saving.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {isLocked && !isAdmin && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <Lock className="h-4 w-4 text-orange-600 shrink-0 mt-0.5" />
                    <div className="text-sm text-orange-700">
                      <p className="font-medium mb-1">Location Locked</p>
                      <p>
                        Your home location has been locked and cannot be changed. 
                        Please contact your manager or HR to request a change.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {!isLocked && !homeLocation && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-700">
                      <p className="font-medium mb-1">Why is this required?</p>
                      <p>
                        Your home location ensures attendance integrity. Check-ins outside this radius 
                        will be logged with a warning for admin review, but won&apos;t be blocked.
                      </p>
                      <p className="mt-2 font-medium">
                        ⚠️ Once saved, this location will be locked. Contact admin to change it later.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Button
                    onClick={handleGetCurrentLocation}
                    disabled={gettingLocation || isFormDisabled}
                    variant="outline"
                  >
                    {gettingLocation ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <MapPin className="h-4 w-4 mr-2" />
                    )}
                    {gettingLocation ? 'Getting location...' : 'Get Current Location'}
                  </Button>

                  {formData.latitude && formData.longitude && (
                    <a
                      href={`https://www.google.com/maps?q=${formData.latitude},${formData.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline flex items-center gap-1"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Preview on Google Maps
                    </a>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="latitude">Latitude</Label>
                    <Input
                      id="latitude"
                      value={formData.latitude}
                      onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                      placeholder="16.303404"
                      disabled={isFormDisabled}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="longitude">Longitude</Label>
                    <Input
                      id="longitude"
                      value={formData.longitude}
                      onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                      placeholder="80.443530"
                      disabled={isFormDisabled}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="radius">Allowed Radius (meters)</Label>
                    <Input
                      id="radius"
                      type="number"
                      min={50}
                      max={500}
                      value={formData.radiusMeters}
                      onChange={(e) => setFormData({ ...formData, radiusMeters: e.target.value })}
                      disabled={isFormDisabled}
                    />
                    <p className="text-xs text-muted-foreground">
                      Distance from your location where check-ins are allowed. Default: 300m
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="label">Label</Label>
                    <Input
                      id="label"
                      value={formData.label}
                      onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                      placeholder="Home, Office, etc."
                      disabled={isFormDisabled}
                    />
                  </div>
                </div>
              </div>

              {homeLocation && (
                <div className="border rounded-lg p-4 bg-muted/50">
                  <div className="flex items-center gap-2 mb-2">
                    {isLocked ? (
                      <Lock className="h-4 w-4 text-orange-600" />
                    ) : (
                      <Unlock className="h-4 w-4 text-green-600" />
                    )}
                    <p className="text-sm font-medium">
                      {isLocked ? 'Locked location' : 'Current saved location'}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Latitude:</span>
                      <span className="ml-2 font-mono">{homeLocation.latitude.toFixed(6)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Longitude:</span>
                      <span className="ml-2 font-mono">{homeLocation.longitude.toFixed(6)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Radius:</span>
                      <span className="ml-2">{homeLocation.radiusMeters}m</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Set on:</span>
                      <span className="ml-2">{new Date(homeLocation.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <a
                    href={`https://www.google.com/maps?q=${homeLocation.latitude},${homeLocation.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline mt-2 inline-flex items-center gap-1"
                  >
                    <ExternalLink className="h-3 w-3" />
                    View saved location on map
                  </a>
                </div>
              )}

              <div className="flex items-center gap-4">
                {!isLocked && (
                  <Button onClick={handleSave} disabled={saving || isFormDisabled}>
                    {saving ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    {saving ? 'Saving...' : 'Save & Lock Location'}
                  </Button>
                )}

                {isAdmin && homeLocation && (
                  <Button
                    variant="outline"
                    onClick={handleDelete}
                    disabled={deleting}
                    className="text-red-600 hover:text-red-700"
                  >
                    {deleting ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4 mr-2" />
                    )}
                    {deleting ? 'Removing...' : 'Remove & Unlock'}
                  </Button>
                )}

                <Button variant="ghost" onClick={fetchHomeLocation}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>

              {isAdmin && !isLocked && homeLocation && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm">
                  <div className="flex items-start gap-2">
                    <Unlock className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                    <div className="text-green-700">
                      <p className="font-medium">Admin privileges</p>
                      <p>
                        As admin, you can remove and unlock this location, allowing the user to set a new one.
                        You can also update any user&apos;s location from the Employees page.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}