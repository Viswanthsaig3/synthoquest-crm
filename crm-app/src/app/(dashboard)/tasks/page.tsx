'use client'

import React, { useState, useMemo } from 'react'
import { useAuth } from '@/context/auth-context'
import { Breadcrumb } from '@/components/layout/breadcrumb'
import { PageHeader, StatusBadge, PriorityBadge, EmptyState, TableSkeleton } from '@/components/shared'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { mockTasks, getTasksByStatus } from '@/lib/mock-data'
import { mockUsers } from '@/lib/mock-data/users'
import { TASK_PRIORITIES, TASK_STATUSES } from '@/lib/constants'
import { formatDate, getInitials, cn } from '@/lib/utils'
import { canCreateTask, canViewAllTasks, getVisibleTasks } from '@/lib/permissions'
import { ClipboardList, Plus, Download, Eye, Edit, LayoutGrid, List, Calendar, CheckCircle, Paperclip } from 'lucide-react'
import Link from 'next/link'

export default function TasksPage() {
  const { user } = useAuth()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [view, setView] = useState<'kanban' | 'list'>('kanban')
  const [loading, setLoading] = useState(false)

  const visibleTasks = useMemo(() => {
    const tasks = getVisibleTasks(user!, mockTasks)
    return tasks.filter(task => {
      const matchesSearch = task.title.toLowerCase().includes(search.toLowerCase()) ||
        task.description.toLowerCase().includes(search.toLowerCase())
      const matchesStatus = !statusFilter || task.status === statusFilter
      const matchesPriority = !priorityFilter || task.priority === priorityFilter
      return matchesSearch && matchesStatus && matchesPriority
    })
  }, [search, statusFilter, priorityFilter, user])

  const todoTasks = visibleTasks.filter(t => t.status === 'todo')
  const inProgressTasks = visibleTasks.filter(t => t.status === 'in_progress')
  const doneTasks = visibleTasks.filter(t => t.status === 'done')

  const getAssignedUser = (userId: string) => mockUsers.find(u => u.id === userId)

  if (!user) return null

  const showCreateButton = canCreateTask(user)
  const pageTitle = canViewAllTasks(user) ? 'Tasks' : 'My Tasks'
  const pageDescription = canViewAllTasks(user) 
    ? `${visibleTasks.length} tasks found`
    : `${visibleTasks.length} tasks assigned to you`

  const TaskCard = ({ task }: { task: typeof mockTasks[0] }) => {
    const assignedUser = getAssignedUser(task.assignedTo)
    return (
      <div className="p-4 rounded-lg border bg-card hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between mb-2">
          <h4 className="font-medium text-sm">{task.title}</h4>
          <PriorityBadge priority={task.priority} />
        </div>
        <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{task.description}</p>
        
        {task.attachments.length > 0 && (
          <div className="flex items-center gap-1 mb-3 text-xs text-muted-foreground">
            <Paperclip className="h-3 w-3" />
            <span>{task.attachments.length} file{task.attachments.length > 1 ? 's' : ''}</span>
          </div>
        )}
        
        {task.completion && (
          <div className="flex items-center gap-1 mb-3 text-xs text-green-600">
            <CheckCircle className="h-3 w-3" />
            <span>Completed with remarks</span>
          </div>
        )}
        
        <div className="flex items-center justify-between">
          {assignedUser && (
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={assignedUser.avatar} />
                <AvatarFallback className="text-xs">{getInitials(assignedUser.name)}</AvatarFallback>
              </Avatar>
              <span className="text-xs">{assignedUser.name}</span>
            </div>
          )}
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            {formatDate(task.deadline)}
          </div>
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
  }

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

      {view === 'kanban' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                To Do
                <Badge variant="secondary">{todoTasks.length}</Badge>
              </h3>
            </div>
            <div className="space-y-3">
              {todoTasks.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No tasks</p>
              ) : (
                todoTasks.map(task => <TaskCard key={task.id} task={task} />)
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                In Progress
                <Badge variant="secondary">{inProgressTasks.length}</Badge>
              </h3>
            </div>
            <div className="space-y-3">
              {inProgressTasks.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No tasks</p>
              ) : (
                inProgressTasks.map(task => <TaskCard key={task.id} task={task} />)
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                Done
                <Badge variant="secondary">{doneTasks.length}</Badge>
              </h3>
            </div>
            <div className="space-y-3">
              {doneTasks.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No tasks</p>
              ) : (
                doneTasks.map(task => <TaskCard key={task.id} task={task} />)
              )}
            </div>
          </div>
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <TableSkeleton rows={10} />
            ) : visibleTasks.length === 0 ? (
              <EmptyState
                icon={ClipboardList}
                title="No tasks found"
                description={canViewAllTasks(user) ? "Create your first task to get started." : "No tasks have been assigned to you yet."}
              />
            ) : (
              <div className="divide-y">
                {visibleTasks.map(task => {
                  const assignedUser = getAssignedUser(task.assignedTo)
                  return (
                    <div key={task.id} className="p-4 flex items-center justify-between hover:bg-muted/50">
                      <div className="flex items-center gap-4">
                        <StatusBadge status={task.status} />
                        <div>
                          <p className="font-medium">{task.title}</p>
                          <p className="text-sm text-muted-foreground">{task.description}</p>
                          {task.completion && (
                            <p className="text-xs text-green-600 mt-1">
                              <CheckCircle className="h-3 w-3 inline mr-1" />
                              Completed: {task.completion.remarks.substring(0, 50)}...
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <PriorityBadge priority={task.priority} />
                        {task.attachments.length > 0 && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Paperclip className="h-3 w-3" />
                            {task.attachments.length}
                          </div>
                        )}
                        {assignedUser && (
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={assignedUser.avatar} />
                              <AvatarFallback className="text-xs">{getInitials(assignedUser.name)}</AvatarFallback>
                            </Avatar>
                          </div>
                        )}
                        <span className="text-sm text-muted-foreground">{formatDate(task.deadline)}</span>
                        <Link href={`/tasks/${task.id}`}>
                          <Button variant="ghost" size="icon">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}