'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LucideIcon, Plus, FileText, Users, CheckCircle, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

interface QuickAction {
  label: string
  href?: string
  onClick?: () => void
  icon: LucideIcon
  variant?: 'default' | 'secondary' | 'outline'
}

interface QuickActionsProps {
  actions?: QuickAction[]
  className?: string
}

const defaultActions: QuickAction[] = [
  { label: 'Add Lead', href: '/leads/new', icon: Plus },
  { label: 'Create Task', href: '/tasks/new', icon: CheckCircle },
  { label: 'Submit Timesheet', href: '/timesheets/new', icon: Clock },
  { label: 'Apply Leave', href: '/leaves/apply', icon: FileText },
]

export function QuickActions({ actions = defaultActions, className }: QuickActionsProps) {
  return (
    <Card className={cn("", className)}>
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-3">
          {actions.map((action, index) => {
            const Icon = action.icon
            const content = (
              <Button
                variant={action.variant || 'outline'}
                className="w-full justify-start gap-2 h-auto py-3"
                onClick={action.onClick}
                asChild={!!action.href}
              >
                {action.href ? (
                  <a href={action.href}>
                    <Icon className="h-4 w-4" />
                    <span className="text-sm">{action.label}</span>
                  </a>
                ) : (
                  <>
                    <Icon className="h-4 w-4" />
                    <span className="text-sm">{action.label}</span>
                  </>
                )}
              </Button>
            )
            return <div key={index}>{content}</div>
          })}
        </div>
      </CardContent>
    </Card>
  )
}