import { createAdminClient } from '../server-client'
import { sanitizeSearchTerm } from '../sanitize'

export type TaskStatus = 'pending' | 'in_progress' | 'review' | 'completed' | 'cancelled' | 'on_hold'
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'
export type TaskType = 'task' | 'bug' | 'feature' | 'maintenance' | 'training' | 'meeting'

export interface Task {
  id: string
  title: string
  description?: string
  type: TaskType
  priority: TaskPriority
  status: TaskStatus
  assignedTo?: string
  assignedToName?: string
  assignedBy: string
  assignedByName?: string
  claimedAt?: string
  parentTaskId?: string
  dueDate?: string
  startedAt?: string
  completedAt?: string
  cancelledAt?: string
  estimatedHours?: number
  actualHours?: number
  progressPercentage: number
  tags?: string[]
  attachments?: unknown[]
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface TaskComment {
  id: string
  taskId: string
  userId: string
  userName?: string
  comment: string
  mentions?: string[]
  attachments?: unknown[]
  createdAt: string
}

export interface TaskHistory {
  id: string
  taskId: string
  userId: string
  userName?: string
  action: string
  oldValue?: unknown
  newValue?: unknown
  createdAt: string
}

export interface TaskTimeLog {
  id: string
  taskId: string
  userId: string
  userName?: string
  startedAt: string
  endedAt?: string
  durationMinutes?: number
  description?: string
  createdAt: string
}

interface TaskListRow {
  id: string
  title: string
  description?: string | null
  type: TaskType
  priority: TaskPriority
  status: TaskStatus
  assigned_to?: string | null
  assigned_user?: { name?: string } | null
  assigned_by: string
  assigner?: { name?: string } | null
  claimed_at?: string | null
  parent_task_id?: string | null
  due_date?: string | null
  started_at?: string | null
  completed_at?: string | null
  cancelled_at?: string | null
  estimated_hours?: number | null
  actual_hours?: number | null
  progress_percentage?: number | null
  tags?: string[] | null
  attachments?: unknown[] | null
  notes?: string | null
  created_at: string
  updated_at: string
}

interface TaskCommentRow {
  id: string
  task_id: string
  user_id: string
  users?: { name?: string } | null
  comment: string
  mentions?: string[] | null
  attachments?: unknown[] | null
  created_at: string
}

interface TaskHistoryRow {
  id: string
  task_id: string
  user_id: string
  users?: { name?: string } | null
  action: string
  old_value?: unknown
  new_value?: unknown
  created_at: string
}

interface TaskTimeLogRow {
  id: string
  task_id: string
  user_id: string
  users?: { name?: string } | null
  started_at: string
  ended_at?: string | null
  duration_minutes?: number | null
  description?: string | null
  created_at: string
}

function mapTaskRow(t: TaskListRow): Task {
  return {
    id: t.id,
    title: t.title,
    description: t.description ?? undefined,
    type: t.type,
    priority: t.priority,
    status: t.status,
    assignedTo: t.assigned_to ?? undefined,
    assignedToName: t.assigned_user?.name,
    assignedBy: t.assigned_by,
    assignedByName: t.assigner?.name,
    claimedAt: t.claimed_at ?? undefined,
    parentTaskId: t.parent_task_id ?? undefined,
    dueDate: t.due_date ?? undefined,
    startedAt: t.started_at ?? undefined,
    completedAt: t.completed_at ?? undefined,
    cancelledAt: t.cancelled_at ?? undefined,
    estimatedHours: t.estimated_hours ?? undefined,
    actualHours: t.actual_hours ?? undefined,
    progressPercentage: t.progress_percentage || 0,
    tags: t.tags ?? undefined,
    attachments: t.attachments ?? undefined,
    notes: t.notes ?? undefined,
    createdAt: t.created_at,
    updatedAt: t.updated_at,
  }
}

export async function getTasks(filters?: {
  assignedTo?: string
  assignedToIds?: string[]
  assignedBy?: string
  status?: TaskStatus
  priority?: TaskPriority
  type?: TaskType
  search?: string
  page?: number
  limit?: number
}): Promise<{ data: Task[]; total: number }> {
  const supabase = await createAdminClient()
  const page = filters?.page || 1
  const limit = Math.min(filters?.limit || 20, 100)
  const start = (page - 1) * limit

  let query = supabase
    .from('tasks')
    .select('*, assigned_user:users!assigned_to(name), assigner:users!assigned_by(name)', { count: 'exact' })
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (filters?.assignedToIds && filters.assignedToIds.length > 0) {
    query = query.in('assigned_to', filters.assignedToIds)
  } else if (filters?.assignedTo) {
    query = query.eq('assigned_to', filters.assignedTo)
  }
  if (filters?.assignedBy) query = query.eq('assigned_by', filters.assignedBy)
  if (filters?.status) query = query.eq('status', filters.status)
  if (filters?.priority) query = query.eq('priority', filters.priority)
  if (filters?.type) query = query.eq('type', filters.type)
  if (filters?.search) {
    const safe = sanitizeSearchTerm(filters.search)
    if (safe.length > 0) {
      query = query.or(`title.ilike.%${safe}%,description.ilike.%${safe}%`)
    }
  }

  const { data, error, count } = await query.range(start, start + limit - 1)
  if (error) throw error

  return {
    data: data?.map((t) => mapTaskRow(t as TaskListRow)) || [],
    total: count || 0,
  }
}

export async function getTaskById(id: string): Promise<Task | null> {
  const supabase = await createAdminClient()
  
  const { data, error } = await supabase
    .from('tasks')
    .select('*, assigned_user:users!assigned_to(name), assigner:users!assigned_by(name)')
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }

