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
} from 'lucide-react'

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'hr', 'team_lead', 'employee'] },
  { href: '/leads', label: 'Leads', icon: Users, roles: ['admin', 'hr', 'team_lead', 'employee'] },
  { href: '/employees', label: 'Employees', icon: UserCircle, roles: ['admin', 'hr'] },
  { href: '/tasks', label: 'Tasks', icon: ClipboardList, roles: ['admin', 'hr', 'team_lead', 'employee'] },
  { href: '/timesheets', label: 'Timesheets', icon: Clock, roles: ['admin', 'hr', 'team_lead', 'employee'] },
  { href: '/attendance', label: 'Attendance', icon: Calendar, roles: ['admin', 'hr', 'team_lead', 'employee'] },
  { href: '/leaves', label: 'Leaves', icon: FileText, roles: ['admin', 'hr', 'team_lead', 'employee'] },
  { href: '/payroll', label: 'Payroll', icon: DollarSign, roles: ['admin', 'hr', 'employee'] },
  { href: '/settings', label: 'Settings', icon: Settings, roles: ['admin', 'hr', 'team_lead', 'employee'] },
]

export function Sidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const [collapsed, setCollapsed] = React.useState(false)

  const filteredNavItems = navItems.filter(item => 
    user && item.roles.includes(user.role)
  )

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      admin: 'Admin',
      hr: 'HR Manager',
      team_lead: 'Team Lead',
      employee: 'Employee',
    }
    return labels[role] || role
  }

  const getRoleBadgeVariant = (role: string): 'default' | 'secondary' | 'outline' => {
    const variants: Record<string, 'default' | 'secondary' | 'outline'> = {
      admin: 'default',
      hr: 'secondary',
      team_lead: 'outline',
      employee: 'outline',
    }
    return variants[role] || 'outline'
  }

  return (
    <aside
      className={cn(
        "flex flex-col h-screen bg-card border-r transition-all duration-300",
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

      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-2">
          {filteredNavItems.map((item) => {
            const isActive = pathname === item.href || 
              (item.href !== '/' && pathname.startsWith(item.href))
            
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
                    isActive
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