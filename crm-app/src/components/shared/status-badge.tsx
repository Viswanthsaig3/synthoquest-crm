'use client'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface StatusBadgeProps {
  status: string
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const getStatusStyles = (status: string): string => {
    const statusMap: Record<string, string> = {
      new: 'bg-blue-100 text-blue-800 hover:bg-blue-100',
      contacted: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100',
      converted: 'bg-green-100 text-green-800 hover:bg-green-100',
      lost: 'bg-red-100 text-red-800 hover:bg-red-100',
      todo: 'bg-gray-100 text-gray-800 hover:bg-gray-100',
      in_progress: 'bg-blue-100 text-blue-800 hover:bg-blue-100',
      done: 'bg-green-100 text-green-800 hover:bg-green-100',
      pending: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100',
      approved: 'bg-green-100 text-green-800 hover:bg-green-100',
      rejected: 'bg-red-100 text-red-800 hover:bg-red-100',
      present: 'bg-green-100 text-green-800 hover:bg-green-100',
      absent: 'bg-red-100 text-red-800 hover:bg-red-100',
      late: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100',
      half_day: 'bg-orange-100 text-orange-800 hover:bg-orange-100',
      draft: 'bg-gray-100 text-gray-800 hover:bg-gray-100',
      submitted: 'bg-blue-100 text-blue-800 hover:bg-blue-100',
      processed: 'bg-purple-100 text-purple-800 hover:bg-purple-100',
      paid: 'bg-green-100 text-green-800 hover:bg-green-100',
      active: 'bg-green-100 text-green-800 hover:bg-green-100',
      inactive: 'bg-gray-100 text-gray-800 hover:bg-gray-100',
    }
    return statusMap[status.toLowerCase()] || 'bg-gray-100 text-gray-800 hover:bg-gray-100'
  }

  const formatStatus = (status: string): string => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  return (
    <Badge className={cn(getStatusStyles(status), className)}>
      {formatStatus(status)}
    </Badge>
  )
}