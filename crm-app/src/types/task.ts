export type TaskStatus = 'todo' | 'in_progress' | 'done'
export type TaskPriority = 'low' | 'medium' | 'high'

export interface TaskAttachment {
  id: string
  fileName: string
  fileSize: number
  uploadedAt: Date
  uploadedBy: string
}

export interface TaskCompletion {
  completedAt: Date
  completedBy: string
  remarks: string
  attachments: TaskAttachment[]
}

export interface TaskComment {
  id: string
  taskId: string
  userId: string
  content: string
  createdAt: Date
}

export interface Task {
  id: string
  title: string
  description: string
  priority: TaskPriority
  status: TaskStatus
  assignedTo: string
  createdBy: string
  deadline: Date
  comments: TaskComment[]
  attachments: TaskAttachment[]
  completion?: TaskCompletion
  createdAt: Date
  updatedAt: Date
}