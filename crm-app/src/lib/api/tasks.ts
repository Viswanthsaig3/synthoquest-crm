import type {
  Task,
  TaskComment,
  TaskHistory,
  TaskTimeLog,
} from '@/lib/db/queries/tasks'
import { apiFetch } from '@/lib/api/client'

export async function getTasks(filters?: {
  assignedTo?: string
  assignedBy?: string
  status?: string
  priority?: string
  type?: string
  search?: string
  page?: number
  limit?: number
}): Promise<{ data: Task[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> {
  const params = new URLSearchParams()
  
  if (filters?.assignedTo) params.append('assignedTo', filters.assignedTo)
  if (filters?.assignedBy) params.append('assignedBy', filters.assignedBy)
  if (filters?.status) params.append('status', filters.status)
  if (filters?.priority) params.append('priority', filters.priority)
  if (filters?.type) params.append('type', filters.type)
  if (filters?.search) params.append('search', filters.search)
  if (filters?.page) params.append('page', filters.page.toString())
  if (filters?.limit) params.append('limit', filters.limit.toString())
  
  const query = params.toString()
  return apiFetch(`/tasks${query ? `?${query}` : ''}`)
}

export async function getTaskById(id: string): Promise<{ data: Task }> {
  return apiFetch(`/tasks/${id}`)
}

export async function createTask(data: {
  title: string
  description?: string
  type?: string
  priority?: string
  assignedTo?: string
  dueDate?: string
  estimatedHours?: number
  tags?: string[]
  notes?: string
  parentTaskId?: string
}): Promise<{ data: Task }> {
  return apiFetch('/tasks', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateTask(id: string, data: Partial<{
  title: string
  description: string
  type: string
  priority: string
  status: string
  assignedTo: string
  dueDate: string
  estimatedHours: number
  actualHours: number
  progressPercentage: number
  tags: string[]
  notes: string
}>): Promise<{ data: Task }> {
  return apiFetch(`/tasks/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function deleteTask(id: string): Promise<{ success: boolean }> {
  return apiFetch(`/tasks/${id}`, {
    method: 'DELETE',
  })
}

export async function assignTask(id: string, assignedTo: string): Promise<{ data: Task }> {
  return apiFetch(`/tasks/${id}/assign`, {
    method: 'POST',
    body: JSON.stringify({ assignedTo }),
  })
}

export async function startTask(id: string): Promise<{ data: Task }> {
  return apiFetch(`/tasks/${id}/start`, {
    method: 'POST',
  })
}

export async function completeTask(id: string, data?: { actualHours?: number }): Promise<{ data: Task }> {
  return apiFetch(`/tasks/${id}/complete`, {
    method: 'POST',
    body: JSON.stringify(data || {}),
  })
}

export async function cancelTask(id: string): Promise<{ data: Task }> {
  return apiFetch(`/tasks/${id}/cancel`, {
    method: 'POST',
  })
}

export async function getTaskComments(taskId: string): Promise<{ data: TaskComment[] }> {
  return apiFetch(`/tasks/${taskId}/comments`)
}

export async function createTaskComment(taskId: string, data: {
  comment: string
  mentions?: string[]
}): Promise<{ data: TaskComment }> {
  return apiFetch(`/tasks/${taskId}/comments`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function getTaskHistory(taskId: string): Promise<{ data: TaskHistory[] }> {
  return apiFetch(`/tasks/${taskId}/history`)
}

export async function getTaskTimeLogs(taskId: string): Promise<{ data: TaskTimeLog[] }> {
  return apiFetch(`/tasks/${taskId}/time-logs`)
}

export async function createTaskTimeLog(taskId: string, data: {
  startedAt: string
  endedAt?: string
  description?: string
}): Promise<{ data: TaskTimeLog }> {
  return apiFetch(`/tasks/${taskId}/time-logs`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}