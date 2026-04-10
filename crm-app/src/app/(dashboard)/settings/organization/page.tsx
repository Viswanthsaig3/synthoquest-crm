'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/auth-context'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/toast'
import { COURSES } from '@/lib/constants'
import { getDepartments, type DepartmentRecord } from '@/lib/api/departments'
import { getEmployees } from '@/lib/api/employees'
import { hasPermission } from '@/lib/client-permissions'
import { Save, Loader2, Clock, Activity } from 'lucide-react'
import Link from 'next/link'
import { getErrorMessage } from '@/lib/utils'
import { getAccessToken } from '@/lib/api/client'
import { Switch } from '@/components/ui/switch'

export default function SettingsOrganizationPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [orgSettings, setOrgSettings] = useState({
    name: 'SynthoQuest Cyber Security Institute',
    email: 'contact@synthoquest.com',
    phone: '+91 98765 43210',
    address: 'Cyber City, Tech Park, Bangalore - 560001',
    website: 'www.synthoquest.com',
  })
  const [departments, setDepartments] = useState<DepartmentRecord[]>([])
  const [deptMemberCounts, setDeptMemberCounts] = useState<Record<string, number>>({})
  const [locationLoading, setLocationLoading] = useState(false)
  const [officeLocation, setOfficeLocation] = useState({
    officeLat: '',
    officeLng: '',
    allowedRadiusMeters: '500',
    requireGeolocation: false,
  })
  const [autoCheckoutSettings, setAutoCheckoutSettings] = useState({
    inactivityTimeoutMinutes: 30,
    autoCheckoutEnabled: true,
    heartbeatIntervalMinutes: 5,
    autoCheckoutOnLogout: true,
  })
  const [autoCheckoutLoading, setAutoCheckoutLoading] = useState(false)

  const canManageSettings = hasPermission(user, 'settings.manage')
  const canManageOfficeLocation = hasPermission(user, 'attendance.manage_office_location')

  useEffect(() => {
    if (user && !canManageSettings) {
      router.replace('/settings/profile')
    }
  }, [user, canManageSettings, router])

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const [deptRes, empRes] = await Promise.all([
          getDepartments(),
          getEmployees({ limit: 500 }).catch(() => ({ data: [] as { department?: string }[] })),
        ])
        if (cancelled) return
        setDepartments(deptRes.data || [])
        const counts: Record<string, number> = {}
        ;(deptRes.data || []).forEach((d) => {
          counts[d.key] = 0
        })
        for (const emp of empRes.data || []) {
          const k = emp.department
          if (k && counts[k] !== undefined) counts[k] += 1
        }
        setDeptMemberCounts(counts)
      } catch {
        if (!cancelled) setDepartments([])
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const loadOffice = async () => {
      try {
        if (canManageOfficeLocation) {
          const officeRes = await fetch('/api/settings/office-location', {
            headers: {
Authorization: `Bearer ${getAccessToken()}`,
            },
          })
          const officeData = await officeRes.json()
          if (officeRes.ok && officeData.data) {
            setOfficeLocation({
              officeLat: officeData.data.officeLat?.toString() || '',
              officeLng: officeData.data.officeLng?.toString() || '',
              allowedRadiusMeters: String(officeData.data.allowedRadiusMeters || 500),
              requireGeolocation: Boolean(officeData.data.requireGeolocation),
            })
          }

          const autoCheckoutRes = await fetch('/api/attendance/settings', {
            headers: {
              Authorization: `Bearer ${getAccessToken()}`,
            },
          })
          const autoCheckoutData = await autoCheckoutRes.json()
          if (autoCheckoutRes.ok && autoCheckoutData.data) {
            setAutoCheckoutSettings({
              inactivityTimeoutMinutes: autoCheckoutData.data.inactivityTimeoutMinutes ?? 30,
              autoCheckoutEnabled: autoCheckoutData.data.autoCheckoutEnabled ?? true,
              heartbeatIntervalMinutes: autoCheckoutData.data.heartbeatIntervalMinutes ?? 5,
              autoCheckoutOnLogout: autoCheckoutData.data.autoCheckoutOnLogout ?? true,
            })
          }
        }
      } catch (error) {
        console.error('Failed to load office location:', error)
      }
    }
    void loadOffice()
  }, [canManageOfficeLocation])

  const handleOrgSave = async () => {
    setLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setLoading(false)
    toast({
      title: 'Organization settings updated',
      description: 'Organization settings have been saved successfully.',
    })
  }

  const handleSaveOfficeLocation = async () => {
    try {
      setLocationLoading(true)
      const response = await fetch('/api/settings/office-location', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAccessToken()}`,
        },
        body: JSON.stringify({
          officeLat: officeLocation.officeLat ? Number(officeLocation.officeLat) : null,
          officeLng: officeLocation.officeLng ? Number(officeLocation.officeLng) : null,
          allowedRadiusMeters: Number(officeLocation.allowedRadiusMeters) || 500,
          requireGeolocation: officeLocation.requireGeolocation,
        }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Failed to save office location')
      toast({
        title: 'Office geofence updated',
        description: 'Attendance office location settings were saved.',
      })
    } catch (error: unknown) {
      toast({
        title: 'Error',
        description: getErrorMessage(error, 'Failed to save office location'),
        variant: 'destructive',
      })
    } finally {
      setLocationLoading(false)
    }
  }

  const handleSaveAutoCheckoutSettings = async () => {
    try {
      setAutoCheckoutLoading(true)
      const response = await fetch('/api/attendance/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAccessToken()}`,
        },
        body: JSON.stringify({
          inactivityTimeoutMinutes: autoCheckoutSettings.inactivityTimeoutMinutes,
          autoCheckoutEnabled: autoCheckoutSettings.autoCheckoutEnabled,
          heartbeatIntervalMinutes: autoCheckoutSettings.heartbeatIntervalMinutes,
          autoCheckoutOnLogout: autoCheckoutSettings.autoCheckoutOnLogout,
        }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Failed to save auto-checkout settings')
      toast({
        title: 'Auto-checkout settings updated',
        description: 'Inactivity timeout and heartbeat settings were saved.',
      })
    } catch (error: unknown) {
      toast({
        title: 'Error',
        description: getErrorMessage(error, 'Failed to save auto-checkout settings'),
        variant: 'destructive',
      })
    } finally {
      setAutoCheckoutLoading(false)
    }
  }

  if (!user) return null
  if (!canManageSettings) return null

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Organization Details</CardTitle>
          <CardDescription>Manage your organization information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="orgName">Organization Name</Label>
            <Input
              id="orgName"
              value={orgSettings.name}
              onChange={(e) => setOrgSettings({ ...orgSettings, name: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="orgEmail">Email</Label>
              <Input
                id="orgEmail"
                type="email"
                value={orgSettings.email}
                onChange={(e) => setOrgSettings({ ...orgSettings, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="orgPhone">Phone</Label>
              <Input
                id="orgPhone"
                value={orgSettings.phone}
                onChange={(e) => setOrgSettings({ ...orgSettings, phone: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="orgAddress">Address</Label>
            <Input
              id="orgAddress"
              value={orgSettings.address}
              onChange={(e) => setOrgSettings({ ...orgSettings, address: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="orgWebsite">Website</Label>
            <Input
              id="orgWebsite"
              value={orgSettings.website}
              onChange={(e) => setOrgSettings({ ...orgSettings, website: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Departments</CardTitle>
              <Link href="/settings/departments">
                <Button variant="outline" size="sm">
                  Manage
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {departments.map((dept) => (
                <div key={dept.key} className="flex items-center justify-between p-2 rounded-lg border">
                  <span className="font-medium">{dept.name}</span>
                  <Badge variant="outline">{deptMemberCounts[dept.key] ?? 0} members</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Courses</CardTitle>
            <CardDescription>{COURSES.length} courses configured</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {COURSES.slice(0, 5).map((course) => (
                <div key={course} className="text-sm p-2 rounded bg-muted">
                  {course}
                </div>
              ))}
              {COURSES.length > 5 && (
                <p className="text-xs text-muted-foreground text-center">
                  +{COURSES.length - 5} more courses
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {canManageOfficeLocation && (
        <Card>
          <CardHeader>
            <CardTitle>Attendance Geofence (Office)</CardTitle>
            <CardDescription>
              Configure office location and allowed radius for attendance checks.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="officeLat">Office Latitude</Label>
                <Input
                  id="officeLat"
                  value={officeLocation.officeLat}
                  onChange={(e) => setOfficeLocation({ ...officeLocation, officeLat: e.target.value })}
                  placeholder="12.971598"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="officeLng">Office Longitude</Label>
                <Input
                  id="officeLng"
                  value={officeLocation.officeLng}
                  onChange={(e) => setOfficeLocation({ ...officeLocation, officeLng: e.target.value })}
                  placeholder="77.594566"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="officeRadius">Allowed Radius (meters)</Label>
                <Input
                  id="officeRadius"
                  type="number"
                  min={50}
                  max={10000}
                  value={officeLocation.allowedRadiusMeters}
                  onChange={(e) =>
                    setOfficeLocation({
                      ...officeLocation,
                      allowedRadiusMeters: e.target.value,
                    })
                  }
                />
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={officeLocation.requireGeolocation}
                    onChange={(e) =>
                      setOfficeLocation({
                        ...officeLocation,
                        requireGeolocation: e.target.checked,
                      })
                    }
                  />
                  Require geolocation on attendance actions
                </label>
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={handleSaveOfficeLocation} disabled={locationLoading}>
                {locationLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Office Geofence'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {canManageOfficeLocation && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              <CardTitle>Auto-Checkout Settings</CardTitle>
            </div>
            <CardDescription>
              Configure automatic checkout for inactive sessions. Heartbeats track user activity.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
              <div className="space-y-1">
                <p className="font-medium">Enable Auto-Checkout</p>
                <p className="text-sm text-muted-foreground">
                  Automatically check out users when inactive for the configured timeout period.
                </p>
              </div>
              <Switch
                checked={autoCheckoutSettings.autoCheckoutEnabled}
                onCheckedChange={(checked) =>
                  setAutoCheckoutSettings({ ...autoCheckoutSettings, autoCheckoutEnabled: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
              <div className="space-y-1">
                <p className="font-medium">Auto-Checkout on Logout</p>
                <p className="text-sm text-muted-foreground">
                  Automatically check out users when they log out of the application.
                </p>
              </div>
              <Switch
                checked={autoCheckoutSettings.autoCheckoutOnLogout}
                onCheckedChange={(checked) =>
                  setAutoCheckoutSettings({ ...autoCheckoutSettings, autoCheckoutOnLogout: checked })
                }
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="inactivityTimeout">
                  <Clock className="inline h-4 w-4 mr-1" />
                  Inactivity Timeout (minutes)
                </Label>
                <Input
                  id="inactivityTimeout"
                  type="number"
                  min={5}
                  max={120}
                  value={autoCheckoutSettings.inactivityTimeoutMinutes}
                  onChange={(e) =>
                    setAutoCheckoutSettings({
                      ...autoCheckoutSettings,
                      inactivityTimeoutMinutes: parseInt(e.target.value) || 30,
                    })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Users will be auto-checked out after this period of no activity.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="heartbeatInterval">
                  Heartbeat Interval (minutes)
                </Label>
                <Input
                  id="heartbeatInterval"
                  type="number"
                  min={1}
                  max={30}
                  value={autoCheckoutSettings.heartbeatIntervalMinutes}
                  onChange={(e) =>
                    setAutoCheckoutSettings({
                      ...autoCheckoutSettings,
                      heartbeatIntervalMinutes: parseInt(e.target.value) || 5,
                    })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Client sends heartbeat pings at this interval while the tab is active.
                </p>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
              <p className="font-medium text-blue-700 mb-2">How it works:</p>
              <ul className="text-blue-600 space-y-1 list-disc list-inside">
                <li>Users with an open session send heartbeats every {autoCheckoutSettings.heartbeatIntervalMinutes} minutes</li>
                <li>If no heartbeat received for {autoCheckoutSettings.inactivityTimeoutMinutes} minutes, auto-checkout triggers</li>
                <li>Admins can adjust auto-checkout records through the attendance history page</li>
                <li>Heartbeats only sent when browser tab is visible and active</li>
              </ul>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleSaveAutoCheckoutSettings} disabled={autoCheckoutLoading}>
                {autoCheckoutLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Auto-Checkout Settings'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end">
        <Button onClick={handleOrgSave} disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Organization Settings
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
