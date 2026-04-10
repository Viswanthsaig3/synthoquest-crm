'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRight, Home } from 'lucide-react'

const routeLabels: Record<string, string> = {
  '/': 'Dashboard',
  '/leads': 'Leads',
  '/leads/new': 'New lead',
  '/leads/pool': 'Lead pool',
  '/leads/mine': 'My leads',
  '/employees': 'Employees',
  '/employees/new': 'New employee',
  '/tasks': 'Tasks',
  '/tasks/new': 'New task',
  '/timesheets': 'Timesheets',
  '/timesheets/new': 'New timesheet',
  '/timesheets/approvals': 'Approvals',
  '/attendance': 'Attendance',
  '/attendance/history': 'History',
  '/attendance/team': 'Team today',
  '/attendance/warnings': 'Geofence warnings',
  '/attendance/approvals': 'Approvals',
  '/leaves': 'Leaves',
  '/leaves/apply': 'Apply',
  '/leaves/approvals': 'Approvals',
  '/leaves/calendar': 'Calendar',
  '/payroll': 'Payroll',
  '/payroll/run': 'Run payroll',
  '/payroll/hours': 'Hours Tracker',
  '/settings': 'Settings',
  '/settings/departments': 'Departments',
  '/settings/roles': 'Roles',
  '/settings/lead-types': 'Lead types',
  '/settings/lead-types/new': 'New lead type',
  '/settings/profile': 'Profile',
  '/settings/organization': 'Organization',
  '/settings/access': 'Access',
  '/students': 'Students',
  '/students/new': 'New student',
  '/interns': 'Interns',
  '/batches': 'Batches',
  '/payments': 'Payments',
  '/certificates': 'Certificates',
  '/reports': 'Reports',
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function slugLabel(segment: string): string {
  const slugMap: Record<string, string> = {
    new: 'New',
    edit: 'Edit',
    pool: 'Pool',
    mine: 'Mine',
    approvals: 'Approvals',
    calendar: 'Calendar',
    apply: 'Apply',
    history: 'History',
    team: 'Team',
    warnings: 'Warnings',
    run: 'Run',
    hours: 'Hours Tracker',
    departments: 'Departments',
    roles: 'Roles',
    'lead-types': 'Lead types',
    certificates: 'Certificates',
    payments: 'Payments',
    reports: 'Reports',
    students: 'Students',
    interns: 'Interns',
    batches: 'Batches',
    employees: 'Employees',
    leads: 'Leads',
    tasks: 'Tasks',
    timesheets: 'Timesheets',
    attendance: 'Attendance',
    leaves: 'Leaves',
    payroll: 'Payroll',
    settings: 'Settings',
    profile: 'Profile',
    organization: 'Organization',
    access: 'Access',
  }
  if (slugMap[segment]) return slugMap[segment]
  if (UUID_RE.test(segment)) return 'Details'
  return segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ')
}

export function Breadcrumb() {
  const pathname = usePathname()

  const pathSegments = pathname.split('/').filter(Boolean)

  const breadcrumbs: { label: string; href: string; icon?: React.ElementType }[] = [
    { label: 'Home', href: '/', icon: Home },
  ]

  let currentPath = ''
  pathSegments.forEach((segment) => {
    currentPath += `/${segment}`
    const label =
      routeLabels[currentPath] ?? slugLabel(segment)
    breadcrumbs.push({ label, href: currentPath })
  })

  return (
    <nav
      className="flex flex-wrap items-center gap-y-1 text-sm text-muted-foreground mb-4"
      aria-label="Breadcrumb"
    >
      {breadcrumbs.map((crumb, index) => (
        <React.Fragment key={`${crumb.href}-${index}`}>
          {index > 0 && <ChevronRight className="h-4 w-4 mx-2 shrink-0" />}
          {index === breadcrumbs.length - 1 ? (
            <span className="text-foreground font-medium">{crumb.label}</span>
          ) : (
            <Link
              href={crumb.href}
              className="hover:text-foreground transition-colors flex items-center gap-1 min-w-0"
            >
              {index === 0 && crumb.icon && <crumb.icon className="h-4 w-4 shrink-0" />}
              <span className="truncate">{crumb.label}</span>
            </Link>
          )}
        </React.Fragment>
      ))}
    </nav>
  )
}
