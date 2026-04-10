import { createAdminClient } from '../server-client'
import { sanitizeSearchTerm } from '../sanitize'
import type { CompensationType } from '@/types/user'
import type { Intern, InternStatus, InternshipType } from '@/types/intern'

interface InternProfileRow {
  user_id: string
  alternate_phone: string | null
  internship_type: InternshipType
  duration: '1_month' | '2_months' | '3_months'
  college: string
  degree: string
  academic_year: string
  skills: string[] | null
  resume_url: string | null
  linkedin_url: string | null
  portfolio_url: string | null
  start_date: string | null
  expected_end_date: string | null
  actual_end_date: string | null
  intern_status: InternStatus
  source: string
  lead_id: string | null
  converted_from: string | null
  converted_at: string | null
  converted_by: string | null
  supervisor_id: string | null
  performance_rating: number | null
  feedback: string | null
  stipend: number | null
  notes: string
  approval_status: 'pending' | 'approved' | 'rejected'
  approved_by: string | null
  approved_at: string | null
  rejection_reason: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

interface InternUserRow {
  id: string
  email: string
  name: string
  phone: string | null
  department: string
  managed_by: string | null
  compensation_type: CompensationType | null
  compensation_amount: number | null
  created_at: string
  updated_at: string
  intern_profiles: InternProfileRow[] | InternProfileRow | null
}

function toDate(value?: string | null): Date | undefined {
  return value ? new Date(value) : undefined
}

function normalizeProfile(row: InternUserRow): InternProfileRow {
  const profile = Array.isArray(row.intern_profiles)
    ? row.intern_profiles[0]
    : row.intern_profiles

  return (
    profile || {
      user_id: row.id,
      alternate_phone: null,
      internship_type: 'unpaid',
      duration: '3_months',
      college: '',
      degree: '',
      academic_year: '',
      skills: [],
      resume_url: null,
      linkedin_url: null,
      portfolio_url: null,
      start_date: null,
      expected_end_date: null,
      actual_end_date: null,
      intern_status: 'applied',
      source: 'website',
      lead_id: null,
      converted_from: null,
      converted_at: null,
      converted_by: null,
      supervisor_id: null,
      performance_rating: null,
      feedback: null,
      stipend: null,
      notes: '',
      approval_status: 'pending',
      approved_by: null,
      approved_at: null,
      rejection_reason: null,
      created_at: row.created_at,
      updated_at: row.updated_at,
      deleted_at: null,
    }
  )
}

function mapInternRow(row: InternUserRow): Intern {
  const profile = normalizeProfile(row)

  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone || '',
    managedBy: row.managed_by,
    alternatePhone: profile.alternate_phone || undefined,
    internshipType: profile.internship_type,
    duration: profile.duration,
    department: row.department as Intern['department'],
    college: profile.college,
    degree: profile.degree,
    year: profile.academic_year,
    skills: profile.skills || [],
    resumeUrl: profile.resume_url || undefined,
    linkedinUrl: profile.linkedin_url || undefined,
    portfolioUrl: profile.portfolio_url || undefined,
    startDate: toDate(profile.start_date),
    expectedEndDate: toDate(profile.expected_end_date),
    actualEndDate: toDate(profile.actual_end_date),
    status: profile.intern_status,
    source: profile.source,
    leadId: profile.lead_id || undefined,
    convertedFrom: profile.converted_from || undefined,
    convertedAt: toDate(profile.converted_at),
    convertedBy: profile.converted_by || undefined,
    supervisorId: profile.supervisor_id || undefined,
    performanceRating: profile.performance_rating || undefined,
    feedback: profile.feedback || undefined,
    stipend: profile.stipend || undefined,
    compensationType: row.compensation_type || undefined,
    compensationAmount: row.compensation_amount,
    notes: profile.notes,
    approvalStatus: profile.approval_status,
    approvedBy: profile.approved_by || undefined,
    approvedAt: toDate(profile.approved_at),
    rejectionReason: profile.rejection_reason || undefined,
    createdAt: new Date(profile.created_at || row.created_at),
    updatedAt: new Date(profile.updated_at || row.updated_at),
  }
}

