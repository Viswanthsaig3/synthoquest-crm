export type TaskStatus = 'todo' | 'in_progress' | 'done'
export type TaskPriority = 'low' | 'medium' | 'high'

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
  createdAt: Date
  updatedAt: Date
}