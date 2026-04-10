'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/context/auth-context'
import { Breadcrumb } from '@/components/layout/breadcrumb'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { StatusBadge, PriorityBadge } from '@/components/shared'
import { getTaskById, getTaskComments, createTaskComment, getTaskHistory, startTask, completeTask, cancelTask } from '@/lib/api/tasks'
import { formatDate, getErrorMessage } from '@/lib/utils'
import type { Task, TaskComment, TaskHistory } from '@/lib/db/queries/tasks'
import { hasPermission } from '@/lib/client-permissions'
import { useToast } from '@/components/ui/toast'
import { 
  ArrowLeft, 
  Calendar,
  User,
  MessageSquare,
  Clock,
  Send,
  CheckCircle,
  XCircle,
  Play,
  Loader2,
  Edit
} from 'lucide-react'
import Link from 'next/link'

export default function TaskDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()
  const taskId = params.id as string
  
  const [task, setTask] = useState<Task | null>(null)
  const [comments, setComments] = useState<TaskComment[]>([])
  const [history, setHistory] = useState<TaskHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [newComment, setNewComment] = useState('')

  useEffect(() => {
    if (taskId) {
      fetchTask()
    }
  }, [taskId])

  const fetchTask = async () => {
    try {
      const [taskRes, commentsRes, historyRes] = await Promise.all([
        getTaskById(taskId),
        getTaskComments(taskId),
        getTaskHistory(taskId)
      ])
      
      setTask(taskRes.data)
      setComments(commentsRes.data || [])
      setHistory(historyRes.data || [])
    } catch (error: unknown) {
      console.error('Error fetching task:', error)
      toast({
        title: 'Error',
        description: getErrorMessage(error, 'Failed to load task'),
        variant: 'destructive',
      })
      router.push('/tasks')
    } finally {
      setLoading(false)
    }
  }

  if (!user || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!task) {
    return (
      <div className="space-y-6">
        <Breadcrumb />
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Task not found</p>
            <Link href="/tasks">
              <Button className="mt-4">Back to Tasks</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const canComplete = task.assignedTo === user.id || hasPermission(user, 'tasks.edit')
  const canEdit = hasPermission(user, 'tasks.edit')
  const canCancel = hasPermission(user, 'tasks.edit') || hasPermission(user, 'tasks.assign')

  const handleAddComment = async () => {
    if (!newComment.trim()) return

    setActionLoading(true)
    try {
      await createTaskComment(taskId, { comment: newComment })
      toast({
        title: 'Comment added',
        description: 'Your comment has been added to the task.',
      })
      setNewComment('')
      fetchTask()
    } catch (error: unknown) {
      toast({
        title: 'Error',
        description: getErrorMessage(error, 'Failed to add comment'),
        variant: 'destructive',
      })
    } finally {
      setActionLoading(false)
    }
  }

  const handleStart = async () => {
    setActionLoading(true)
    try {
      await startTask(taskId)
      toast({
        title: 'Task started',
        description: 'The task is now in progress.',
      })
      fetchTask()
    } catch (error: unknown) {
      toast({
        title: 'Error',
        description: getErrorMessage(error, 'Failed to start task'),
        variant: 'destructive',
      })
    } finally {
      setActionLoading(false)
    }
  }

  const handleComplete = async () => {
    setActionLoading(true)
    try {
      await completeTask(taskId)
      toast({
        title: 'Task completed',
        description: 'The task has been marked as completed.',
      })
      fetchTask()
    } catch (error: unknown) {
      toast({
        title: 'Error',
        description: getErrorMessage(error, 'Failed to complete task'),
        variant: 'destructive',
      })
    } finally {
      setActionLoading(false)
    }
  }

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this task?')) return

    setActionLoading(true)
    try {
      await cancelTask(taskId)
      toast({
        title: 'Task cancelled',
        description: 'The task has been cancelled.',
      })
      fetchTask()
    } catch (error: unknown) {
      toast({
        title: 'Error',
        description: getErrorMessage(error, 'Failed to cancel task'),
        variant: 'destructive',
      })
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Breadcrumb />
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/tasks">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{task.title}</h1>
            <p className="text-muted-foreground">
              {task.type} • {task.priority} priority
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={task.status} />
          {canEdit && (
            <Link href={`/tasks/${taskId}/edit`}>
              <Button variant="outline" size="sm">
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </Button>
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Assigned To</p>
                <p className="font-medium">{task.assignedToName || 'Unassigned'}</p>
              </div>
              <User className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Due Date</p>
                <p className="font-medium">
                  {task.dueDate ? formatDate(new Date(task.dueDate)) : 'No due date'}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Time Logged</p>
                <p className="font-medium">{task.actualHours || 0}h / {task.estimatedHours || 0}h</p>
              </div>
              <Clock className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Description</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{task.description || 'No description provided'}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Comments ({comments.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {comments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No comments yet</p>
          ) : (
            <div className="space-y-3">
              {comments.map((comment) => (
                <div key={comment.id} className="p-3 bg-muted rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{comment.userName || 'Unknown'}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(new Date(comment.createdAt))}
                    </span>
                  </div>
                  <p className="text-sm">{comment.comment}</p>
                </div>
              ))}
            </div>
          )}

          <div className="pt-4 border-t">
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              rows={3}
            />
            <Button 
              onClick={handleAddComment} 
              disabled={!newComment.trim() || actionLoading}
              className="mt-2"
            >
              <Send className="h-4 w-4 mr-2" />
              Add Comment
            </Button>
          </div>
        </CardContent>
      </Card>

      {history.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {history.map((item) => (
                <div key={item.id} className="flex items-start gap-3 text-sm">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                  <div>
                    <span className="font-medium">{item.userName || 'System'}</span>
                    <span className="text-muted-foreground"> {item.action.replace('_', ' ')}</span>
                    <span className="text-muted-foreground text-xs ml-2">
                      {formatDate(new Date(item.createdAt))}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end gap-4">
        <Link href="/tasks">
          <Button variant="outline">Back to List</Button>
        </Link>
        
        {task.status === 'pending' && canComplete && (
          <Button onClick={handleStart} disabled={actionLoading}>
            <Play className="h-4 w-4 mr-2" />
            Start Task
          </Button>
        )}
        
        {(task.status === 'in_progress' || task.status === 'review') && canComplete && (
          <Button onClick={handleComplete} disabled={actionLoading}>
            <CheckCircle className="h-4 w-4 mr-2" />
            Complete
          </Button>
        )}
        
        {canCancel && task.status !== 'completed' && task.status !== 'cancelled' && (
          <Button variant="destructive" onClick={handleCancel} disabled={actionLoading}>
            <XCircle className="h-4 w-4 mr-2" />
            Cancel
          </Button>
        )}
      </div>
    </div>
  )
}