export interface GetInternsFilters {
  search?: string
  department?: string
  status?: InternStatus
  internshipType?: InternshipType
  managedBy?: string
  page?: number
  limit?: number
}

export async function getInterns(filters: GetInternsFilters = {}): Promise<{ data: Intern[]; total: number }> {
  const supabase = await createAdminClient()

  let query = supabase
    .from('users')
    .select(
      `
      id,
      email,
      name,
      phone,
      department,
      managed_by,
      compensation_type,
      compensation_amount,
      created_at,
      updated_at,
      intern_profiles!intern_profiles_user_id_fkey (*)
    `
    )
    .eq('role', 'intern')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (filters.department) {
    query = query.eq('department', filters.department)
  }

  if (filters.managedBy) {
    query = query.eq('managed_by', filters.managedBy)
  }

  if (filters.search) {
    const safe = sanitizeSearchTerm(filters.search)
    if (safe.length > 0) {
      query = query.or(`name.ilike.%${safe}%,email.ilike.%${safe}%`)
    }
  }

  const { data, error } = await query

  if (error) throw error

  const mapped = (data as InternUserRow[])
    .filter((row) => {
      const profile = normalizeProfile(row)
      if (profile.deleted_at) return false
      if (filters.status && profile.intern_status !== filters.status) return false
      if (filters.internshipType && profile.internship_type !== filters.internshipType) return false
      return true
    })
    .map(mapInternRow)

  const total = mapped.length
  const page = filters.page || 1
  const limit = Math.min(filters.limit || 20, 100)
  const start = (page - 1) * limit
  const end = start + limit

  return {
    data: mapped.slice(start, end),
    total,
  }
}

export async function getInternById(id: string): Promise<Intern | null> {
  const supabase = await createAdminClient()

  const { data, error } = await supabase
    .from('users')
    .select(
      `
      id,
      email,
      name,
      phone,
      department,
      managed_by,
      compensation_type,
      compensation_amount,
      created_at,
      updated_at,
      intern_profiles!intern_profiles_user_id_fkey (*)
    `
    )
    .eq('id', id)
    .eq('role', 'intern')
    .is('deleted_at', null)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }

  const row = data as InternUserRow
  const profile = normalizeProfile(row)
  if (profile.deleted_at) return null

  return mapInternRow(row)
}

