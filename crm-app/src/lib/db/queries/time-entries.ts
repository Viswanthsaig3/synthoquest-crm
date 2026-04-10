import { createAdminClient } from '../client'
import type {
  TimeEntry,
  CreateTimeEntryInput,
  TimeEntryFilters,
  TimeEntryStatus,
} from '@/types/time-entry'

export async function getTimeEntries(filters?: TimeEntryFilters): Promise<{
  data: TimeEntry[]
  pagination: { page: number; limit: number; total: number }
}> {
  const supabase = await createAdminClient()
  
  let query = supabase
    .from('time_entries')
    .select(`*, user:users!time_entries_user_id_fkey(id, name, email, department, role, avatar)`, { count: 'exact' })
    .is('deleted_at', null)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })

  if (filters?.userIds?.length) {
    query = query.in('user_id', filters.userIds)
  } else if (filters?.userId) {
    query = query.eq('user_id', filters.userId)
  }
  
  if (filters?.date) {
    query = query.eq('date', filters.date)
  }
  
  if (filters?.fromDate) {
    query = query.gte('date', filters.fromDate)
  }
  
  if (filters?.toDate) {
    query = query.lte('date', filters.toDate)
  }
  
  if (filters?.status) {
    query = query.eq('status', filters.status)
  }

  const page = filters?.page || 1
  const limit = filters?.limit || 50
  const from = (page - 1) * limit
  
  query = query.range(from, from + limit - 1)

  const { data, error, count } = await query

  if (error) throw error

  return {
    data: data?.map(transformTimeEntry) || [],
    pagination: { page, limit, total: count || 0 }
  }
}

export async function createTimeEntry(userId: string, input: CreateTimeEntryInput): Promise<TimeEntry> {
  const supabase = await createAdminClient()
  
  const { data, error } = await supabase
    .from('time_entries')
    .insert({
      user_id: userId,
      date: input.date,
      start_time: input.startTime,
      end_time: input.endTime,
      description: input.description,
      task_id: input.taskId,
      project_id: input.projectId,
      status: 'pending',
      submitted_at: new Date().toISOString()
    })
    .select()
    .single()

  if (error) throw error

  return transformTimeEntry(data)
}

export async function getTimeEntryById(id: string): Promise<TimeEntry | null> {
  const supabase = await createAdminClient()

  const { data, error } = await supabase
    .from('time_entries')
    .select(`*, user:users!time_entries_user_id_fkey(id, name, email, department, role, avatar)`)
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }

  return transformTimeEntry(data)
}

export async function updateTimeEntry(id: string, userId: string, updates: Partial<{
  startTime: string
  endTime: string
  description: string
}>): Promise<TimeEntry> {
  const supabase = await createAdminClient()
  
  const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() }
  
  if (updates.startTime) updateData.start_time = updates.startTime
  if (updates.endTime) updateData.end_time = updates.endTime
  if (updates.description) updateData.description = updates.description

  const { data, error } = await supabase
    .from('time_entries')
    .update(updateData)
    .eq('id', id)
    .eq('user_id', userId)
    .eq('status', 'pending')
    .is('deleted_at', null)
    .select()
    .single()

  if (error) throw error

  return transformTimeEntry(data)
}

export async function deleteTimeEntry(id: string, userId: string): Promise<void> {
  const supabase = await createAdminClient()
  
  const { error } = await supabase
    .from('time_entries')
    .update({
      deleted_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .eq('user_id', userId)
    .eq('status', 'pending')
    .is('deleted_at', null)

  if (error) throw error
}

export async function approveTimeEntry(id: string, approvedBy: string): Promise<TimeEntry> {
  const supabase = await createAdminClient()
  
  const { data, error } = await supabase
    .from('time_entries')
    .update({
      status: 'approved',
      approved_at: new Date().toISOString(),
      approved_by: approvedBy,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .eq('status', 'pending')
    .is('deleted_at', null)
    .select()
    .single()

  if (error) throw error

  return transformTimeEntry(data)
}

export async function rejectTimeEntry(id: string, rejectedBy: string, reason: string): Promise<TimeEntry> {
  const supabase = await createAdminClient()
  
  const { data, error } = await supabase
    .from('time_entries')
    .update({
      status: 'rejected',
      rejected_at: new Date().toISOString(),
      rejected_by: rejectedBy,
      rejection_reason: reason,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .eq('status', 'pending')
    .is('deleted_at', null)
    .select()
    .single()

  if (error) throw error

  return transformTimeEntry(data)
}

interface TimeEntryRow {
  id: string
  user_id: string
  date: string
  start_time: string
  end_time: string
  hours: number | string | null
  description: string
  task_id?: string | null
  project_id?: string | null
  status: string
  submitted_at: string
  approved_at?: string | null
  approved_by?: string | null
  rejected_at?: string | null
  rejected_by?: string | null
  rejection_reason?: string | null
  created_at: string
  updated_at: string
  deleted_at?: string | null
  user?: {
    id: string
    name: string
    email: string
    department: string
    role: string
    avatar?: string | null
  }
}

function transformTimeEntry(row: TimeEntryRow): TimeEntry {
  return {
    id: row.id,
    userId: row.user_id,
    date: row.date,
    startTime: row.start_time,
    endTime: row.end_time,
    hours: typeof row.hours === 'number' ? row.hours : parseFloat(String(row.hours ?? 0)) || 0,
    description: row.description,
    taskId: row.task_id ?? undefined,
    projectId: row.project_id ?? undefined,
    status: row.status as TimeEntryStatus,
    submittedAt: row.submitted_at,
    approvedAt: row.approved_at ?? undefined,
    approvedBy: row.approved_by ?? undefined,
    rejectedAt: row.rejected_at ?? undefined,
    rejectedBy: row.rejected_by ?? undefined,
    rejectionReason: row.rejection_reason ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at ?? undefined,
    user: row.user ? {
      id: row.user.id,
      name: row.user.name,
      email: row.user.email,
      department: row.user.department,
      role: row.user.role,
      avatar: row.user.avatar ?? undefined
    } : undefined
  }
}
