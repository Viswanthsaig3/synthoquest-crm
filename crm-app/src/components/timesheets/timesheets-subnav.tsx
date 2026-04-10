'use client'

import { useAuth } from '@/context/auth-context'
import { hasPermission } from '@/lib/client-permissions'
import { SectionSubNav } from '@/components/layout/section-subnav'
import { Clock, Plus, Users } from 'lucide-react'

export function TimesheetsSubNav() {
  const { user } = useAuth()
  if (!user) return null

  const canApprove =
    hasPermission(user, 'timesheets.approve') || hasPermission(user, 'timesheets.view_all')

  const items = [
    { href: '/timesheets', label: 'Timesheets', icon: Clock },
    ...(canApprove
      ? [{ href: '/timesheets/approvals' as const, label: 'Approvals', icon: Users }]
      : []),
    { href: '/timesheets/new', label: 'Log time', icon: Plus },
  ]

  return <SectionSubNav items={items} aria-label="Timesheets navigation" />
}