export async function createIntern(input: {
  email: string
  passwordHash: string
  name: string
  phone?: string
  department: string
  managedBy?: string | null
  compensationType?: CompensationType
  compensationAmount?: number | null
  profile: {
    alternatePhone?: string
    internshipType: InternshipType
    duration: '1_month' | '2_months' | '3_months'
    college: string
    degree: string
    year: string
    skills?: string[]
    resumeUrl?: string
    linkedinUrl?: string
    portfolioUrl?: string
    startDate?: string
    expectedEndDate?: string
    actualEndDate?: string
    status?: InternStatus
    source?: string
    leadId?: string
    convertedFrom?: string
    convertedAt?: string
    convertedBy?: string
    supervisorId?: string
    performanceRating?: number
    feedback?: string
    stipend?: number
    notes?: string
    approvalStatus?: 'pending' | 'approved' | 'rejected'
    approvedBy?: string
    approvedAt?: string
    rejectionReason?: string
  }
}): Promise<Intern> {
  const supabase = await createAdminClient()

  const compensationType: CompensationType =
    input.compensationType || (input.profile.internshipType === 'paid' ? 'paid' : 'unpaid')
  const compensationAmount =
    compensationType === 'paid'
      ? (input.compensationAmount ?? input.profile.stipend ?? null)
      : null

  const { data: userRow, error: userError } = await supabase
    .from('users')
    .insert({
      email: input.email,
      password_hash: input.passwordHash,
      name: input.name,
      phone: input.phone || null,
      role: 'intern',
      department: input.department,
      status: 'active',
      managed_by: input.managedBy || null,
      compensation_type: compensationType,
      compensation_amount: compensationAmount,
      compensation_updated_at: new Date().toISOString(),
      salary: compensationType === 'paid' ? compensationAmount : null,
    })
    .select('id')
    .single()

  if (userError) throw userError

  const userId = userRow.id as string

  const { error: profileError } = await supabase.from('intern_profiles').insert({
    user_id: userId,
    alternate_phone: input.profile.alternatePhone || null,
    internship_type: input.profile.internshipType,
    duration: input.profile.duration,
    college: input.profile.college,
    degree: input.profile.degree,
    academic_year: input.profile.year,
    skills: input.profile.skills || [],
    resume_url: input.profile.resumeUrl || null,
    linkedin_url: input.profile.linkedinUrl || null,
    portfolio_url: input.profile.portfolioUrl || null,
    start_date: input.profile.startDate || null,
    expected_end_date: input.profile.expectedEndDate || null,
    actual_end_date: input.profile.actualEndDate || null,
    intern_status: input.profile.status || 'applied',
    source: input.profile.source || 'website',
    lead_id: input.profile.leadId || null,
    converted_from: input.profile.convertedFrom || null,
    converted_at: input.profile.convertedAt || null,
    converted_by: input.profile.convertedBy || null,
    supervisor_id: input.profile.supervisorId || null,
    performance_rating: input.profile.performanceRating || null,
    feedback: input.profile.feedback || null,
    stipend: input.profile.stipend || null,
    notes: input.profile.notes || '',
    approval_status: input.profile.approvalStatus || 'pending',
    approved_by: input.profile.approvedBy || null,
    approved_at: input.profile.approvedAt || null,
    rejection_reason: input.profile.rejectionReason || null,
  })

  if (profileError) {
    await supabase
      .from('users')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', userId)
    throw profileError
  }

  const created = await getInternById(userId)
  if (!created) throw new Error('Intern not found after creation')

  return created
}

