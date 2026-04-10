'use client'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { TaskPriority } from '@/lib/db/queries/tasks'

interface PriorityBadgeProps {
  priority: TaskPriority
  className?: string
}

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  const getPriorityStyles = (p: TaskPriority): string => {
    const priorityMap: Record<TaskPriority, string> = {
      low: 'bg-gray-100 text-gray-800 hover:bg-gray-100',
      medium: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100',
      high: 'bg-red-100 text-red-800 hover:bg-red-100',
      urgent: 'bg-red-200 text-red-950 hover:bg-red-200',
    }
    return priorityMap[p] || 'bg-gray-100 text-gray-800 hover:bg-gray-100'
  }

  const formatPriority = (priority: string): string => {
    return priority.charAt(0).toUpperCase() + priority.slice(1)
  }

  return (
    <Badge className={cn(getPriorityStyles(priority), className)}>
      {formatPriority(priority)}
    </Badge>
  )
}