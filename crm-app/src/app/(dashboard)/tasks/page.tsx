'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/context/auth-context'
import { Breadcrumb } from '@/components/layout/breadcrumb'
import { PageHeader, StatusBadge, PriorityBadge, EmptyState } from '@/components/shared'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getTasks } from '@/lib/api/tasks'
import { TASK_PRIORITIES, TASK_STATUSES } from '@/lib/constants'
import { formatDate, getErrorMessage, getInitials } from '@/lib/utils'
import type { Task } from '@/lib/db/queries/tasks'
import { canCreateTask, canSeeOrgOrTeamTaskBoard, canViewAllTasks } from '@/lib/permissions'
import { ClipboardList, Plus, Eye, LayoutGrid, List, Calendar, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/components/ui/toast'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export default function TasksPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [view, setView] = useState<'kanban' | 'list'>('kanban')
  const [loading, setLoading] = useState(true)
  const [tasks, setTasks] = useState<Task[]>([])
  const [total, setTotal] = useState(0)

  const fetchTasks = useCallback(async () => {
    if (!user) return
    try {
      setLoading(true)
      const response = await getTasks({
        search: search || undefined,
        status: statusFilter || undefined,
        priority: priorityFilter || undefined,
        limit: 100
      })
      const raw = response.data || []
      const trustApiList = canSeeOrgOrTeamTaskBoard(user)
      const visible = trustApiList
        ? raw
        : raw.filter((t) => t.assignedTo === user.id)
      setTasks(visible)
      setTotal(
        trustApiList ? response.pagination?.total || visible.length : visible.length
      )
    } catch (error: unknown) {
      console.error('Error fetching tasks:', error)
      toast({
        title: 'Error',
        description: getErrorMessage(error, 'Failed to load tasks'),
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [user, search, statusFilter, priorityFilter, toast])

  useEffect(() => {
    if (user) {
      void fetchTasks()
    }
  }, [user, fetchTasks])

  if (!user) return null

  const showCreateButton = canCreateTask(user)
  const pageTitle = canViewAllTasks(user) ? 'Tasks' : 'My Tasks'
  const pageDescription = canViewAllTasks(user) 
    ? `${total} tasks found`
    : `${total} tasks assigned to you`

  const pendingTasks = tasks.filter(t => t.status === 'pending')
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress')
  const reviewTasks = tasks.filter(t => t.status === 'review')
  const completedTasks = tasks.filter(t => t.status === 'completed')

  const TaskCard = ({ task }: { task: Task }) => (
    <div className="p-4 rounded-lg border bg-card hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-medium text-sm">{task.title}</h4>
        <PriorityBadge priority={task.priority} />
      </div>
      <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{task.description}</p>
      
      <div className="flex items-center justify-between">
        {task.assignedToName && (
          <span className="text-xs">{task.assignedToName}</span>
        )}
        {task.dueDate && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            {formatDate(new Date(task.dueDate))}
          </div>
        )}
      </div>
      
      <div className="flex items-center gap-2 mt-3 pt-3 border-t">
        <Link href={`/tasks/${task.id}`} className="flex-1">
          <Button variant="outline" size="sm" className="w-full">
            <Eye className="h-3 w-3 mr-1" />
            View
          </Button>
        </Link>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <Breadcrumb />
      
      <PageHeader
        title={pageTitle}
        description={pageDescription}
        action={showCreateButton ? { label: 'Create Task', href: '/tasks/new' } : undefined}
        search={{ placeholder: 'Search tasks...', value: search, onChange: setSearch }}
        filters={[
          { options: TASK_STATUSES, value: statusFilter, onChange: setStatusFilter, placeholder: 'All Status' },
          { options: TASK_PRIORITIES, value: priorityFilter, onChange: setPriorityFilter, placeholder: 'All Priority' },
        ]}
      />

      <div className="flex items-center gap-2">
        <Button
          variant={view === 'kanban' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setView('kanban')}
        >
          <LayoutGrid className="h-4 w-4 mr-2" />
          Kanban
        </Button>
        <Button
          variant={view === 'list' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setView('list')}
        >
          <List className="h-4 w-4 mr-2" />
          List
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : view === 'kanban' ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm">Pending</h3>
              <Badge variant="outline">{pendingTasks.length}</Badge>
            </div>
            {pendingTasks.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-8 text-center text-muted-foreground text-sm">
                  No pending tasks
                </CardContent>
              </Card>
            ) : (
              pendingTasks.map(task => <TaskCard key={task.id} task={task} />)
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm">In Progress</h3>
              <Badge variant="outline">{inProgressTasks.length}</Badge>
            </div>
            {inProgressTasks.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-8 text-center text-muted-foreground text-sm">
                  No in-progress tasks
                </CardContent>
              </Card>
            ) : (
              inProgressTasks.map(task => <TaskCard key={task.id} task={task} />)
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm">Review</h3>
              <Badge variant="outline">{reviewTasks.length}</Badge>
            </div>
            {reviewTasks.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-8 text-center text-muted-foreground text-sm">
                  No tasks in review
                </CardContent>
              </Card>
            ) : (
              reviewTasks.map(task => <TaskCard key={task.id} task={task} />)
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm">Completed</h3>
              <Badge variant="outline">{completedTasks.length}</Badge>
            </div>
            {completedTasks.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-8 text-center text-muted-foreground text-sm">
                  No completed tasks
                </CardContent>
              </Card>
            ) : (
              completedTasks.map(task => <TaskCard key={task.id} task={task} />)
            )}
          </div>
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            {tasks.length === 0 ? (
              <EmptyState
                icon={ClipboardList}
                title="No tasks found"
                description="Create your first task to get started."
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tasks.map((task) => (
                    <TableRow key={task.id}>
                      <TableCell className="font-medium">{task.title}</TableCell>
                      <TableCell>
                        <StatusBadge status={task.status} />
                      </TableCell>
                      <TableCell>
                        <PriorityBadge priority={task.priority} />
                      </TableCell>
                      <TableCell>{task.assignedToName || 'Unassigned'}</TableCell>
                      <TableCell>
                        {task.dueDate ? formatDate(new Date(task.dueDate)) : 'No due date'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/tasks/${task.id}`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