export async function updateIntern(
  id: string,
  patch: {
    name?: string
    phone?: string
    department?: string
    managedBy?: string | null
    profile?: Partial<{
      alternatePhone: string
      internshipType: InternshipType
      duration: '1_month' | '2_months' | '3_months'
      college: string
      degree: string
      year: string
      skills: string[]
      resumeUrl: string
      linkedinUrl: string
      portfolioUrl: string
      startDate: string
      expectedEndDate: string
      actualEndDate: string
      status: InternStatus
      source: string
      leadId: string
      convertedFrom: string
      convertedAt: string
      convertedBy: string
      supervisorId: string
      performanceRating: number
      feedback: string
      stipend: number
      notes: string
      approvalStatus: 'pending' | 'approved' | 'rejected'
      approvedBy: string
      approvedAt: string
      rejectionReason: string
    }>
  }
): Promise<Intern> {
  const supabase = await createAdminClient()
  const nowIso = new Date().toISOString()

  const userUpdates: Record<string, unknown> = {
    updated_at: nowIso,
  }

  if (patch.name !== undefined) userUpdates.name = patch.name
  if (patch.phone !== undefined) userUpdates.phone = patch.phone
  if (patch.department !== undefined) userUpdates.department = patch.department
  if (patch.managedBy !== undefined) userUpdates.managed_by = patch.managedBy

  const hasUserUpdates = Object.keys(userUpdates).length > 1
  if (hasUserUpdates) {
    const { error: userUpdateError } = await supabase.from('users').update(userUpdates).eq('id', id)
    if (userUpdateError) throw userUpdateError
  }

  if (patch.profile) {
    const profileUpdates: Record<string, unknown> = { updated_at: nowIso }

    if (patch.profile.alternatePhone !== undefined) profileUpdates.alternate_phone = patch.profile.alternatePhone
    if (patch.profile.internshipType !== undefined) profileUpdates.internship_type = patch.profile.internshipType
    if (patch.profile.duration !== undefined) profileUpdates.duration = patch.profile.duration
    if (patch.profile.college !== undefined) profileUpdates.college = patch.profile.college
    if (patch.profile.degree !== undefined) profileUpdates.degree = patch.profile.degree
    if (patch.profile.year !== undefined) profileUpdates.academic_year = patch.profile.year
    if (patch.profile.skills !== undefined) profileUpdates.skills = patch.profile.skills
    if (patch.profile.resumeUrl !== undefined) profileUpdates.resume_url = patch.profile.resumeUrl
    if (patch.profile.linkedinUrl !== undefined) profileUpdates.linkedin_url = patch.profile.linkedinUrl
    if (patch.profile.portfolioUrl !== undefined) profileUpdates.portfolio_url = patch.profile.portfolioUrl
    if (patch.profile.startDate !== undefined) profileUpdates.start_date = patch.profile.startDate
    if (patch.profile.expectedEndDate !== undefined) profileUpdates.expected_end_date = patch.profile.expectedEndDate
    if (patch.profile.actualEndDate !== undefined) profileUpdates.actual_end_date = patch.profile.actualEndDate
    if (patch.profile.status !== undefined) profileUpdates.intern_status = patch.profile.status
    if (patch.profile.source !== undefined) profileUpdates.source = patch.profile.source
    if (patch.profile.leadId !== undefined) profileUpdates.lead_id = patch.profile.leadId
    if (patch.profile.convertedFrom !== undefined) profileUpdates.converted_from = patch.profile.convertedFrom
    if (patch.profile.convertedAt !== undefined) profileUpdates.converted_at = patch.profile.convertedAt
    if (patch.profile.convertedBy !== undefined) profileUpdates.converted_by = patch.profile.convertedBy
    if (patch.profile.supervisorId !== undefined) profileUpdates.supervisor_id = patch.profile.supervisorId
    if (patch.profile.performanceRating !== undefined) profileUpdates.performance_rating = patch.profile.performanceRating
    if (patch.profile.feedback !== undefined) profileUpdates.feedback = patch.profile.feedback
    if (patch.profile.stipend !== undefined) profileUpdates.stipend = patch.profile.stipend
    if (patch.profile.notes !== undefined) profileUpdates.notes = patch.profile.notes
    if (patch.profile.approvalStatus !== undefined) profileUpdates.approval_status = patch.profile.approvalStatus
    if (patch.profile.approvedBy !== undefined) profileUpdates.approved_by = patch.profile.approvedBy
    if (patch.profile.approvedAt !== undefined) profileUpdates.approved_at = patch.profile.approvedAt
    if (patch.profile.rejectionReason !== undefined) profileUpdates.rejection_reason = patch.profile.rejectionReason

    const { error: profileUpdateError } = await supabase
      .from('intern_profiles')
      .update(profileUpdates)
      .eq('user_id', id)

    if (profileUpdateError) throw profileUpdateError
  }

  const updated = await getInternById(id)
  if (!updated) throw new Error('Intern not found after update')

  return updated
}

export async function approveIntern(id: string, approvedBy: string): Promise<Intern> {
  return updateIntern(id, {
    profile: {
      approvalStatus: 'approved',
      approvedBy,
      approvedAt: new Date().toISOString(),
      rejectionReason: '',
    },
  })
}

export async function rejectIntern(id: string, rejectedBy: string, reason: string): Promise<Intern> {
  return updateIntern(id, {
    profile: {
      approvalStatus: 'rejected',
      approvedBy: rejectedBy,
      approvedAt: new Date().toISOString(),
      rejectionReason: reason,
    },
  })
}

export async function deleteIntern(id: string): Promise<void> {
  const supabase = await createAdminClient()
  const nowIso = new Date().toISOString()

  const { error: profileError } = await supabase
    .from('intern_profiles')
    .update({ deleted_at: nowIso, updated_at: nowIso })
    .eq('user_id', id)

  if (profileError) throw profileError

  const { error: userError } = await supabase
    .from('users')
    .update({ deleted_at: nowIso })
    .eq('id', id)

  if (userError) throw userError
}
