import { createAdminClient } from '../server-client'
import type { LeadType, LeadTypeField, LeadTypeStatus, LeadTypeSource, LeadTypeCode, ConversionTarget } from '@/types/lead-type'

export interface LeadTypeDB {
  id: string
  name: string
  description: string | null
  slug: string
  is_active: boolean
  fields: LeadTypeField[]
  statuses: LeadTypeStatus[]
  sources: LeadTypeSource[]
  icon: string
  color: string
  is_system: boolean
  conversion_target: ConversionTarget
  approval_required: boolean
  approver_roles: string[]
  assign_to_roles: string[]
  created_at: string
  updated_at: string
  created_by: string | null
  deleted_at: string | null
}

function mapLeadType(data: LeadTypeDB): LeadType {
  return {
    id: data.id,
    code: data.slug as LeadTypeCode,
    name: data.name,
    description: data.description || '',
    icon: data.icon || 'FileText',
    color: data.color || '#6b7280',
    isActive: data.is_active,
    isSystem: data.is_system || false,
    fields: data.fields || [],
    statuses: data.statuses || [],
    sources: data.sources || [],
    conversionTarget: data.conversion_target || 'none',
    approvalRequired: data.approval_required || false,
    approverRoles: data.approver_roles || [],
    assignToRoles: data.assign_to_roles || [],
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
    createdBy: data.created_by || '',
  }
}

export async function getLeadTypes(includeInactive = false): Promise<LeadType[]> {
  const supabase = await createAdminClient()
  
  let query = supabase
    .from('lead_types')
    .select('*')
    .is('deleted_at', null)
    .order('name', { ascending: true })

  if (!includeInactive) {
    query = query.eq('is_active', true)
  }

  const { data, error } = await query

  if (error) throw error

  return (data || []).map(mapLeadType)
}

export async function getLeadTypeById(id: string): Promise<LeadType | null> {
  const supabase = await createAdminClient()
  
  const { data, error } = await supabase
    .from('lead_types')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }

  return data ? mapLeadType(data) : null
}

export async function createLeadType(data: {
  name: string
  description?: string
  slug: string
  icon?: string
  color?: string
  fields?: LeadTypeField[]
  statuses?: LeadTypeStatus[]
  sources?: LeadTypeSource[]
  conversionTarget?: ConversionTarget
  approvalRequired?: boolean
  approverRoles?: string[]
  assignToRoles?: string[]
  createdBy?: string
}): Promise<LeadType> {
  const supabase = await createAdminClient()
  
  const { data: leadType, error } = await supabase
    .from('lead_types')
    .insert({
      name: data.name,
      description: data.description || '',
      slug: data.slug,
      icon: data.icon || 'FileText',
      color: data.color || '#6b7280',
      is_active: true,
      is_system: false,
      fields: data.fields || [],
      statuses: data.statuses || [],
      sources: data.sources || [],
      conversion_target: data.conversionTarget || 'none',
      approval_required: data.approvalRequired || false,
      approver_roles: data.approverRoles || [],
      assign_to_roles: data.assignToRoles || [],
      created_by: data.createdBy || null,
    })
    .select()
    .single()

  if (error) throw error

  return mapLeadType(leadType)
}

export async function updateLeadType(id: string, data: Partial<{
  name: string
  description: string
  icon: string
  color: string
  isActive: boolean
  fields: LeadTypeField[]
  statuses: LeadTypeStatus[]
  sources: LeadTypeSource[]
  conversionTarget: ConversionTarget
  approvalRequired: boolean
  approverRoles: string[]
  assignToRoles: string[]
}>): Promise<LeadType> {
  const supabase = await createAdminClient()
  
  const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() }
  
  if (data.name !== undefined) updateData.name = data.name
  if (data.description !== undefined) updateData.description = data.description
  if (data.icon !== undefined) updateData.icon = data.icon
  if (data.color !== undefined) updateData.color = data.color
  if (data.isActive !== undefined) updateData.is_active = data.isActive
  if (data.fields !== undefined) updateData.fields = data.fields
  if (data.statuses !== undefined) updateData.statuses = data.statuses
  if (data.sources !== undefined) updateData.sources = data.sources
  if (data.conversionTarget !== undefined) updateData.conversion_target = data.conversionTarget
  if (data.approvalRequired !== undefined) updateData.approval_required = data.approvalRequired
  if (data.approverRoles !== undefined) updateData.approver_roles = data.approverRoles
  if (data.assignToRoles !== undefined) updateData.assign_to_roles = data.assignToRoles

  const { error } = await supabase
    .from('lead_types')
    .update(updateData)
    .eq('id', id)

  if (error) throw error

  return getLeadTypeById(id) as Promise<LeadType>
}

export async function deleteLeadType(id: string): Promise<void> {
  const supabase = await createAdminClient()
  
  const { error } = await supabase
    .from('lead_types')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw error
}