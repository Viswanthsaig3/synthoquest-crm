'use client'

import { useAuth } from '@/context/auth-context'
import { hasPermission } from '@/lib/client-permissions'
import { SectionSubNav } from '@/components/layout/section-subnav'
import { Calendar, CheckCircle, FileText, Plus, Settings } from 'lucide-react'

export function LeavesSubNav() {
  const { user } = useAuth()
  if (!user) return null

  const canApprove = hasPermission(user, 'leaves.approve')
  const canApply = hasPermission(user, 'leaves.apply')
  const canManageBalances = hasPermission(user, 'leaves.manage_balances')

  const items = [
    { href: '/leaves', label: 'Overview', icon: FileText },
    ...(canApply ? [{ href: '/leaves/apply' as const, label: 'Apply', icon: Plus }] : []),
    { href: '/leaves/calendar', label: 'Calendar', icon: Calendar },
    ...(canApprove
      ? [{ href: '/leaves/approvals' as const, label: 'Approvals', icon: CheckCircle }]
      : []),
    ...(canManageBalances
      ? [{ href: '/leaves/balances' as const, label: 'Balances', icon: Settings }]
      : []),
  ]

  return <SectionSubNav items={items} aria-label="Leaves navigation" />
}
