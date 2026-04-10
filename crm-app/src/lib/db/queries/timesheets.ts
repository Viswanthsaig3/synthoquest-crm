import { createAdminClient } from '../server-client'

/** Disambiguate PostgREST embeds — timesheets has multiple FKs to users (employee, submitter, approver, rejector). */
const TS_USER_EMBED = 'user:users!timesheets_employee_id_fkey(name)'
const TS_USER_EMBED_WITH_EMAIL = 'user:users!timesheets_employee_id_fkey(name, email)'
const TS_USER_MANAGED_BY = 'user:users!timesheets_employee_id_fkey(managed_by)'
/** FK from timesheet_entries.timesheet_id → timesheets.id */
const TIMESHEET_ENTRIES_TIMESHEET_FK = 'timesheet_entries_timesheet_id_fkey'

export type TimesheetStatus = 'active'

export interface Timesheet {
  id: string
  employeeId: string
  employeeName?: string
  workDate: string
  totalHours: number
  regularHours: number
  overtimeHours: number
  status: TimesheetStatus
  submittedAt: string | null
  submittedBy: string | null
  approvedAt: string | null
  approvedBy: string | null
  rejectedAt: string | null
  rejectedBy: string | null
  rejectionReason: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
}

export type EntryApprovalStatus = 'pending' | 'approved' | 'rejected'

export interface TimesheetEntry {
  id: string
  timesheetId: string
  date: string
  taskId: string | null
  taskTitle?: string
  description: string | null
  startTime: string | null
  endTime: string | null
  breakMinutes: number
  totalHours: number
  billable: boolean
  location: string | null
  approvalStatus: EntryApprovalStatus
  approvedBy: string | null
  approvedAt: string | null
  rejectedBy: string | null
  rejectedAt: string | null
  rejectionReason: string | null
  createdAt: string
}

export interface TimesheetApproval {
  id: string
  timesheetId: string
  approverId: string
  approverName?: string
  action: 'approved' | 'rejected'
  comments?: string
  createdAt: string
}

/** Pending entry row including joined timesheet (approvals queue). */
export interface TimesheetPendingEntry extends TimesheetEntry {
  employeeName?: string
  employeeEmail?: string
  workDate?: string
}

interface TimesheetEntryRow {
  id: string
  timesheet_id: string
  date: string
  task_id: string | null
  description: string | null
  start_time: string | null
  end_time: string | null
  break_minutes: number | null
  total_hours: string | number | null
  billable: boolean
  location: string | null
  approval_status: string | null
  approved_by: string | null
  approved_at: string | null
  rejected_by: string | null
  rejected_at: string | null
  rejection_reason: string | null
  created_at: string
}

function mapTimesheetEntryRow(e: TimesheetEntryRow): TimesheetEntry {
  return {
    id: e.id,
    timesheetId: e.timesheet_id,
    date: e.date,
    taskId: e.task_id,
    taskTitle: undefined,
    approvalStatus: (e.approval_status || 'pending') as EntryApprovalStatus,
    approvedBy: e.approved_by,
    approvedAt: e.approved_at,
    rejectedBy: e.rejected_by,
    rejectedAt: e.rejected_at,
    rejectionReason: e.rejection_reason,
    description: e.description,
    startTime: e.start_time,
    endTime: e.end_time,
    breakMinutes: e.break_minutes || 0,
    totalHours: parseFloat(String(e.total_hours)) || 0,
    billable: e.billable,
    location: e.location,
    createdAt: e.created_at,
  }
}

interface TimesheetRowRaw {
  id: string
  employee_id: string
  work_date: string
  total_hours: string | number | null
  regular_hours: string | number | null
  overtime_hours: string | number | null
  status: string
  submitted_at: string | null
  submitted_by: string | null
  approved_at: string | null
  approved_by: string | null
  rejected_at: string | null
  rejected_by: string | null
  rejection_reason: string | null
  notes: string | null
  created_at: string
  updated_at: string
  user?: { name?: string } | null
  users?: { name?: string } | null
}

interface PendingEntryQueryRow extends TimesheetEntryRow {
  timesheet?: {
    work_date?: string
    user?: { name?: string; email?: string }
  }
}

interface TimesheetApprovalRow {
  id: string
  timesheet_id: string
  approver_id: string
  approver?: { name?: string } | null
  action: 'approved' | 'rejected'
  comments?: string | null
  created_at: string
}

