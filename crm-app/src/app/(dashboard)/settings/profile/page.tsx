'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/context/auth-context'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useToast } from '@/components/ui/toast'
import { getInitials, getErrorMessage } from '@/lib/utils'
import { hasPermission } from '@/lib/client-permissions'
import { getAccessToken } from '@/lib/api/client'
import { getCurrentPositionForAttendance } from '@/lib/client-geolocation'
import { Save, Loader2, Camera, MapPin } from 'lucide-react'

export default function SettingsProfilePage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
  })
  const [locationLoading, setLocationLoading] = useState(false)
  const [gpsLoading, setGpsLoading] = useState(false)
  const [homeLocation, setHomeLocation] = useState({
    latitude: '',
    longitude: '',
    radiusMeters: '300',
    label: 'Home',
  })

  const canManageOwnHomeLocation =
    hasPermission(user, 'attendance.manage_home_location_self') ||
    hasPermission(user, 'attendance.manage_home_location_all')

  useEffect(() => {
    const loadLocationConfig = async () => {
      try {
        if (canManageOwnHomeLocation && user) {
          const homeRes = await fetch(`/api/users/${user.id}/home-location`, {
            headers: {
              Authorization: `Bearer ${getAccessToken()}`,
            },
          })
          const homeData = await homeRes.json()
          if (homeRes.ok && homeData.data) {
            setHomeLocation({
              latitude: homeData.data.latitude?.toString() || '',
              longitude: homeData.data.longitude?.toString() || '',
              radiusMeters: String(homeData.data.radiusMeters || 300),
              label: homeData.data.label || 'Home',
            })
          }
        }
      } catch (error) {
        console.error('Failed to load home location:', error)
      }
    }

    void loadLocationConfig()
  }, [canManageOwnHomeLocation, user?.id])

  const handleSave = async () => {
    setLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setLoading(false)
    toast({
      title: 'Settings updated',
      description: 'Your profile has been updated successfully.',
    })
  }

  const persistHomeLocation = async (latitude: number, longitude: number) => {
    if (!user) throw new Error('User not found')
    const response = await fetch(`/api/users/${user.id}/home-location`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getAccessToken()}`,
      },
      body: JSON.stringify({
        latitude,
        longitude,
        radiusMeters: Number(homeLocation.radiusMeters) || 300,
        label: homeLocation.label || 'Home',
      }),
    })
    const result = await response.json()
    if (!response.ok) throw new Error(result.error || 'Failed to save home location')
  }

  const handleSaveHomeLocation = async () => {
    try {
      setLocationLoading(true)
      await persistHomeLocation(Number(homeLocation.latitude), Number(homeLocation.longitude))
      toast({
        title: 'Home location updated',
        description: 'Your work-from-home geofence was saved.',
      })
    } catch (error: unknown) {
      toast({
        title: 'Error',
        description: getErrorMessage(error, 'Failed to save home location'),
        variant: 'destructive',
      })
    } finally {
      setLocationLoading(false)
    }
  }

  const handleSetHomeFromCurrentLocation = async () => {
    try {
      setGpsLoading(true)
      const loc = await getCurrentPositionForAttendance()
      if (!loc.ok) {
        toast({
          title: 'Location required',
          description: loc.message,
          variant: 'destructive',
        })
        return
      }
      await persistHomeLocation(loc.latitude, loc.longitude)
      setHomeLocation((prev) => ({
        ...prev,
        latitude: loc.latitude.toFixed(6),
        longitude: loc.longitude.toFixed(6),
      }))
      toast({
        title: 'Home location updated',
        description: 'Your work-from-home geofence was saved from your current position.',
      })
    } catch (error: unknown) {
      toast({
        title: 'Error',
        description: getErrorMessage(error, 'Failed to save home location'),
        variant: 'destructive',
      })
    } finally {
      setGpsLoading(false)
    }
  }

  if (!user) return null

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Update your personal information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-6">
            <div className="relative">
              <Avatar className="h-20 w-20">
                <AvatarImage src={user.avatar || undefined} />
                <AvatarFallback className="text-xl">{getInitials(user.name)}</AvatarFallback>
              </Avatar>
              <button type="button" className="absolute bottom-0 right-0 p-1 rounded-full bg-primary text-primary-foreground">
                <Camera className="h-4 w-4" />
              </button>
            </div>
            <div>
              <p className="font-medium">{user.name}</p>
              <p className="text-sm text-muted-foreground capitalize">{user.role.replace('_', ' ')}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Password</CardTitle>
          <CardDescription>Change your password</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Current Password</Label>
            <Input id="currentPassword" type="password" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <Input id="newPassword" type="password" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <Input id="confirmPassword" type="password" />
          </div>
          <Button variant="outline">Change Password</Button>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      {canManageOwnHomeLocation && (
        <Card>
          <CardHeader>
            <CardTitle>Home Location (WFH Geofence)</CardTitle>
            <CardDescription>
              Set your home location for work-from-home attendance validation.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="homeLat">Latitude</Label>
                <Input
                  id="homeLat"
                  value={homeLocation.latitude}
                  onChange={(e) => setHomeLocation({ ...homeLocation, latitude: e.target.value })}
                  placeholder="12.971598"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="homeLng">Longitude</Label>
                <Input
                  id="homeLng"
                  value={homeLocation.longitude}
                  onChange={(e) => setHomeLocation({ ...homeLocation, longitude: e.target.value })}
                  placeholder="77.594566"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="homeRadius">Allowed Radius (meters)</Label>
                <Input
                  id="homeRadius"
                  type="number"
                  min={50}
                  max={10000}
                  value={homeLocation.radiusMeters}
                  onChange={(e) => setHomeLocation({ ...homeLocation, radiusMeters: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="homeLabel">Label</Label>
                <Input
                  id="homeLabel"
                  value={homeLocation.label}
                  onChange={(e) => setHomeLocation({ ...homeLocation, label: e.target.value })}
                  placeholder="Home"
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleSetHomeFromCurrentLocation}
                disabled={gpsLoading || locationLoading}
              >
                {gpsLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Getting location…
                  </>
                ) : (
                  <>
                    <MapPin className="mr-2 h-4 w-4" />
                    Set home from current location
                  </>
                )}
              </Button>
              <Button
                type="button"
                onClick={handleSaveHomeLocation}
                disabled={locationLoading || gpsLoading}
              >
                {locationLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Home Location'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
