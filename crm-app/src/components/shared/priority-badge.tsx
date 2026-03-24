'use client'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface PriorityBadgeProps {
  priority: 'low' | 'medium' | 'high'
  className?: string
}

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  const getPriorityStyles = (priority: string): string => {
    const priorityMap: Record<string, string> = {
      low: 'bg-gray-100 text-gray-800 hover:bg-gray-100',
      medium: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100',
      high: 'bg-red-100 text-red-800 hover:bg-red-100',
    }
    return priorityMap[priority] || 'bg-gray-100 text-gray-800 hover:bg-gray-100'
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