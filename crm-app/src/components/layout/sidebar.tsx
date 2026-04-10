'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn, getInitials } from '@/lib/utils'
import { useAuth } from '@/context/auth-context'
import { hasPermission, isWorkOnlyUser } from '@/lib/client-permissions'
import { isSidebarNavImplemented } from '@/lib/nav-visibility'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  LayoutDashboard,
  Users,
  Target,
  Phone,
  Plus,
  GraduationCap,
  Briefcase,
  BookOpen,
  CreditCard,
  Award,
  UserCircle,
  ClipboardList,
  Clock,
  Calendar,
  AlertCircle,
  FileText,
  DollarSign,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  LogOut,
  Network,
  Bug,
  type LucideIcon,
} from 'lucide-react'

interface NavItem {
  href: string
  label: string
  icon: LucideIcon
  permissionsAny?: string[]
}

interface NavGroup {
  id: string
  label: string
  icon: LucideIcon
  items: NavItem[]
}

const navGroups: NavGroup[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    items: [
      { href: '/', label: 'Overview', icon: LayoutDashboard },
    ],
  },
  {
    id: 'crm',
    label: 'CRM',
    icon: Users,
    items: [
      { href: '/leads/pool', label: 'Lead Pool', icon: Target, permissionsAny: ['leads.claim'] },
      { href: '/leads/mine', label: 'My Leads', icon: Phone, permissionsAny: ['leads.view_assigned', 'leads.claim'] },
      { href: '/leads', label: 'Leads', icon: Users, permissionsAny: ['leads.view_all'] },
      { href: '/leads/new', label: 'New Lead', icon: Plus, permissionsAny: ['leads.create'] },
      { href: '/students', label: 'Students', icon: GraduationCap, permissionsAny: ['students.view_all', 'students.view_assigned'] },
      { href: '/interns', label: 'Interns', icon: Briefcase, permissionsAny: ['interns.view_all', 'interns.view_assigned', 'interns.manage_all', 'interns.manage_assigned'] },
    ],
  },
  {
    id: 'operations',
    label: 'Operations',
    icon: BookOpen,
    items: [
      { href: '/batches', label: 'Batches', icon: BookOpen, permissionsAny: ['batches.view'] },
      { href: '/payments', label: 'Payments', icon: CreditCard, permissionsAny: ['payments.view_all', 'payments.view_assigned'] },
      { href: '/certificates', label: 'Certificates', icon: Award, permissionsAny: ['certificates.view_all'] },
    ],
  },
  {
    id: 'hr-finance',
    label: 'HR & Finance',
    icon: UserCircle,
    items: [
      { href: '/employees', label: 'Employees', icon: UserCircle, permissionsAny: ['employees.view_all', 'employees.manage_assigned'] },
      { href: '/employees/hierarchy', label: 'Hierarchy', icon: Network, permissionsAny: ['employees.view_all', 'employees.manage'] },
      { href: '/tasks', label: 'Tasks', icon: ClipboardList, permissionsAny: ['tasks.view_all', 'tasks.complete', 'tasks.assign', 'tasks.create'] },
      { href: '/timesheets', label: 'Timesheets', icon: Clock, permissionsAny: ['timesheets.view_all', 'timesheets.submit', 'timesheets.approve'] },
      { href: '/attendance', label: 'Attendance', icon: Calendar, permissionsAny: ['attendance.view_team', 'attendance.checkin', 'attendance.checkout'] },
      { href: '/attendance/warnings', label: 'Attendance Warnings', icon: AlertCircle, permissionsAny: ['attendance.view_warnings'] },
      { href: '/leaves', label: 'Leaves', icon: FileText, permissionsAny: ['leaves.apply', 'leaves.approve'] },
      { href: '/leaves/balances', label: 'Leave Balances', icon: FileText, permissionsAny: ['leaves.manage_balances'] },
      { href: '/payroll', label: 'Payroll', icon: DollarSign, permissionsAny: ['payroll.view_all', 'payroll.view_own'] },
      { href: '/payroll/hours', label: 'Hours Tracker', icon: Clock, permissionsAny: ['payroll.view_all'] },
    ],
  },
  {
    id: 'insights',
    label: 'Insights',
    icon: BarChart3,
    items: [
      { href: '/reports', label: 'Reports', icon: BarChart3, permissionsAny: ['reports.view'] },
      { href: '/bugs', label: 'Bug Reports', icon: Bug, permissionsAny: ['bugs.view_all'] },
    ],
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    items: [
      { href: '/settings/profile', label: 'Settings', icon: Settings },
    ],
  },
]