  return mapTaskRow(data as TaskListRow)
}

export async function createTask(data: {
  title: string
  description?: string
  type?: TaskType
  priority?: TaskPriority
  assignedTo?: string
  assignedBy: string
  dueDate?: string
  estimatedHours?: number
  tags?: string[]
  notes?: string
  parentTaskId?: string
}): Promise<Task> {
  const supabase = await createAdminClient()
  
  const { data: task, error } = await supabase
    .from('tasks')
    .insert({
      title: data.title,
      description: data.description,
      type: data.type || 'task',
      priority: data.priority || 'medium',
      assigned_to: data.assignedTo,
      assigned_by: data.assignedBy,
      due_date: data.dueDate,
      estimated_hours: data.estimatedHours,
      tags: data.tags,
      notes: data.notes,
      parent_task_id: data.parentTaskId,
    })
    .select()
    .single()

  if (error) throw error

  await createHistoryRecord(task.id, data.assignedBy, 'created', null, { title: data.title })
  
  if (data.assignedTo) {
    await createHistoryRecord(task.id, data.assignedBy, 'assigned', null, { assignedTo: data.assignedTo })
  }

  return getTaskById(task.id) as Promise<Task>
}

export async function updateTask(id: string, data: Partial<{
  title: string
  description: string
  type: TaskType
  priority: TaskPriority
  status: TaskStatus
  assignedTo: string
  dueDate: string
  estimatedHours: number
  actualHours: number
  progressPercentage: number
  tags: string[]
  notes: string
}>): Promise<Task> {
  const supabase = await createAdminClient()
  
  const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() }
  
  if (data.title !== undefined) updateData.title = data.title
  if (data.description !== undefined) updateData.description = data.description
  if (data.type !== undefined) updateData.type = data.type
  if (data.priority !== undefined) updateData.priority = data.priority
  if (data.status !== undefined) updateData.status = data.status
  if (data.assignedTo !== undefined) updateData.assigned_to = data.assignedTo
  if (data.dueDate !== undefined) updateData.due_date = data.dueDate
  if (data.estimatedHours !== undefined) updateData.estimated_hours = data.estimatedHours
  if (data.actualHours !== undefined) updateData.actual_hours = data.actualHours
  if (data.progressPercentage !== undefined) updateData.progress_percentage = data.progressPercentage
  if (data.tags !== undefined) updateData.tags = data.tags
  if (data.notes !== undefined) updateData.notes = data.notes

  const { error } = await supabase
    .from('tasks')
    .update(updateData)
    .eq('id', id)

  if (error) throw error

  return getTaskById(id) as Promise<Task>
}

export async function deleteTask(id: string): Promise<void> {
  const supabase = await createAdminClient()
  
  const { error } = await supabase
    .from('tasks')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw error
}