export async function getTimesheets(filters: {
  employeeId?: string
  employeeIds?: string[]
  workDate?: string
  fromDate?: string
  toDate?: string
  page?: number
  limit?: number
}): Promise<{ data: Timesheet[]; total: number }> {
  const supabase = await createAdminClient()
  const rawPage = filters.page ?? 1
  const rawLimit = filters.limit ?? 20
  const page = Math.max(1, Number.isFinite(rawPage) && rawPage > 0 ? Math.floor(rawPage) : 1)
  const limit = Math.min(100, Math.max(1, Number.isFinite(rawLimit) && rawLimit > 0 ? Math.floor(rawLimit) : 20))
  const start = (page - 1) * limit

  let query = supabase
    .from('timesheets')
    .select(
      `id, employee_id, work_date, total_hours, regular_hours, overtime_hours, status, submitted_at, submitted_by, approved_at, approved_by, rejected_at, rejected_by, rejection_reason, notes, created_at, updated_at, ${TS_USER_EMBED}`,
      { count: 'exact' }
    )
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (filters.employeeId) query = query.eq('employee_id', filters.employeeId)
  if (filters.employeeIds && filters.employeeIds.length > 0) query = query.in('employee_id', filters.employeeIds)
  if (filters.workDate) query = query.eq('work_date', filters.workDate)
  if (filters.fromDate) query = query.gte('work_date', filters.fromDate)
  if (filters.toDate) query = query.lte('work_date', filters.toDate)

  const { data, error, count } = await query.range(start, start + limit - 1)
  if (error) throw error

  return {
    data: data?.map((t) => mapTimesheetRow(t as TimesheetRowRaw)) || [],
    total: count ?? 0,
  }
}

export async function getTimesheetById(id: string): Promise<Timesheet | null> {
  const supabase = await createAdminClient()
  
  const { data, error } = await supabase
    .from('timesheets')
    .select(
      `id, employee_id, work_date, total_hours, regular_hours, overtime_hours, status, submitted_at, submitted_by, approved_at, approved_by, rejected_at, rejected_by, rejection_reason, notes, created_at, updated_at, ${TS_USER_EMBED}`
    )
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }

  return mapTimesheetRow(data as TimesheetRowRaw)
}

export async function getTimesheetByDate(employeeId: string, workDate: string): Promise<Timesheet | null> {
  const supabase = await createAdminClient()
  
  const { data, error } = await supabase
    .from('timesheets')
    .select('*')
    .eq('employee_id', employeeId)
    .eq('work_date', workDate)
    .is('deleted_at', null)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }

  return {
    id: data.id,
    employeeId: data.employee_id,
    workDate: data.work_date,
    totalHours: parseFloat(data.total_hours) || 0,
    regularHours: parseFloat(data.regular_hours) || 0,
    overtimeHours: parseFloat(data.overtime_hours) || 0,
    status: 'active',
    submittedAt: data.submitted_at,
    submittedBy: data.submitted_by,
    approvedAt: data.approved_at,
    approvedBy: data.approved_by,
    rejectedAt: data.rejected_at,
    rejectedBy: data.rejected_by,
    rejectionReason: data.rejection_reason,
    notes: data.notes,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  }
}

export async function createTimesheet(data: {
  employeeId: string
  workDate: string
  notes?: string
}): Promise<Timesheet> {
  const supabase = await createAdminClient()
  
  const { data: timesheet, error } = await supabase
    .from('timesheets')
    .insert({
      employee_id: data.employeeId,
      work_date: data.workDate,
      notes: data.notes,
      status: 'active',
    })
    .select()
    .single()

  if (error) throw error

  return getTimesheetById(timesheet.id) as Promise<Timesheet>
}

