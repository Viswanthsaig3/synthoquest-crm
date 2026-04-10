import { createAdminClient } from '../server-client'
import { sanitizeSearchTerm } from '../sanitize'
import type { Bug, BugStatus, BugSeverity, BugHistoryEntry, BugFilters } from '@/types/bug'

/** Shape returned by Supabase for bug list/detail selects with joins */
interface BugRow {
  id: string
  title: string
  description: string
  severity: BugSeverity
  status: BugStatus
  reported_by: string
  reporter_name?: string | null
  reporter_email?: string | null
  reporter_role?: string | null
  page_url: string
  error_context?: string | null
  user_agent?: string | null
  screenshot_url?: string | null
  screenshot_filename?: string | null
  screenshot_size?: number | null
  assigned_to?: string | null
  assigned_to_name?: string | null
  assigned_at?: string | null
  assigned_by?: string | null
  resolved_at?: string | null
  resolved_by?: string | null
  resolution_notes?: string | null
  created_at: string
  updated_at: string
  deleted_at?: string | null
}

interface BugHistoryRow {
  id: string
  bug_id: string
  user_id: string
  user_name?: string | null
  action: string
  old_value?: string | null
  new_value?: string | null
  created_at: string
}

function mapBugRow(row: BugRow): Bug {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    severity: row.severity,
    status: row.status,
    reportedBy: row.reported_by,
    reporterName: row.reporter_name ?? undefined,
    reporterEmail: row.reporter_email ?? undefined,
    reporterRole: row.reporter_role ?? undefined,
    pageUrl: row.page_url,
    errorContext: row.error_context ?? undefined,
    userAgent: row.user_agent ?? undefined,
    screenshotUrl: row.screenshot_url ?? undefined,
    screenshotFilename: row.screenshot_filename ?? undefined,
    screenshotSize: row.screenshot_size ?? undefined,
    assignedTo: row.assigned_to ?? undefined,
    assignedToName: row.assigned_to_name ?? undefined,
    assignedAt: row.assigned_at ?? undefined,
    assignedBy: row.assigned_by ?? undefined,
    resolvedAt: row.resolved_at ?? undefined,
    resolvedBy: row.resolved_by ?? undefined,
    resolutionNotes: row.resolution_notes ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function getBugs(filters?: BugFilters): Promise<{ data: Bug[]; total: number }> {
  const supabase = await createAdminClient()
  const page = filters?.page || 1
  const limit = Math.min(filters?.limit || 20, 100)
  const start = (page - 1) * limit

  let query = supabase
    .from('bugs')
    .select('*', { count: 'exact' })
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (filters?.status) query = query.eq('status', filters.status)
  if (filters?.severity) query = query.eq('severity', filters.severity)
  if (filters?.assignedTo) query = query.eq('assigned_to', filters.assignedTo)
  if (filters?.search) {
    const safe = sanitizeSearchTerm(filters.search)
    if (safe.length > 0) {
      query = query.or(`title.ilike.%${safe}%,description.ilike.%${safe}%`)
    }
  }

  const { data, error, count } = await query.range(start, start + limit - 1)
  if (error) throw error

  return {
    data: data?.map((b) => mapBugRow(b as BugRow)) || [],
    total: count || 0,
  }
}

export async function getBugById(id: string): Promise<Bug | null> {
  const supabase = await createAdminClient()

  const { data, error } = await supabase
    .from('bugs')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }

  return mapBugRow(data as BugRow)
}

export async function createBug(data: {
  title: string
  description: string
  severity: BugSeverity
  reportedBy: string
  reporterName?: string
  reporterEmail?: string
  reporterRole?: string
  pageUrl: string
  errorContext?: string
  userAgent?: string
  screenshotUrl?: string
  screenshotFilename?: string
  screenshotSize?: number
}): Promise<Bug> {
  const supabase = await createAdminClient()

  const { data: bug, error } = await supabase
    .from('bugs')
    .insert({
      title: data.title,
      description: data.description,
      severity: data.severity,
      reported_by: data.reportedBy,
      reporter_name: data.reporterName,
      reporter_email: data.reporterEmail,
      reporter_role: data.reporterRole,
      page_url: data.pageUrl,
      error_context: data.errorContext,
      user_agent: data.userAgent,
      screenshot_url: data.screenshotUrl,
      screenshot_filename: data.screenshotFilename,
      screenshot_size: data.screenshotSize,
    })
    .select()
    .single()

  if (error) throw error

  // Create history entry
  await supabase.from('bug_history').insert({
    bug_id: bug.id,
    user_id: data.reportedBy,
    user_name: data.reporterName,
    action: 'created',
    new_value: data.title,
  })

  return mapBugRow(bug as BugRow)
}

export async function updateBugStatus(
  id: string,
  status: BugStatus,
  userId: string,
  userName?: string
): Promise<Bug> {
  const supabase = await createAdminClient()

  const updateData: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  }

  if (status === 'closed') {
    updateData.resolved_at = new Date().toISOString()
    updateData.resolved_by = userId
  }

  const { data: updated, error } = await supabase
    .from('bugs')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error

  // Create history entry
  await supabase.from('bug_history').insert({
    bug_id: id,
    user_id: userId,
    user_name: userName,
    action: 'status_changed',
    new_value: status,
  })

  return mapBugRow(updated as BugRow)
}

export async function assignBug(
  id: string,
  assignedTo: string,
  assignedToName: string,
  assignedBy: string,
  assignedByName?: string
): Promise<Bug> {
  const supabase = await createAdminClient()

  const { data: updated, error } = await supabase
    .from('bugs')
    .update({
      assigned_to: assignedTo,
      assigned_to_name: assignedToName,
      assigned_at: new Date().toISOString(),
      assigned_by: assignedBy,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error

  // Create history entry
  await supabase.from('bug_history').insert({
    bug_id: id,
    user_id: assignedBy,
    user_name: assignedByName,
    action: 'assigned',
    new_value: assignedToName,
  })

  return mapBugRow(updated as BugRow)
}

export async function deleteBugScreenshot(
  id: string,
  userId: string,
  userName?: string
): Promise<Bug> {
  const supabase = await createAdminClient()

  const { data: updated, error } = await supabase
    .from('bugs')
    .update({
      screenshot_url: null,
      screenshot_filename: null,
      screenshot_size: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error

  // Create history entry
  await supabase.from('bug_history').insert({
    bug_id: id,
    user_id: userId,
    user_name: userName,
    action: 'screenshot_deleted',
  })

  return mapBugRow(updated as BugRow)
}

export async function getBugHistory(bugId: string): Promise<BugHistoryEntry[]> {
  const supabase = await createAdminClient()

  const { data, error } = await supabase
    .from('bug_history')
    .select('*')
    .eq('bug_id', bugId)
    .order('created_at', { ascending: false })

  if (error) throw error

  return data?.map((h) => {
    const row = h as BugHistoryRow
    return {
      id: row.id,
      bugId: row.bug_id,
      userId: row.user_id,
      userName: row.user_name ?? undefined,
      action: row.action as BugHistoryEntry['action'],
      oldValue: row.old_value ?? undefined,
      newValue: row.new_value ?? undefined,
      createdAt: row.created_at,
    }
  }) || []
}

export async function deleteBug(id: string): Promise<void> {
  const supabase = await createAdminClient()

  const { error } = await supabase
    .from('bugs')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw error
}