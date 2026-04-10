'use client'

import { useAuth } from '@/context/auth-context'
import { hasAnyPermission, hasPermission } from '@/lib/client-permissions'
import { SectionSubNav } from '@/components/layout/section-subnav'
import { Building, Shield, Users } from 'lucide-react'

export function SettingsSubNav() {
  const { user } = useAuth()
  if (!user) return null

  const canManageSettings = hasPermission(user, 'settings.manage')
  const canManageRoles = hasPermission(user, 'roles.manage')
  const canAccessRoleArea = canManageRoles || hasAnyPermission(user, ['employees.view_all'])

  const items = [
    { href: '/settings/profile', label: 'Profile', icon: Users },
    ...(canManageSettings ? [{ href: '/settings/organization' as const, label: 'Organization', icon: Building }] : []),
    ...(canAccessRoleArea ? [{ href: '/settings/access' as const, label: 'Access', icon: Shield }] : []),
  ]

  return <SectionSubNav items={items} aria-label="Settings sections" />
}
