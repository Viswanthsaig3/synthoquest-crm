'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRight, Home } from 'lucide-react'

const routeLabels: Record<string, string> = {
  '/': 'Dashboard',
  '/leads': 'Leads',
  '/employees': 'Employees',
  '/tasks': 'Tasks',
  '/timesheets': 'Timesheets',
  '/attendance': 'Attendance',
  '/leaves': 'Leaves',
  '/payroll': 'Payroll',
  '/settings': 'Settings',
}

export function Breadcrumb() {
  const pathname = usePathname()
  
  const pathSegments = pathname.split('/').filter(Boolean)
  
  const breadcrumbs: { label: string; href: string; icon?: React.ElementType }[] = [
    { label: 'Home', href: '/', icon: Home },
  ]

  let currentPath = ''
  pathSegments.forEach((segment, index) => {
    currentPath += `/${segment}`
    const label = routeLabels[currentPath] || segment.charAt(0).toUpperCase() + segment.slice(1)
    breadcrumbs.push({ label, href: currentPath })
  })

  return (
    <nav className="flex items-center text-sm text-muted-foreground mb-4">
      {breadcrumbs.map((crumb, index) => (
        <React.Fragment key={crumb.href}>
          {index > 0 && <ChevronRight className="h-4 w-4 mx-2" />}
          {index === breadcrumbs.length - 1 ? (
            <span className="text-foreground font-medium">{crumb.label}</span>
          ) : (
            <Link
              href={crumb.href}
              className="hover:text-foreground transition-colors flex items-center gap-1"
            >
              {index === 0 && crumb.icon && <crumb.icon className="h-4 w-4" />}
              {crumb.label}
            </Link>
          )}
        </React.Fragment>
      ))}
    </nav>
  )
}