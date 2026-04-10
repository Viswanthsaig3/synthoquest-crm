import type { Lead, LeadActivity, CallRecord } from '@/lib/db/queries/leads'
import type { LeadType } from '@/types/lead-type'
import { apiFetch } from '@/lib/api/client'

// Lead Types API

export async function getLeadTypes(includeInactive = false): Promise<{ data: LeadType[] }> {
  const query = includeInactive ? '?includeInactive=true' : ''
  return apiFetch(`/lead-types${query}`)
}

export async function getLeadTypeById(id: string): Promise<{ data: LeadType }> {
  return apiFetch(`/lead-types/${id}`)
}

export async function getLeads(filters?: {
  assignedTo?: string
  status?: string
  priority?: string
  typeId?: string
  search?: string
  page?: number
  limit?: number
}): Promise<{ data: Lead[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> {
  const params = new URLSearchParams()
  
  if (filters?.assignedTo) params.append('assignedTo', filters.assignedTo)
  if (filters?.status) params.append('status', filters.status)
  if (filters?.priority) params.append('priority', filters.priority)
  if (filters?.typeId) params.append('typeId', filters.typeId)
  if (filters?.search) params.append('search', filters.search)
  if (filters?.page) params.append('page', filters.page.toString())
  if (filters?.limit) params.append('limit', filters.limit.toString())
  
  const query = params.toString()
  return apiFetch(`/leads${query ? `?${query}` : ''}`)
}

export async function getLeadById(id: string): Promise<{ data: Lead }> {
  return apiFetch(`/leads/${id}`)
}

export async function createLead(data: {
  name: string
  email: string
  phone: string
  alternatePhone?: string
  typeId?: string
  customFields?: Record<string, unknown>
  courseInterested?: string
  source?: string
  priority?: string
  notes?: string
  assignedTo?: string
}): Promise<{ data: Lead }> {
  return apiFetch('/leads', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateLead(id: string, data: Partial<{
  name: string
  email: string
  phone: string
  alternatePhone: string
  typeId: string
  customFields: Record<string, unknown>
  courseInterested: string
  source: string
  status: string
  priority: string
  assignedTo: string | null
  notes: string
  nextFollowUpAt: string
  lossReason: string
}>): Promise<{ data: Lead }> {
  return apiFetch(`/leads/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function deleteLead(id: string): Promise<{ success: boolean }> {
  return apiFetch(`/leads/${id}`, {
    method: 'DELETE',
  })
}

export async function claimLead(id: string): Promise<{ data: Lead }> {
  return apiFetch(`/leads/${id}/claim`, {
    method: 'POST',
  })
}

export async function getLeadActivities(leadId: string): Promise<{ data: LeadActivity[] }> {
  return apiFetch(`/leads/${leadId}/activities`)
}

export async function createLeadActivity(leadId: string, data: {
  type: string
  description: string
  metadata?: Record<string, unknown>
}): Promise<{ data: LeadActivity }> {
  return apiFetch(`/leads/${leadId}/activities`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function getLeadCallRecords(leadId: string): Promise<{ data: CallRecord[] }> {
  return apiFetch(`/leads/${leadId}/calls`)
}

export async function createLeadCallRecord(leadId: string, data: {
  phoneNumber: string
  outcome: string
  duration: number
  remarks?: string
  followUpRequired?: boolean
  followUpDate?: string
}): Promise<{ data: CallRecord }> {
  return apiFetch(`/leads/${leadId}/calls`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}