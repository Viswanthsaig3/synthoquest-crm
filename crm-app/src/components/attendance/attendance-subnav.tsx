'use client'

import { useAuth } from '@/context/auth-context'
import { hasPermission, canViewTeamAttendance, canViewAttendanceAdjustments } from '@/lib/client-permissions'
import { SectionSubNav } from '@/components/layout/section-subnav'
import { Calendar, Clock, Users, AlertCircle, ShieldAlert } from 'lucide-react'

export function AttendanceSubNav() {
  const { user } = useAuth()
  const canTeam = canViewTeamAttendance(user)
  const canWarnings = hasPermission(user, 'attendance.view_warnings')
  const canSecurity = canViewAttendanceAdjustments(user)

  const items = [
    { href: '/attendance', label: 'Today', icon: Clock },
    { href: '/attendance/history', label: 'History', icon: Calendar },
    ...(canTeam
      ? [{ href: '/attendance/team' as const, label: 'Team today', icon: Users }]
      : []),
    ...(canWarnings
      ? [{ href: '/attendance/warnings' as const, label: 'Geofence warnings', icon: AlertCircle }]
      : []),
    ...(canSecurity
      ? [{ href: '/attendance/security' as const, label: 'Security', icon: ShieldAlert }]
      : []),
    { href: '/timesheets', label: 'Timesheets', icon: Clock },
  ]

  return <SectionSubNav items={items} aria-label="Attendance navigation" />
}
