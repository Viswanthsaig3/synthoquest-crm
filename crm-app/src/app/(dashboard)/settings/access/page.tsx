'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/auth-context'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { hasAnyPermission, hasPermission } from '@/lib/client-permissions'
import Link from 'next/link'

export default function SettingsAccessPage() {
  const { user } = useAuth()
  const router = useRouter()

  const canManageRoles = hasPermission(user, 'roles.manage')
  const canAccessRoleArea = canManageRoles || hasAnyPermission(user, ['employees.view_all'])

  useEffect(() => {
    if (user && !canAccessRoleArea) {
      router.replace('/settings/profile')
    }
  }, [user, canAccessRoleArea, router])

  if (!user) return null
  if (!canAccessRoleArea) return null

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Roles & Permissions</CardTitle>
              <CardDescription>Manage user roles and their permissions</CardDescription>
            </div>
            <Link href="/settings/roles">
              <Button>Manage Roles</Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="p-4 rounded-lg border bg-muted/30">
            <p className="text-sm text-muted-foreground">
              Roles and permission sets are database-driven and managed from the dedicated Roles page.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
