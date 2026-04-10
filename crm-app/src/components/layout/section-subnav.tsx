'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

export type SectionNavItem = {
  href: string
  label: string
  icon: LucideIcon
}

type SectionSubNavProps = {
  items: SectionNavItem[]
  className?: string
  'aria-label'?: string
}

/**
 * Horizontal sub-navigation for a feature area (attendance, leaves, timesheets, settings).
 * Marks the active item using longest-prefix match among provided hrefs.
 */
export function SectionSubNav({
  items,
  className,
  'aria-label': ariaLabel = 'Section navigation',
}: SectionSubNavProps) {
  const pathname = usePathname()

  const hrefs = items.map((i) => i.href)
  const isItemActive = (href: string) => {
    if (href === '/') return pathname === '/'
    const candidates = hrefs.filter(
      (h) => pathname === h || pathname.startsWith(h + '/')
    )
    if (candidates.length === 0) return false
    const longest = candidates.reduce((a, b) => (a.length >= b.length ? a : b))
    return href === longest
  }

  return (
    <nav
      className={cn('flex flex-wrap items-center gap-2', className)}
      role="navigation"
      aria-label={ariaLabel}
    >
      {items.map((item) => {
        const active = isItemActive(item.href)
        const Icon = item.icon
        return (
          <Link key={item.href} href={item.href}>
            <Button variant={active ? 'default' : 'outline'} size="sm" type="button">
              <Icon className="h-4 w-4 mr-2" />
              {item.label}
            </Button>
          </Link>
        )
      })}
    </nav>
  )
}
