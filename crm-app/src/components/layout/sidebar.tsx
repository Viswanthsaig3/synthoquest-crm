'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useAuth } from '@/context/auth-context'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { getInitials } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  UserCircle,
  ClipboardList,
  Clock,
  Calendar,
  FileText,
  DollarSign,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronRight as ChevronRightIcon,
  Phone,
  Target,
  GraduationCap,
  BookOpen,
  CreditCard,
  Award,
  BarChart3,
  Briefcase,
  Plus,
  LucideIcon,
} from 'lucide-react'

interface NavItem {
  href: string
  label: string
  icon: LucideIcon
  roles: string[]
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
      { href: '/', label: 'Overview', icon: LayoutDashboard, roles: ['admin', 'hr', 'team_lead', 'sales_rep', 'employee'] },
    ],
  },
  {
    id: 'crm',
    label: 'CRM',
    icon: Users,
    items: [
      { href: '/leads/pool', label: 'Lead Pool', icon: Target, roles: ['sales_rep'] },
      { href: '/leads/mine', label: 'My Leads', icon: Phone, roles: ['sales_rep'] },
      { href: '/leads', label: 'Leads', icon: Users, roles: ['admin', 'hr', 'team_lead'] },
      { href: '/leads/new', label: 'New Lead', icon: Plus, roles: ['admin', 'hr', 'team_lead', 'sales_rep'] },
      { href: '/students', label: 'Students', icon: GraduationCap, roles: ['admin', 'hr', 'team_lead', 'sales_rep'] },
      { href: '/interns', label: 'Interns', icon: Briefcase, roles: ['admin', 'hr', 'team_lead'] },
    ],
  },
  {
    id: 'operations',
    label: 'Operations',
    icon: BookOpen,
    items: [
      { href: '/batches', label: 'Batches', icon: BookOpen, roles: ['admin', 'hr'] },
      { href: '/payments', label: 'Payments', icon: CreditCard, roles: ['admin', 'hr', 'team_lead'] },
      { href: '/certificates', label: 'Certificates', icon: Award, roles: ['admin', 'hr'] },
    ],
  },
  {
    id: 'hr-finance',
    label: 'HR & Finance',
    icon: UserCircle,
    items: [
      { href: '/employees', label: 'Employees', icon: UserCircle, roles: ['admin', 'hr'] },
      { href: '/tasks', label: 'Tasks', icon: ClipboardList, roles: ['admin', 'hr', 'team_lead', 'sales_rep', 'employee'] },
      { href: '/timesheets', label: 'Timesheets', icon: Clock, roles: ['admin', 'hr', 'team_lead', 'sales_rep', 'employee'] },
      { href: '/attendance', label: 'Attendance', icon: Calendar, roles: ['admin', 'hr', 'team_lead', 'sales_rep', 'employee'] },
      { href: '/leaves', label: 'Leaves', icon: FileText, roles: ['admin', 'hr', 'team_lead', 'sales_rep', 'employee'] },
      { href: '/payroll', label: 'Payroll', icon: DollarSign, roles: ['admin', 'hr', 'employee'] },
    ],
  },
  {
    id: 'insights',
    label: 'Insights',
    icon: BarChart3,
    items: [
      { href: '/reports', label: 'Reports', icon: BarChart3, roles: ['admin', 'hr', 'team_lead'] },
    ],
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    items: [
      { href: '/settings', label: 'Settings', icon: Settings, roles: ['admin', 'hr', 'team_lead', 'sales_rep', 'employee'] },
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

export function Sidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const [collapsed, setCollapsed] = React.useState(false)
  const [expandedGroups, setExpandedGroupsState] = React.useState<string[]>(getExpandedGroups)

  const toggleGroup = (groupId: string) => {
    const newExpanded = expandedGroups.includes(groupId)
      ? expandedGroups.filter(id => id !== groupId)
      : [...expandedGroups, groupId]
    setExpandedGroupsState(newExpanded)
    setExpandedGroups(newExpanded)
  }

  const getVisibleGroups = () => {
    if (!user) return []
    return navGroups.filter(group => 
      group.items.some(item => item.roles.includes(user.role))
    ).map(group => ({
      ...group,
      items: group.items.filter(item => item.roles.includes(user.role)),
    }))
  }

  const visibleGroups = getVisibleGroups()

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      admin: 'Admin',
      hr: 'HR Manager',
      team_lead: 'Team Lead',
      sales_rep: 'Sales Rep',
      employee: 'Employee',
    }
    return labels[role] || role
  }

  const getRoleBadgeVariant = (role: string): 'default' | 'secondary' | 'outline' => {
    const variants: Record<string, 'default' | 'secondary' | 'outline'> = {
      admin: 'default',
      hr: 'secondary',
      team_lead: 'outline',
      sales_rep: 'secondary',
      employee: 'outline',
    }
    return variants[role] || 'outline'
  }

  const isItemActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  return (
    <aside
      className={cn(
        "flex flex-col h-screen bg-card/60 backdrop-blur-xl border-r transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex items-center justify-between p-4 border-b">
        {!collapsed && (
          <h1 className="text-xl font-bold text-primary">SynthoQuest</h1>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-2 rounded-md hover:bg-accent"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-2">
        <ul className="space-y-1 px-2">
          {visibleGroups.map((group) => {
            const isExpanded = expandedGroups.includes(group.id)
            const hasActiveItem = group.items.some(item => isItemActive(item.href))
            
            if (group.items.length === 1) {
              const item = group.items[0]
              return (
                <li key={group.id}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
                      isItemActive(item.href)
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-accent hover:text-accent-foreground",
                      collapsed && "justify-center"
                    )}
                    title={collapsed ? item.label : undefined}
                  >
                    <item.icon className="h-5 w-5 shrink-0" />
                    {!collapsed && <span>{item.label}</span>}
                  </Link>
                </li>
              )
            }

            return (
              <li key={group.id} className="space-y-1">
                <button
                  onClick={() => toggleGroup(group.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
                    "hover:bg-accent hover:text-accent-foreground",
                    hasActiveItem && "text-primary font-medium",
                    collapsed && "justify-center"
                  )}
                  title={collapsed ? group.label : undefined}
                >
                  <group.icon className="h-5 w-5 shrink-0" />
                  {!collapsed && (
                    <>
                      <span className="flex-1 text-left text-sm font-medium">{group.label}</span>
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRightIcon className="h-4 w-4 text-muted-foreground" />
                      )}
                    </>
                  )}
                </button>
                
                {!collapsed && isExpanded && (
                  <ul className="ml-4 pl-2 border-l space-y-1">
                    {group.items.map((item) => (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          className={cn(
                            "flex items-center gap-3 px-3 py-1.5 rounded-md transition-colors text-sm",
                            isItemActive(item.href)
                              ? "bg-primary text-primary-foreground"
                              : "hover:bg-accent hover:text-accent-foreground text-muted-foreground"
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
          <div className={cn("flex items-center gap-3", collapsed && "justify-center")}>
            <Avatar className="h-10 w-10">
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
            </Avatar>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.name}</p>
                <Badge variant={getRoleBadgeVariant(user.role)} className="text-xs">
                  {getRoleLabel(user.role)}
                </Badge>
              </div>
            )}
          </div>
          {!collapsed && (
            <button
              onClick={logout}
              className="mt-3 flex items-center gap-2 w-full px-3 py-2 text-sm text-muted-foreground hover:text-foreground rounded-md hover:bg-accent transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span>Log out</span>
            </button>
          )}
        </div>
      )}
    </aside>
  )
}