'use client'

import React from 'react'
import { useAuth } from '@/context/auth-context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/components/ui/toast'
import { Loader2, Plus, Save, Shield, Trash2 } from 'lucide-react'
import { hasPermission } from '@/lib/client-permissions'
import { getAccessToken } from '@/lib/api/client'

interface PermissionItem {
  id: string
  key: string
  name: string
  description?: string | null
  action: string
}

interface RoleItem {
  id: string
  key: string
  name: string
  description?: string | null
  isSystem: boolean
  permissions: string[]
}

export default function RolesPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [roles, setRoles] = React.useState<RoleItem[]>([])
  const [permissions, setPermissions] = React.useState<Record<string, PermissionItem[]>>({})
  const [selectedRole, setSelectedRole] = React.useState<RoleItem | null>(null)
  const [newRole, setNewRole] = React.useState({ key: '', name: '', description: '' })

  const token = getAccessToken()

  const authHeaders = React.useMemo(
    () => ({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    }),
    [token]
  )

  const loadData = React.useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const [rolesRes, permsRes] = await Promise.all([
        fetch('/api/roles', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/permissions', { headers: { Authorization: `Bearer ${token}` } }),
      ])

      if (!rolesRes.ok || !permsRes.ok) {
        throw new Error('Failed to load roles data')
      }

      const rolesData = await rolesRes.json()
      const permsData = await permsRes.json()
      setRoles(rolesData.data || [])
      setPermissions(permsData.data || {})
      setSelectedRole(rolesData.data?.[0] ?? null)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Unable to load roles and permissions',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [toast, token])

  React.useEffect(() => {
    loadData()
  }, [loadData])

  const allPermissions = React.useMemo(
    () => Object.values(permissions).flat(),
    [permissions]
  )

  if (!user || !hasPermission(user, 'roles.manage')) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="py-12 text-center">
            <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Access denied. Missing roles.manage permission.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const roleHasPermission = (key: string) => !!selectedRole?.permissions.includes(key)

  const togglePermission = async (permissionKey: string, enabled: boolean) => {
    if (!selectedRole) return
    setSaving(true)
    const next = enabled
      ? [...selectedRole.permissions, permissionKey]
      : selectedRole.permissions.filter((p) => p !== permissionKey)

    try {
      const res = await fetch(`/api/roles/${selectedRole.key}/permissions`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({ permissions: next }),
      })
      if (!res.ok) throw new Error('Failed to update permissions')
      const json = await res.json()
      const updated = { ...selectedRole, permissions: json.data.permissions || next }
      setSelectedRole(updated)
      setRoles((prev) => prev.map((r) => (r.key === updated.key ? updated : r)))
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update permissions', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const createNewRole = async () => {
    if (!newRole.key || !newRole.name) return
    setSaving(true)
    try {
      const res = await fetch('/api/roles', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(newRole),
      })
      if (!res.ok) throw new Error('Failed to create role')
      const json = await res.json()
      const created: RoleItem = json.data
      setRoles((prev) => [...prev, created])
      setSelectedRole(created)
      setNewRole({ key: '', name: '', description: '' })
      toast({ title: 'Role created', description: 'Custom role created successfully' })
    } catch (error) {
      toast({ title: 'Error', description: 'Unable to create role', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const updateRoleMeta = async () => {
    if (!selectedRole) return
    setSaving(true)
    try {
      const res = await fetch(`/api/roles/${selectedRole.key}`, {
        method: 'PATCH',
        headers: authHeaders,
        body: JSON.stringify({
          name: selectedRole.name,
          description: selectedRole.description ?? '',
        }),
      })
      if (!res.ok) throw new Error('Failed to update role')
      const json = await res.json()
      setSelectedRole((prev) => (prev ? { ...prev, ...json.data } : prev))
      setRoles((prev) => prev.map((r) => (r.key === json.data.key ? { ...r, ...json.data } : r)))
      toast({ title: 'Role updated', description: 'Role metadata updated' })
    } catch (error) {
      toast({ title: 'Error', description: 'Unable to update role', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const archiveSelectedRole = async () => {
    if (!selectedRole || selectedRole.isSystem || selectedRole.key === 'admin') return
    setSaving(true)
    try {
      const res = await fetch(`/api/roles/${selectedRole.key}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed to archive role')
      const filtered = roles.filter((r) => r.key !== selectedRole.key)
      setRoles(filtered)
      setSelectedRole(filtered[0] ?? null)
      toast({ title: 'Role archived', description: 'Role archived successfully' })
    } catch (error) {
      toast({ title: 'Error', description: 'Unable to archive role', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Role Management</h1>
          <p className="text-muted-foreground">Create custom roles and assign permissions</p>
        </div>
      </div>

      {loading ? (
        <Card>
          <CardContent className="py-10 flex items-center justify-center text-muted-foreground">
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Loading roles...
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <Card>
            <CardHeader>
              <CardTitle>Roles</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {roles.map((role) => (
                <button
                  key={role.key}
                  onClick={() => setSelectedRole(role)}
                  className={`w-full text-left p-3 rounded border ${
                    selectedRole?.key === role.key ? 'border-primary bg-primary/5' : 'border-border'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{role.name}</span>
                    {role.isSystem && <Badge variant="outline">System</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{role.key}</p>
                </button>
              ))}
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Create Custom Role
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="role-key">Role Key</Label>
                  <Input
                    id="role-key"
                    placeholder="project_manager"
                    value={newRole.key}
                    onChange={(e) => setNewRole((prev) => ({ ...prev, key: e.target.value.toLowerCase() }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role-name">Role Name</Label>
                  <Input
                    id="role-name"
                    placeholder="Project Manager"
                    value={newRole.name}
                    onChange={(e) => setNewRole((prev) => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="role-description">Description</Label>
                  <Textarea
                    id="role-description"
                    value={newRole.description}
                    onChange={(e) => setNewRole((prev) => ({ ...prev, description: e.target.value }))}
                  />
                </div>
                <div className="md:col-span-2 flex justify-end">
                  <Button onClick={createNewRole} disabled={saving || !newRole.key || !newRole.name}>
                    {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                    Create Role
                  </Button>
                </div>
              </CardContent>
            </Card>

            {selectedRole && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        Edit Role Metadata
                      </span>
                      {selectedRole.isSystem && <Badge variant="outline">System</Badge>}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Role Key</Label>
                      <Input value={selectedRole.key} disabled />
                    </div>
                    <div className="space-y-2">
                      <Label>Role Name</Label>
                      <Input
                        value={selectedRole.name}
                        onChange={(e) => setSelectedRole((prev) => (prev ? { ...prev, name: e.target.value } : prev))}
                        disabled={selectedRole.key === 'admin'}
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label>Description</Label>
                      <Textarea
                        value={selectedRole.description || ''}
                        onChange={(e) =>
                          setSelectedRole((prev) => (prev ? { ...prev, description: e.target.value } : prev))
                        }
                        disabled={selectedRole.key === 'admin'}
                      />
                    </div>
                    <div className="md:col-span-2 flex items-center justify-end gap-2">
                      {!selectedRole.isSystem && selectedRole.key !== 'admin' && (
                        <Button variant="destructive" onClick={archiveSelectedRole} disabled={saving}>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Archive Role
                        </Button>
                      )}
                      <Button onClick={updateRoleMeta} disabled={saving || selectedRole.key === 'admin'}>
                        <Save className="h-4 w-4 mr-2" />
                        Save Role
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Permissions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {Object.entries(permissions).map(([resource, items]) => (
                      <div key={resource} className="space-y-2">
                        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{resource}</h3>
                        <div className="grid gap-2 md:grid-cols-2">
                          {items.map((permission) => (
                            <label
                              key={permission.key}
                              className="flex items-center gap-3 rounded border p-3 cursor-pointer"
                            >
                              <Checkbox
                                checked={roleHasPermission(permission.key)}
                                disabled={saving || selectedRole.key === 'admin'}
                                onCheckedChange={(checked) => togglePermission(permission.key, Boolean(checked))}
                              />
                              <div>
                                <p className="text-sm font-medium">{permission.name}</p>
                                <p className="text-xs text-muted-foreground">{permission.key}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                    {allPermissions.length === 0 && (
                      <p className="text-sm text-muted-foreground">No permissions found.</p>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}