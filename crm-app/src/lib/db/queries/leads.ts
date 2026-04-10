import { createAdminClient } from '../server-client'
import { sanitizeSearchTerm } from '../sanitize'

export type LeadStatus = 'new' | 'contacted' | 'follow_up' | 'qualified' | 'converted' | 'lost'
export type LeadPriority = 'hot' | 'warm' | 'cold'
export type LeadSource = 'ads' | 'referral' | 'organic'

export interface Lead {
  id: string
  name: string
  email: string
  phone: string
  alternatePhone?: string
  typeId?: string
  typeName?: string
  typeStatus?: string
  typeSource?: string
  customFields: Record<string, unknown>
  courseInterested?: string
  source: LeadSource
  status: LeadStatus
  priority: LeadPriority
  assignedTo?: string
  assignedToName?: string
  claimedAt?: string
  notes?: string
  lastContactedAt?: string
  nextFollowUpAt?: string
  totalCalls: number
  lastCallOutcome?: string
  convertedAt?: string
  convertedBy?: string
  conversionTargetId?: string
  conversionTargetType?: string
  lossReason?: string
  createdAt: string
  updatedAt: string
}

export interface LeadActivity {
  id: string
  leadId: string
  type: string
  description: string
  createdBy: string
  createdByName?: string
  metadata?: Record<string, unknown>
  createdAt: string
}

export interface CallRecord {
  id: string
  leadId: string
  calledBy: string
  calledByName?: string
  phoneNumber: string
  startedAt: string
  endedAt?: string
  duration: number
  outcome: string
  recordingUrl?: string
  remarks?: string
  followUpRequired: boolean
  followUpDate?: string
  createdAt: string
}

/** Shape returned by Supabase for lead list/detail selects with joins */
interface LeadListRow {
  id: string
  name: string
  email: string
  phone: string
  alternate_phone?: string | null
  type_id?: string | null
  lead_types?: { name?: string } | null
  type_status?: string | null
  type_source?: string | null
  custom_fields?: Record<string, unknown> | null
  course_interested?: string | null
  source: LeadSource
  status: LeadStatus
  priority: LeadPriority
  assigned_to?: string | null
  assigned_user?: { name?: string } | null
  claimed_at?: string | null
  notes?: string | null
  last_contacted_at?: string | null
  next_follow_up_at?: string | null
  total_calls?: number | null
  last_call_outcome?: string | null
  converted_at?: string | null
  converted_by?: string | null
  conversion_target_id?: string | null
  conversion_target_type?: string | null
  loss_reason?: string | null
  created_at: string
  updated_at: string
}

interface LeadActivityRow {
  id: string
  lead_id: string
  type: string
  description: string
  created_by: string
  users?: { name?: string } | null
  metadata?: Record<string, unknown> | null
  created_at: string
}

interface CallRecordRow {
  id: string
  lead_id: string
  called_by: string
  users?: { name?: string } | null
  phone_number: string
  started_at: string
  ended_at?: string | null
  duration: number
  outcome: string
  recording_url?: string | null
  remarks?: string | null
  follow_up_required: boolean
  follow_up_date?: string | null
  created_at: string
}

function mapLeadListRow(l: LeadListRow): Lead {
  return {
    id: l.id,
    name: l.name,
    email: l.email,
    phone: l.phone,
    alternatePhone: l.alternate_phone ?? undefined,
    typeId: l.type_id ?? undefined,
    typeName: l.lead_types?.name,
    typeStatus: l.type_status ?? undefined,
    typeSource: l.type_source ?? undefined,
    customFields: l.custom_fields ?? {},
    courseInterested: l.course_interested ?? undefined,
    source: l.source,
    status: l.status,
    priority: l.priority,
    assignedTo: l.assigned_to ?? undefined,
    assignedToName: l.assigned_user?.name,
    claimedAt: l.claimed_at ?? undefined,
    notes: l.notes ?? undefined,
    lastContactedAt: l.last_contacted_at ?? undefined,
    nextFollowUpAt: l.next_follow_up_at ?? undefined,
    totalCalls: l.total_calls || 0,
    lastCallOutcome: l.last_call_outcome ?? undefined,
    convertedAt: l.converted_at ?? undefined,
    convertedBy: l.converted_by ?? undefined,
    conversionTargetId: l.conversion_target_id ?? undefined,
    conversionTargetType: l.conversion_target_type ?? undefined,
    lossReason: l.loss_reason ?? undefined,
    createdAt: l.created_at,
    updatedAt: l.updated_at,
  }
}

export async function getLeads(filters?: {
  assignedTo?: string
  status?: LeadStatus
  priority?: LeadPriority
  typeId?: string
  search?: string
  page?: number
  limit?: number
}): Promise<{ data: Lead[]; total: number }> {
  const supabase = await createAdminClient()
  const page = filters?.page || 1
  const limit = Math.min(filters?.limit || 20, 100)
  const start = (page - 1) * limit

  let query = supabase
    .from('leads')
    .select('*, assigned_user:users!assigned_to(name), lead_types(name)', { count: 'exact' })
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (filters?.assignedTo) query = query.eq('assigned_to', filters.assignedTo)
  if (filters?.status) query = query.eq('status', filters.status)
  if (filters?.priority) query = query.eq('priority', filters.priority)
  if (filters?.typeId) query = query.eq('type_id', filters.typeId)
  if (filters?.search) {
    const safe = sanitizeSearchTerm(filters.search)
    if (safe.length > 0) {
      query = query.or(`name.ilike.%${safe}%,email.ilike.%${safe}%,phone.ilike.%${safe}%`)
    }
  }

  const { data, error, count } = await query.range(start, start + limit - 1)
  if (error) throw error

  return {
    data: data?.map((l) => mapLeadListRow(l as LeadListRow)) || [],
    total: count || 0,
  }
}