function getExpandedGroups(): string[] {
  if (typeof window === 'undefined') return ['dashboard', 'crm']
  const stored = localStorage.getItem('sidebar-expanded-groups')
  return stored ? JSON.parse(stored) : ['dashboard', 'crm']
}

function setExpandedGroups(groups: string[]) {
  localStorage.setItem('sidebar-expanded-groups', JSON.stringify(groups))
}

type SidebarNavPanelProps = {
  /** Close mobile drawer after navigation */
  onNavigate?: () => void
  /** Drawer: full labels, all groups expanded, no collapse control */
  variant?: 'desktop' | 'drawer'
}

export function SidebarNavPanel({ onNavigate, variant = 'desktop' }: SidebarNavPanelProps) {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const [collapsed, setCollapsed] = React.useState(false)
  const [expandedGroupsDesktop, setExpandedGroupsState] = React.useState<string[]>(getExpandedGroups)

  const isDrawer = variant === 'drawer'

  const toggleGroup = (groupId: string) => {
    if (isDrawer) return
    const newExpanded = expandedGroupsDesktop.includes(groupId)
      ? expandedGroupsDesktop.filter((id) => id !== groupId)
      : [...expandedGroupsDesktop, groupId]
    setExpandedGroupsState(newExpanded)
    setExpandedGroups(newExpanded)
  }

  const getVisibleGroups = () => {
    if (!user) return []
    if (isWorkOnlyUser(user)) {
      const items: NavItem[] = []
      
      if (hasPermission(user, 'tasks.complete') || hasPermission(user, 'tasks.view_all')) {
        items.push({ href: '/tasks', label: 'Tasks', icon: ClipboardList })
      }
      if (hasPermission(user, 'timesheets.submit') || hasPermission(user, 'timesheets.view_all')) {
        items.push({ href: '/timesheets', label: 'Timesheets', icon: Clock })
      }
      if (hasPermission(user, 'attendance.checkin') || hasPermission(user, 'attendance.checkout') || hasPermission(user, 'attendance.view_team')) {
        items.push({ href: '/attendance', label: 'Attendance', icon: Calendar })
      }
      if (hasPermission(user, 'leaves.apply') || hasPermission(user, 'leaves.approve')) {
        items.push({ href: '/leaves', label: 'Leaves', icon: FileText })
      }
      
      const workItems = items.filter((item) => isSidebarNavImplemented(item.href))
      return [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, items: [{ href: '/', label: 'Overview', icon: LayoutDashboard }] },
        { id: 'work', label: 'Work', icon: ClipboardList, items: workItems },
      ]
    }

    return navGroups
      .map((group) => ({
        ...group,
        items: group.items.filter((item) => {
          if (!isSidebarNavImplemented(item.href)) return false
          if (!item.permissionsAny || item.permissionsAny.length === 0) return true
          return item.permissionsAny.some((permission) => hasPermission(user, permission))
        }),
      }))
      .filter((group) => group.items.length > 0)
  }

  const visibleGroups = getVisibleGroups()

  const expandedGroups = isDrawer
    ? visibleGroups.map((g) => g.id)
    : expandedGroupsDesktop

  /** All sidebar hrefs for this user — used so only the most specific link is "active" (e.g. /attendance/warnings vs /attendance). */
  const allNavHrefs = React.useMemo(
    () => visibleGroups.flatMap((g) => g.items.map((i) => i.href)),
    [visibleGroups]
  )

  const getRoleLabel = (role: string) => role.replace(/_/g, ' ')

  const getRoleBadgeVariant = (role: string): 'default' | 'secondary' | 'outline' =>
    role === 'admin' ? 'default' : 'outline'

  const isItemActive = React.useCallback(
    (href: string) => {
      if (href === '/') return pathname === '/'
      const candidates = allNavHrefs.filter(
        (h) => pathname === h || pathname.startsWith(h + '/')
      )
      if (candidates.length === 0) return false
      const longest = candidates.reduce((a, b) => (a.length >= b.length ? a : b))
      return href === longest
    },
    [pathname, allNavHrefs]
  )

  const showLabels = isDrawer || !collapsed
  const linkAfterNav = () => onNavigate?.()

  const navBody = (
    <>
      <nav className="flex-1 overflow-y-auto py-2">
        <ul className="space-y-1 px-2">
          {visibleGroups.map((group) => {
            const isExpanded = expandedGroups.includes(group.id)
            const hasActiveItem = group.items.some((item) => isItemActive(item.href))

            if (group.items.length === 1) {
              const item = group.items[0]
              return (
                <li key={group.id}>
                  <Link
                    href={item.href}
                    onClick={linkAfterNav}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-md transition-colors',
                      isItemActive(item.href)
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-accent hover:text-accent-foreground',
                      !showLabels && 'justify-center'
                    )}
                    title={!showLabels ? item.label : undefined}
                  >
                    <item.icon className="h-5 w-5 shrink-0" />
                    {showLabels && <span>{item.label}</span>}
                  </Link>
                </li>
              )
            }

            return (
              <li key={group.id} className="space-y-1">
                <button
                  type="button"
                  onClick={() => toggleGroup(group.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors',
                    'hover:bg-accent hover:text-accent-foreground',
                    hasActiveItem && 'text-primary font-medium',
                    !showLabels && 'justify-center'
                  )}
                  title={!showLabels ? group.label : undefined}
                >
                  <group.icon className="h-5 w-5 shrink-0" />
                  {showLabels && (
                    <>
                      <span className="flex-1 text-left text-sm font-medium">{group.label}</span>
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                    </>
                  )}
                </button>

                {showLabels && isExpanded && (
                  <ul className="ml-4 pl-2 border-l space-y-1">
                    {group.items.map((item) => (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          onClick={linkAfterNav}
                          className={cn(
                            'flex items-center gap-3 px-3 py-1.5 rounded-md transition-colors text-sm',
                            isItemActive(item.href)
                              ? 'bg-primary text-primary-foreground'
                              : 'hover:bg-accent hover:text-accent-foreground text-muted-foreground'
                          )}
                        >
                          <item.icon className="h-4 w-4 shrink-0" />
                          <span>{item.label}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            )
          })}
        </ul>
      </nav>

      {user && (
        <div className="border-t p-4">
          <div className={cn('flex items-center gap-3', !showLabels && 'justify-center')}>
            <Avatar className="h-10 w-10">
              <AvatarImage src={user.avatar || undefined} alt={user.name} />
              <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
            </Avatar>
            {showLabels && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.name}</p>
                <Badge variant={getRoleBadgeVariant(user.role)} className="text-xs">
                  {getRoleLabel(user.role)}
                </Badge>
              </div>
            )}
          </div>
          {showLabels && (
            <button
              type="button"
              onClick={() => {
                onNavigate?.()
                logout()
              }}
              className="mt-3 flex items-center gap-2 w-full px-3 py-2 text-sm text-muted-foreground hover:text-foreground rounded-md hover:bg-accent transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span>Log out</span>
            </button>
          )}
        </div>
      )}
    </>
  )

  if (isDrawer) {
    return (
      <div className="flex h-full min-h-0 flex-col bg-card">{navBody}</div>
    )
  }

  return (
    <aside
      className={cn(
        'hidden md:flex flex-col h-screen bg-card/60 backdrop-blur-xl border-r transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      <div className="flex items-center justify-between p-4 border-b">
        {!collapsed && <h1 className="text-xl font-bold text-primary">SynthoQuest</h1>}
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="p-2 rounded-md hover:bg-accent"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>
      {navBody}
    </aside>
  )
}

export function Sidebar() {
  return <SidebarNavPanel variant="desktop" />
}
