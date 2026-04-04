'use client'

import React, { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/context/auth-context'
import { Breadcrumb } from '@/components/layout/breadcrumb'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { StatusBadge, PriorityBadge, FileUpload } from '@/components/shared'
import { mockTasks, getTaskById } from '@/lib/mock-data'
import { mockUsers } from '@/lib/mock-data/users'
import { TASK_STATUSES } from '@/lib/constants'
import { formatDate, getInitials, formatFileSize } from '@/lib/utils'
import { canCompleteTask, canEditTask, canDeleteTask, canAssignTask } from '@/lib/permissions'
import { useToast } from '@/components/ui/toast'
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Calendar,
  User,
  MessageSquare,
  Clock,
  Send,
  CheckCircle,
  Paperclip,
  Download,
  X
} from 'lucide-react'
import Link from 'next/link'

export default function TaskDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()
  const taskId = params.id as string
  const task = getTaskById(taskId)
  const [newComment, setNewComment] = useState('')
  const [showCompleteModal, setShowCompleteModal] = useState(false)
  const [completionRemarks, setCompletionRemarks] = useState('')
  const [completionFiles, setCompletionFiles] = useState<File[]>([])

  if (!user || !task) {
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

  const assignedUser = mockUsers.find(u => u.id === task.assignedTo)
  const createdBy = mockUsers.find(u => u.id === task.createdBy)

  const canComplete = canCompleteTask(user, task)
  const canEdit = canEditTask(user)
  const canDelete = canDeleteTask(user)

  const handleAddComment = () => {
    if (newComment.trim()) {
      toast({
        title: 'Comment added',
        description: 'Your comment has been added to the task.',
      })
      setNewComment('')
    }
  }

  const handleCompleteTask = () => {
    if (!completionRemarks.trim()) {
      toast({
        title: 'Remarks required',
        description: 'Please provide completion remarks.',
        variant: 'destructive',
      })
      return
    }
    
    toast({
      title: 'Task completed',
      description: 'The task has been marked as completed.',
    })
    setShowCompleteModal(false)
    setCompletionRemarks('')
    setCompletionFiles([])
  }

  const getUserById = (id: string) => mockUsers.find(u => u.id === id)

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
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{task.title}</h1>
              <StatusBadge status={task.status} />
              <PriorityBadge priority={task.priority} />
            </div>
            <p className="text-muted-foreground flex items-center gap-4 mt-1">
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Due: {formatDate(task.deadline)}
              </span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {canComplete && task.status !== 'done' && (
            <Button onClick={() => setShowCompleteModal(true)}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Mark Complete
            </Button>
          )}
          {canEdit && (
            <Link href={`/tasks/${task.id}?edit=true`}>
              <Button variant="outline">
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </Link>
          )}
          {canDelete && (
            <Button variant="destructive">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          )}
        </div>
      </div>

      {task.completion && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium text-green-800">Task Completed</p>
                <p className="text-sm text-green-700 mt-1">{task.completion.remarks}</p>
                <p className="text-xs text-green-600 mt-2">
                  Completed on {formatDate(task.completion.completedAt)} by {getUserById(task.completion.completedBy)?.name}
                </p>
                {task.completion.attachments.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {task.completion.attachments.map(att => (
                      <div key={att.id} className="flex items-center gap-2 px-3 py-1 bg-white rounded border text-sm">
                        <Paperclip className="h-3 w-3" />
                        <span>{att.fileName}</span>
                        <span className="text-muted-foreground">({formatFileSize(att.fileSize)})</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{task.description || 'No description provided'}</p>
            </CardContent>
          </Card>

          {task.attachments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Paperclip className="h-5 w-5" />
                  Attachments ({task.attachments.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {task.attachments.map(attachment => {
                    const uploader = getUserById(attachment.uploadedBy)
                    return (
                      <div key={attachment.id} className="flex items-center justify-between p-3 rounded-lg bg-muted">
                        <div className="flex items-center gap-3">
                          <Paperclip className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">{attachment.fileName}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatFileSize(attachment.fileSize)} • Uploaded by {uploader?.name} on {formatDate(attachment.uploadedAt)}
                            </p>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Comments ({task.comments.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {task.comments.length === 0 ? (
                <p className="text-muted-foreground text-sm">No comments yet</p>
              ) : (
                task.comments.map(comment => {
                  const commentUser = mockUsers.find(u => u.id === comment.userId)
                  return (
                    <div key={comment.id} className="flex gap-3 p-3 rounded-lg bg-muted/50">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={commentUser?.avatar || undefined} />
                        <AvatarFallback>{commentUser ? getInitials(commentUser.name) : '?'}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{commentUser?.name}</span>
                          <span className="text-xs text-muted-foreground">{formatDate(comment.createdAt)}</span>
                        </div>
                        <p className="text-sm mt-1">{comment.content}</p>
                      </div>
                    </div>
                  )
                })
              )}
              <div className="flex gap-2 pt-4 border-t">
                <Textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  rows={2}
                />
                <Button onClick={handleAddComment} className="self-end">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm text-muted-foreground">Status</Label>
                <div className="mt-1">
                  <StatusBadge status={task.status} />
                </div>
              </div>

              <div>
                <Label className="text-sm text-muted-foreground">Priority</Label>
                <div className="mt-1">
                  <PriorityBadge priority={task.priority} />
                </div>
              </div>

              <div className="pt-4 border-t">
                <Label className="text-sm text-muted-foreground">Assigned To</Label>
                {assignedUser ? (
                  <div className="flex items-center gap-2 mt-2">
                    <Avatar>
                      <AvatarImage src={assignedUser.avatar || undefined} />
                      <AvatarFallback>{getInitials(assignedUser.name)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{assignedUser.name}</p>
                      <p className="text-sm text-muted-foreground capitalize">{assignedUser.department}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground mt-1">Unassigned</p>
                )}
              </div>

              <div className="pt-4 border-t">
                <Label className="text-sm text-muted-foreground">Created By</Label>
                {createdBy && (
                  <div className="flex items-center gap-2 mt-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={createdBy.avatar || undefined} />
                      <AvatarFallback className="text-xs">{getInitials(createdBy.name)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">{createdBy.name}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(task.createdAt)}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Time Tracking</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Estimated:</span>
                <span className="font-medium">8 hours</span>
              </div>
              <div className="flex items-center gap-2 text-sm mt-2">
                <Clock className="h-4 w-4 text-green-600" />
                <span className="text-muted-foreground">Logged:</span>
                <span className="font-medium text-green-600">5 hours</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {showCompleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/80" onClick={() => setShowCompleteModal(false)} />
          <Card className="fixed z-50 w-full max-w-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Complete Task</CardTitle>
                <Button variant="ghost" size="icon" onClick={() => setShowCompleteModal(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Completion Remarks *</Label>
                <Textarea
                  value={completionRemarks}
                  onChange={(e) => setCompletionRemarks(e.target.value)}
                  placeholder="Describe what was accomplished..."
                  rows={4}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Attachments (Optional)</Label>
                <FileUpload
                  onFilesChange={setCompletionFiles}
                  maxFiles={5}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setShowCompleteModal(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCompleteTask}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Mark as Complete
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

function Label({ className, children }: { className?: string; children: React.ReactNode }) {
  return <label className={className}>{children}</label>
}