export async function getLeadById(id: string): Promise<Lead | null> {
  const supabase = await createAdminClient()
  
  const { data, error } = await supabase
    .from('leads')
    .select('*, assigned_user:users!assigned_to(name), lead_types(name)')
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }

  return mapLeadListRow(data as LeadListRow)
}

export async function createLead(data: {
  name: string
  email: string
  phone: string
  alternatePhone?: string
  typeId?: string
  customFields?: Record<string, unknown>
  courseInterested?: string
  source?: LeadSource
  priority?: LeadPriority
  notes?: string
  assignedTo?: string
}): Promise<Lead> {
  const supabase = await createAdminClient()
  
  const { data: lead, error } = await supabase
    .from('leads')
    .insert({
      name: data.name,
      email: data.email,
      phone: data.phone,
      alternate_phone: data.alternatePhone,
      type_id: data.typeId,
      custom_fields: data.customFields || {},
      course_interested: data.courseInterested,
      source: data.source || 'organic',
      priority: data.priority || 'warm',
      notes: data.notes,
      assigned_to: data.assignedTo,
    })
    .select()
    .single()

  if (error) throw error

  return getLeadById(lead.id) as Promise<Lead>
}

export async function updateLead(id: string, data: Partial<{
  name: string
  email: string
  phone: string
  alternatePhone: string
  typeId: string
  customFields: Record<string, unknown>
  courseInterested: string
  source: LeadSource
  status: LeadStatus
  priority: LeadPriority
  assignedTo: string
  notes: string
  nextFollowUpAt: string
  lossReason: string
}>): Promise<Lead> {
  const supabase = await createAdminClient()
  
  const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() }
  
  if (data.name !== undefined) updateData.name = data.name
  if (data.email !== undefined) updateData.email = data.email
  if (data.phone !== undefined) updateData.phone = data.phone
  if (data.alternatePhone !== undefined) updateData.alternate_phone = data.alternatePhone
  if (data.typeId !== undefined) updateData.type_id = data.typeId
  if (data.customFields !== undefined) updateData.custom_fields = data.customFields
  if (data.courseInterested !== undefined) updateData.course_interested = data.courseInterested
  if (data.source !== undefined) updateData.source = data.source
  if (data.status !== undefined) updateData.status = data.status
  if (data.priority !== undefined) updateData.priority = data.priority
  if (data.assignedTo !== undefined) updateData.assigned_to = data.assignedTo
  if (data.notes !== undefined) updateData.notes = data.notes
  if (data.nextFollowUpAt !== undefined) updateData.next_follow_up_at = data.nextFollowUpAt
  if (data.lossReason !== undefined) updateData.loss_reason = data.lossReason

  const { error } = await supabase
    .from('leads')
    .update(updateData)
    .eq('id', id)

  if (error) throw error

  return getLeadById(id) as Promise<Lead>
}

export async function claimLead(id: string, userId: string): Promise<Lead> {
  const supabase = await createAdminClient()
  
  const { error } = await supabase
    .from('leads')
    .update({
      assigned_to: userId,
      claimed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) throw error

  await createActivity(id, userId, 'claimed', 'Lead claimed')

  return getLeadById(id) as Promise<Lead>
}

export async function deleteLead(id: string): Promise<void> {
  const supabase = await createAdminClient()
  
  const { error } = await supabase
    .from('leads')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw error
}

export async function getActivities(leadId: string): Promise<LeadActivity[]> {
  const supabase = await createAdminClient()
  
  const { data, error } = await supabase
    .from('lead_activities')
    .select('*, users!created_by(name)')
    .eq('lead_id', leadId)
    .order('created_at', { ascending: false })

  if (error) throw error

  return data?.map((a) => {
    const row = a as LeadActivityRow
    return {
      id: row.id,
      leadId: row.lead_id,
      type: row.type,
      description: row.description,
      createdBy: row.created_by,
      createdByName: row.users?.name,
      metadata: row.metadata ?? undefined,
      createdAt: row.created_at,
    }
  }) || []
}

export async function createActivity(
  leadId: string,
  userId: string,
  type: string,
  description: string,
  metadata?: Record<string, unknown>
): Promise<LeadActivity> {
  const supabase = await createAdminClient()
  
  const { data, error } = await supabase
    .from('lead_activities')
    .insert({
      lead_id: leadId,
      type,
      description,
      created_by: userId,
      metadata,
    })
    .select()
    .single()

  if (error) throw error

  return {
    id: data.id,
    leadId: data.lead_id,
    type: data.type,
    description: data.description,
    createdBy: data.created_by,
    metadata: data.metadata,
    createdAt: data.created_at,
  }
}

export async function getCallRecords(leadId: string): Promise<CallRecord[]> {
  const supabase = await createAdminClient()
  
  const { data, error } = await supabase
    .from('call_records')
    .select('*, users!called_by(name)')
    .eq('lead_id', leadId)
    .order('started_at', { ascending: false })

  if (error) throw error

  return data?.map((c) => {
    const row = c as CallRecordRow
    return {
      id: row.id,
      leadId: row.lead_id,
      calledBy: row.called_by,
      calledByName: row.users?.name,
      phoneNumber: row.phone_number,
      startedAt: row.started_at,
      endedAt: row.ended_at ?? undefined,
      duration: row.duration,
      outcome: row.outcome,
      recordingUrl: row.recording_url ?? undefined,
      remarks: row.remarks ?? undefined,
      followUpRequired: row.follow_up_required,
      followUpDate: row.follow_up_date ?? undefined,
      createdAt: row.created_at,
    }
  }) || []
}