export async function updateTimesheet(id: string, data: { notes?: string | null }): Promise<Timesheet> {
  const supabase = await createAdminClient()

  const { error } = await supabase
    .from('timesheets')
    .update({
      notes: data.notes ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .is('deleted_at', null)

  if (error) throw error

  return getTimesheetById(id) as Promise<Timesheet>
}

export async function deleteTimesheet(id: string): Promise<void> {
  const supabase = await createAdminClient()

  const { error } = await supabase
    .from('timesheets')
    .update({
      deleted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .is('deleted_at', null)

  if (error) throw error
}

export async function getEntries(timesheetId: string): Promise<TimesheetEntry[]> {
  const supabase = await createAdminClient()
  
  const { data, error } = await supabase
    .from('timesheet_entries')
    .select('id, timesheet_id, date, task_id, description, start_time, end_time, break_minutes, total_hours, billable, location, approval_status, approved_by, approved_at, rejected_by, rejected_at, rejection_reason, created_at')
    .eq('timesheet_id', timesheetId)
    .order('date', { ascending: true })

  if (error) throw error

  return data?.map((e) => mapTimesheetEntryRow(e as TimesheetEntryRow)) || []
}

export async function createEntry(timesheetId: string, data: {
  date: string
  taskId?: string
  description?: string
  startTime?: string
  endTime?: string
  breakMinutes?: number
  billable?: boolean
  location?: string
}): Promise<TimesheetEntry> {
  const supabase = await createAdminClient()
  
  const totalHours = calculateEntryHours(data.startTime, data.endTime, data.breakMinutes || 0)
  
  const { data: entry, error } = await supabase
    .from('timesheet_entries')
    .insert({
      timesheet_id: timesheetId,
      date: data.date,
      task_id: data.taskId || null,
      description: data.description,
      start_time: data.startTime || null,
      end_time: data.endTime || null,
      break_minutes: data.breakMinutes || 0,
      total_hours: totalHours,
      billable: data.billable !== undefined ? data.billable : true,
      location: data.location || null,
      approval_status: 'pending',
    })
    .select()
    .single()

  if (error) throw error

  await recalculateTimesheetTotals(timesheetId)

  return {
    id: entry.id,
    timesheetId: entry.timesheet_id,
    date: entry.date,
    taskId: entry.task_id,
    description: entry.description,
    startTime: entry.start_time,
    endTime: entry.end_time,
    breakMinutes: entry.break_minutes,
    totalHours: parseFloat(entry.total_hours),
    billable: entry.billable,
    location: entry.location,
    approvalStatus: (entry.approval_status || 'pending') as EntryApprovalStatus,
    approvedBy: entry.approved_by || null,
    approvedAt: entry.approved_at || null,
    rejectedBy: entry.rejected_by || null,
    rejectedAt: entry.rejected_at || null,
    rejectionReason: entry.rejection_reason || null,
    createdAt: entry.created_at,
  }
}

export async function updateEntry(id: string, data: Partial<{
  date: string
  taskId: string
  description: string
  startTime: string
  endTime: string
  breakMinutes: number
  billable: boolean
  location: string
}>): Promise<TimesheetEntry> {
  const supabase = await createAdminClient()
  
  const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() }
  
  if (data.date) updateData.date = data.date
  if (data.taskId !== undefined) updateData.task_id = data.taskId
  if (data.description !== undefined) updateData.description = data.description
  if (data.startTime !== undefined) updateData.start_time = data.startTime
  if (data.endTime !== undefined) updateData.end_time = data.endTime
  if (data.breakMinutes !== undefined) updateData.break_minutes = data.breakMinutes
  if (data.billable !== undefined) updateData.billable = data.billable
  if (data.location !== undefined) updateData.location = data.location
  
  if (data.startTime && data.endTime) {
    updateData.total_hours = calculateEntryHours(data.startTime, data.endTime, data.breakMinutes || 0)
  }

  const { data: entry, error } = await supabase
    .from('timesheet_entries')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error

  await recalculateTimesheetTotals(entry.timesheet_id)

  return {
    id: entry.id,
    timesheetId: entry.timesheet_id,
    date: entry.date,
    taskId: entry.task_id,
    description: entry.description,
    startTime: entry.start_time,
    endTime: entry.end_time,
    breakMinutes: entry.break_minutes,
    totalHours: parseFloat(entry.total_hours),
    billable: entry.billable,
    location: entry.location,
    approvalStatus: (entry.approval_status || 'pending') as EntryApprovalStatus,
    approvedBy: entry.approved_by || null,
    approvedAt: entry.approved_at || null,
    rejectedBy: entry.rejected_by || null,
    rejectedAt: entry.rejected_at || null,
    rejectionReason: entry.rejection_reason || null,
    createdAt: entry.created_at,
  }
}

export async function deleteEntry(id: string): Promise<void> {
  const supabase = await createAdminClient()
  
  const { data: entry } = await supabase
    .from('timesheet_entries')
    .select('timesheet_id')
    .eq('id', id)
    .single()

  const { error } = await supabase
    .from('timesheet_entries')
    .delete()
    .eq('id', id)

  if (error) throw error

  if (entry) {
    await recalculateTimesheetTotals(entry.timesheet_id)
  }
}

export async function getPendingEntries(filters: {
  employeeId?: string
  employeeIds?: string[]
  fromDate?: string
  toDate?: string
  page?: number
  limit?: number
}): Promise<{ data: TimesheetPendingEntry[]; total: number }> {
  const supabase = await createAdminClient()
  const page = filters.page || 1
  const limit = Math.min(filters.limit || 100, 500)
  const start = (page - 1) * limit

  let timesheetIds: string[] | null = null
  if (filters.employeeId) {
    const { data: rows, error: tidErr } = await supabase
      .from('timesheets')
      .select('id')
      .eq('employee_id', filters.employeeId)
      .is('deleted_at', null)
    if (tidErr) throw tidErr
    timesheetIds = (rows || []).map((r: { id: string }) => r.id)
    if (timesheetIds.length === 0) return { data: [], total: 0 }
  } else if (filters.employeeIds && filters.employeeIds.length > 0) {
    const { data: rows, error: tidErr } = await supabase
      .from('timesheets')
      .select('id')
      .in('employee_id', filters.employeeIds)
      .is('deleted_at', null)
    if (tidErr) throw tidErr
    timesheetIds = (rows || []).map((r: { id: string }) => r.id)
    if (timesheetIds.length === 0) return { data: [], total: 0 }
  }

  let query = supabase
    .from('timesheet_entries')
    .select(
      `id, timesheet_id, date, task_id, description, start_time, end_time, break_minutes, total_hours, billable, location, approval_status, approved_by, approved_at, rejected_by, rejected_at, rejection_reason, created_at,
      timesheet:timesheets!${TIMESHEET_ENTRIES_TIMESHEET_FK}(employee_id, work_date, ${TS_USER_EMBED_WITH_EMAIL})`,
      { count: 'exact' }
    )
    .eq('approval_status', 'pending')
    .order('date', { ascending: false })

  if (timesheetIds) {
    query = query.in('timesheet_id', timesheetIds)
  }

  if (filters.fromDate) query = query.gte('date', filters.fromDate)
  if (filters.toDate) query = query.lte('date', filters.toDate)

  const { data, error, count } = await query.range(start, start + limit - 1)
  if (error) throw error

  const entries: TimesheetPendingEntry[] = (data || []).map((e) => {
    const row = e as PendingEntryQueryRow
    const base = mapTimesheetEntryRow(row)
    return {
      ...base,
      employeeName: row.timesheet?.user?.name,
      employeeEmail: row.timesheet?.user?.email,
      workDate: row.timesheet?.work_date,
    }
  })

  return { data: entries, total: count || 0 }
}

/** Entry-level approval counts for a worker’s timesheets (not legacy timesheet.status). */
export async function getTimesheetEntryApprovalCountsForEmployee(employeeId: string): Promise<{
  pending: number
  approved: number
  rejected: number
}> {
  const supabase = await createAdminClient()
  const { data: sheets, error: se } = await supabase
    .from('timesheets')
    .select('id')
    .eq('employee_id', employeeId)
    .is('deleted_at', null)
  if (se) throw se
  const ids = (sheets || []).map((r: { id: string }) => r.id)
  if (ids.length === 0) return { pending: 0, approved: 0, rejected: 0 }

  const countStatus = async (status: EntryApprovalStatus) => {
    const { count, error } = await supabase
      .from('timesheet_entries')
      .select('*', { count: 'exact', head: true })
      .in('timesheet_id', ids)
      .eq('approval_status', status)
    if (error) throw error
    return count || 0
  }

  const [pending, approved, rejected] = await Promise.all([
    countStatus('pending'),
    countStatus('approved'),
    countStatus('rejected'),
  ])

  return { pending, approved, rejected }
}

export async function approveEntry(entryId: string, approverId: string): Promise<TimesheetEntry> {
  const supabase = await createAdminClient()

  // SECURITY: Verify approver is not the entry owner (prevent self-approval)
  const { data: existing } = await supabase
    .from('timesheet_entries')
    .select(`timesheet:timesheets!${TIMESHEET_ENTRIES_TIMESHEET_FK}(employee_id)`)
    .eq('id', entryId)
    .single()
  
  if ((existing as { timesheet?: { employee_id?: string } })?.timesheet?.employee_id === approverId) {
    throw new Error('Cannot approve your own timesheet entries')
  }

  const { data: entry, error } = await supabase
    .from('timesheet_entries')
    .update({
      approval_status: 'approved',
      approved_by: approverId,
      approved_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', entryId)
    .select()
    .single()

  if (error) throw error

  return {
    id: entry.id,
    timesheetId: entry.timesheet_id,
    date: entry.date,
    taskId: entry.task_id,
    description: entry.description,
    startTime: entry.start_time,
    endTime: entry.end_time,
    breakMinutes: entry.break_minutes || 0,
    totalHours: parseFloat(entry.total_hours) || 0,
    billable: entry.billable,
    location: entry.location,
    approvalStatus: entry.approval_status as EntryApprovalStatus,
    approvedBy: entry.approved_by,
    approvedAt: entry.approved_at,
    rejectedBy: entry.rejected_by,
    rejectedAt: entry.rejected_at,
    rejectionReason: entry.rejection_reason,
    createdAt: entry.created_at,
  }
}

export async function rejectEntry(entryId: string, rejectorId: string, reason: string): Promise<TimesheetEntry> {
  const supabase = await createAdminClient()

  // SECURITY: Verify rejector is not the entry owner (prevent self-rejection)
  const { data: existing } = await supabase
    .from('timesheet_entries')
    .select(`timesheet:timesheets!${TIMESHEET_ENTRIES_TIMESHEET_FK}(employee_id)`)
    .eq('id', entryId)
    .single()
  
  if ((existing as { timesheet?: { employee_id?: string } })?.timesheet?.employee_id === rejectorId) {
    throw new Error('Cannot reject your own timesheet entries')
  }

  const { data: entry, error } = await supabase
    .from('timesheet_entries')
    .update({
      approval_status: 'rejected',
      rejected_by: rejectorId,
      rejected_at: new Date().toISOString(),
      rejection_reason: reason,
      updated_at: new Date().toISOString(),
    })
    .eq('id', entryId)
    .select()
    .single()

  if (error) throw error

  return {
    id: entry.id,
    timesheetId: entry.timesheet_id,
    date: entry.date,
    taskId: entry.task_id,
    description: entry.description,
    startTime: entry.start_time,
    endTime: entry.end_time,
    breakMinutes: entry.break_minutes || 0,
    totalHours: parseFloat(entry.total_hours) || 0,
    billable: entry.billable,
    location: entry.location,
    approvalStatus: entry.approval_status as EntryApprovalStatus,
    approvedBy: entry.approved_by,
    approvedAt: entry.approved_at,
    rejectedBy: entry.rejected_by,
    rejectedAt: entry.rejected_at,
    rejectionReason: entry.rejection_reason,
    createdAt: entry.created_at,
  }
}

export async function bulkApproveEntries(entryIds: string[], approverId: string): Promise<void> {
  const supabase = await createAdminClient()
  
  const { error } = await supabase
    .from('timesheet_entries')
    .update({
      approval_status: 'approved',
      approved_by: approverId,
      approved_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .in('id', entryIds)

  if (error) throw error
}

export async function bulkRejectEntries(entryIds: string[], rejectorId: string, reason: string): Promise<void> {
  const supabase = await createAdminClient()
  
  const { error } = await supabase
    .from('timesheet_entries')
    .update({
      approval_status: 'rejected',
      rejected_by: rejectorId,
      rejected_at: new Date().toISOString(),
      rejection_reason: reason,
      updated_at: new Date().toISOString(),
    })
    .in('id', entryIds)

  if (error) throw error
}

export async function validateBulkEntryOwnership(
  entryIds: string[],
  approverId: string,
  canViewAll: boolean
): Promise<{ valid: boolean; error?: string }> {
  const supabase = await createAdminClient()
  
  const { data: entries, error } = await supabase
    .from('timesheet_entries')
    .select(`
      id,
      timesheet:timesheets!${TIMESHEET_ENTRIES_TIMESHEET_FK}(
        employee_id,
        ${TS_USER_MANAGED_BY}
      )
    `)
    .in('id', entryIds)

  if (error) throw error

  // SECURITY: Prevent self-approval/rejection of own timesheet entries (bulk)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const selfEntries = (entries || []).filter((entry: any) => {
    const ts = Array.isArray(entry.timesheet) ? entry.timesheet[0] : entry.timesheet
    return ts?.employee_id === approverId
  })
  if (selfEntries.length > 0) {
    return {
      valid: false,
      error: 'Cannot approve/reject your own timesheet entries',
    }
  }

  if (canViewAll) return { valid: true }

  const unauthorizedIds: string[] = []
  for (const entry of (entries || []) as Array<{ id: string; timesheet?: { user?: { managed_by?: string } } }>) {
    const managedBy = entry.timesheet?.user?.managed_by
    if (managedBy !== approverId) {
      unauthorizedIds.push(entry.id)
    }
  }

  if (unauthorizedIds.length > 0) {
    return {
      valid: false,
      error: `Cannot approve/reject entries outside your team`,
    }
  }

  return { valid: true }
}

export async function getTimesheetApprovals(timesheetId: string): Promise<TimesheetApproval[]> {
  const supabase = await createAdminClient()

  const { data, error } = await supabase
    .from('timesheet_approvals')
    .select('id, timesheet_id, approver_id, action, comments, created_at, approver:users!timesheet_approvals_approver_id_fkey(name)')
    .eq('timesheet_id', timesheetId)
    .order('created_at', { ascending: false })

  if (error) throw error

  return data?.map((approval) => {
    const a = approval as TimesheetApprovalRow
    return {
      id: a.id,
      timesheetId: a.timesheet_id,
      approverId: a.approver_id,
      approverName: a.approver?.name,
      action: a.action,
      comments: a.comments ?? undefined,
      createdAt: a.created_at,
    }
  }) || []
}

function calculateEntryHours(startTime?: string, endTime?: string, breakMinutes: number = 0): number {
  if (!startTime || !endTime) return 0
  
  const [startH, startM] = startTime.split(':').map(Number)
  const [endH, endM] = endTime.split(':').map(Number)
  
  const startMinutes = startH * 60 + startM
  const endMinutes = endH * 60 + endM
  
  const totalMinutes = endMinutes - startMinutes - breakMinutes
  
  return Math.max(0, totalMinutes / 60)
}

async function recalculateTimesheetTotals(timesheetId: string): Promise<void> {
  const supabase = await createAdminClient()
  
  const { data: entries } = await supabase
    .from('timesheet_entries')
    .select('total_hours')
    .eq('timesheet_id', timesheetId)

  const rawTotal =
    entries?.reduce((sum: number, e: { total_hours?: string | number | null }) => {
      return sum + parseFloat(String(e.total_hours ?? 0))
    }, 0) || 0

  // SECURITY: CRIT-02 — Cap total hours at maximum allowed per day (defense-in-depth)
  const MAX_HOURS_PER_DAY = 16
  const totalHours = Math.min(rawTotal, MAX_HOURS_PER_DAY)
  const regularHours = Math.min(totalHours, 8)
  const overtimeHours = Math.max(0, totalHours - 8)

  await supabase
    .from('timesheets')
    .update({
      total_hours: totalHours,
      regular_hours: regularHours,
      overtime_hours: overtimeHours,
      updated_at: new Date().toISOString(),
    })
    .eq('id', timesheetId)
}

function mapTimesheetRow(t: TimesheetRowRaw): Timesheet {
  return {
    id: t.id,
    employeeId: t.employee_id,
    employeeName: t.user?.name || t.users?.name || undefined,
    workDate: t.work_date,
    totalHours: parseFloat(String(t.total_hours)) || 0,
    regularHours: parseFloat(String(t.regular_hours)) || 0,
    overtimeHours: parseFloat(String(t.overtime_hours)) || 0,
    status: 'active',
    submittedAt: t.submitted_at,
    submittedBy: t.submitted_by,
    approvedAt: t.approved_at,
    approvedBy: t.approved_by,
    rejectedAt: t.rejected_at,
    rejectedBy: t.rejected_by,
    rejectionReason: t.rejection_reason,
    notes: t.notes,
    createdAt: t.created_at,
    updatedAt: t.updated_at,
  }
}