export async function assignTask(id: string, userId: string, assignedBy: string): Promise<Task> {
  const supabase = await createAdminClient()
  
  const { data: oldTask } = await supabase
    .from('tasks')
    .select('assigned_to')
    .eq('id', id)
    .single()

  const { error } = await supabase
    .from('tasks')
    .update({
      assigned_to: userId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) throw error

  const action = oldTask?.assigned_to ? 'reassigned' : 'assigned'
  await createHistoryRecord(id, assignedBy, action, { oldAssignee: oldTask?.assigned_to }, { newAssignee: userId })

  return getTaskById(id) as Promise<Task>
}

export async function startTask(id: string, userId: string): Promise<Task> {
  const supabase = await createAdminClient()
  
  const { error } = await supabase
    .from('tasks')
    .update({
      status: 'in_progress',
      started_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) throw error

  await createHistoryRecord(id, userId, 'started', { status: 'pending' }, { status: 'in_progress' })

  return getTaskById(id) as Promise<Task>
}

export async function completeTask(id: string, userId: string, data?: { actualHours?: number }): Promise<Task> {
  const supabase = await createAdminClient()
  
  const updateData: Record<string, unknown> = {
    status: 'completed',
    completed_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
  
  if (data?.actualHours) updateData.actual_hours = data.actualHours

  const { error } = await supabase
    .from('tasks')
    .update(updateData)
    .eq('id', id)

  if (error) throw error

  await createHistoryRecord(id, userId, 'completed', { status: 'in_progress' }, { status: 'completed' })

  return getTaskById(id) as Promise<Task>
}

export async function cancelTask(id: string, userId: string): Promise<Task> {
  const supabase = await createAdminClient()
  
  const { error } = await supabase
    .from('tasks')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) throw error

  await createHistoryRecord(id, userId, 'cancelled', null, null)

  return getTaskById(id) as Promise<Task>
}

export async function getComments(taskId: string): Promise<TaskComment[]> {
  const supabase = await createAdminClient()
  
  const { data, error } = await supabase
    .from('task_comments')
    .select('*, users!user_id(name)')
    .eq('task_id', taskId)
    .is('deleted_at', null)
    .order('created_at', { ascending: true })

  if (error) throw error

  return data?.map((c) => {
    const row = c as TaskCommentRow
    return {
      id: row.id,
      taskId: row.task_id,
      userId: row.user_id,
      userName: row.users?.name,
      comment: row.comment,
      mentions: row.mentions ?? undefined,
      attachments: row.attachments ?? undefined,
      createdAt: row.created_at,
    }
  }) || []
}

export async function createComment(taskId: string, userId: string, comment: string, mentions?: string[]): Promise<TaskComment> {
  const supabase = await createAdminClient()
  
  const { data, error } = await supabase
    .from('task_comments')
    .insert({
      task_id: taskId,
      user_id: userId,
      comment,
      mentions,
    })
    .select()
    .single()

  if (error) throw error

  await createHistoryRecord(taskId, userId, 'comment_added', null, null)

  return {
    id: data.id,
    taskId: data.task_id,
    userId: data.user_id,
    comment: data.comment,
    mentions: data.mentions,
    attachments: data.attachments,
    createdAt: data.created_at,
  }
}

export async function getHistory(taskId: string): Promise<TaskHistory[]> {
  const supabase = await createAdminClient()
  
  const { data, error } = await supabase
    .from('task_history')
    .select('*, users!user_id(name)')
    .eq('task_id', taskId)
    .order('created_at', { ascending: false })

  if (error) throw error

  return data?.map((h) => {
    const row = h as TaskHistoryRow
    return {
      id: row.id,
      taskId: row.task_id,
      userId: row.user_id,
      userName: row.users?.name,
      action: row.action,
      oldValue: row.old_value,
      newValue: row.new_value,
      createdAt: row.created_at,
    }
  }) || []
}

export async function createHistoryRecord(
  taskId: string,
  userId: string,
  action: string,
  oldValue?: unknown,
  newValue?: unknown
): Promise<void> {
  const supabase = await createAdminClient()
  
  const { error } = await supabase
    .from('task_history')
    .insert({
      task_id: taskId,
      user_id: userId,
      action,
      old_value: oldValue,
      new_value: newValue,
    })

  if (error) console.error('Failed to create history record:', error)
}

export async function createTimeLog(
  taskId: string,
  userId: string,
  startedAt: string,
  endedAt?: string,
  description?: string
): Promise<TaskTimeLog> {
  const supabase = await createAdminClient()
  
  let durationMinutes
  if (startedAt && endedAt) {
    const start = new Date(startedAt).getTime()
    const end = new Date(endedAt).getTime()
    durationMinutes = Math.round((end - start) / 60000)
  }

  const { data, error } = await supabase
    .from('task_time_logs')
    .insert({
      task_id: taskId,
      user_id: userId,
      started_at: startedAt,
      ended_at: endedAt,
      duration_minutes: durationMinutes,
      description,
    })
    .select()
    .single()

  if (error) throw error

  if (durationMinutes && endedAt) {
    const { data: task } = await supabase
      .from('tasks')
      .select('actual_hours')
      .eq('id', taskId)
      .single()

    const currentHours = task?.actual_hours || 0
    const newHours = currentHours + (durationMinutes / 60)

    await supabase
      .from('tasks')
      .update({ actual_hours: newHours, updated_at: new Date().toISOString() })
      .eq('id', taskId)
  }

  return {
    id: data.id,
    taskId: data.task_id,
    userId: data.user_id,
    startedAt: data.started_at,
    endedAt: data.ended_at,
    durationMinutes: data.duration_minutes,
    description: data.description,
    createdAt: data.created_at,
  }
}

export async function getTimeLogs(taskId: string): Promise<TaskTimeLog[]> {
  const supabase = await createAdminClient()
  
  const { data, error } = await supabase
    .from('task_time_logs')
    .select('*, users!user_id(name)')
    .eq('task_id', taskId)
    .order('started_at', { ascending: false })

  if (error) throw error

  return data?.map((l) => {
    const row = l as TaskTimeLogRow
    return {
      id: row.id,
      taskId: row.task_id,
      userId: row.user_id,
      userName: row.users?.name,
      startedAt: row.started_at,
      endedAt: row.ended_at ?? undefined,
      durationMinutes: row.duration_minutes ?? undefined,
      description: row.description ?? undefined,
      createdAt: row.created_at,
    }
  }) || []
}
