'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { formatTime } from '@/lib/utils'
import { Activity, UserPlus, CheckCircle, XCircle, MessageSquare } from 'lucide-react'

interface Activity {
  id: string
  type: 'lead_created' | 'lead_converted' | 'task_completed' | 'comment' | 'leave_approved' | 'leave_rejected'
  message: string
  user: {
    name: string
    avatar?: string
  }
  timestamp: Date
}

const mockActivities: Activity[] = [
  {
    id: '1',
    type: 'lead_created',
    message: 'New lead "Rahul Sharma" added',
    user: { name: 'James Wilson', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=James' },
    timestamp: new Date(Date.now() - 1000 * 60 * 5),
  },
  {
    id: '2',
    type: 'lead_converted',
    message: 'Lead "Vikram Singh" converted',
    user: { name: 'Lisa Anderson', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lisa' },
    timestamp: new Date(Date.now() - 1000 * 60 * 15),
  },
  {
    id: '3',
    type: 'task_completed',
    message: 'Task "Contact converted leads" completed',
    user: { name: 'Amanda White', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Amanda' },
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
  },
  {
    id: '4',
    type: 'leave_approved',
    message: 'Leave request approved for David Brown',
    user: { name: 'Emily Davis', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emily' },
    timestamp: new Date(Date.now() - 1000 * 60 * 60),
  },
  {
    id: '5',
    type: 'comment',
    message: 'Added comment on "Prepare demo session"',
    user: { name: 'David Brown', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=David' },
    timestamp: new Date(Date.now() - 1000 * 60 * 90),
  },
]

const getActivityIcon = (type: Activity['type']) => {
  const icons = {
    lead_created: UserPlus,
    lead_converted: CheckCircle,
    task_completed: CheckCircle,
    comment: MessageSquare,
    leave_approved: CheckCircle,
    leave_rejected: XCircle,
  }
  return icons[type] || Activity
}

const getActivityColor = (type: Activity['type']) => {
  const colors = {
    lead_created: 'bg-blue-100 text-blue-600',
    lead_converted: 'bg-green-100 text-green-600',
    task_completed: 'bg-green-100 text-green-600',
    comment: 'bg-purple-100 text-purple-600',
    leave_approved: 'bg-green-100 text-green-600',
    leave_rejected: 'bg-red-100 text-red-600',
  }
  return colors[type] || 'bg-gray-100 text-gray-600'
}

function getRelativeTime(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) return `${days}d ago`
  if (hours > 0) return `${hours}h ago`
  if (minutes > 0) return `${minutes}m ago`
  return 'Just now'
}

export function RecentActivity() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {mockActivities.map((activity) => {
          const Icon = getActivityIcon(activity.type)
          return (
            <div key={activity.id} className="flex items-start gap-3">
              <div className={`p-2 rounded-full ${getActivityColor(activity.type)}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm">{activity.message}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Avatar className="h-5 w-5">
                    <AvatarImage src={activity.user.avatar} />
                    <AvatarFallback>{activity.user.name[0]}</AvatarFallback>
                  </Avatar>
                  <span className="text-xs text-muted-foreground">
                    {activity.user.name} • {getRelativeTime(activity.timestamp)}
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}