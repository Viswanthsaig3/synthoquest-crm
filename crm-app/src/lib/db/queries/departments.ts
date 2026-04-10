import { createAdminClient } from '@/lib/db/client'

export interface DepartmentRow {
  id: string
  key: string
  name: string
  sortOrder: number
  archivedAt: string | null
  createdAt: string
  updatedAt: string
}

function mapRow(row: Record<string, unknown>): DepartmentRow {
  return {
    id: row.id as string,
    key: row.key as string,
    name: row.name as string,
    sortOrder: (row.sort_order as number) ?? 0,
    archivedAt: (row.archived_at as string) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}

export async function listDepartments(options?: { includeArchived?: boolean }): Promise<DepartmentRow[]> {
  const supabase = await createAdminClient()
  let query = supabase.from('departments').select('*').order('sort_order', { ascending: true })

  if (!options?.includeArchived) {
    query = query.is('archived_at', null)
  }

  const { data, error } = await query
  if (error) throw error
  return (data || []).map((r) => mapRow(r as Record<string, unknown>))
}

export async function getDepartmentByKey(key: string): Promise<DepartmentRow | null> {
  const supabase = await createAdminClient()
  const { data, error } = await supabase.from('departments').select('*').eq('key', key).maybeSingle()

  if (error) throw error
  return data ? mapRow(data as Record<string, unknown>) : null
}

export async function createDepartment(input: {
  key: string
  name: string
  sortOrder?: number
}): Promise<DepartmentRow> {
  const supabase = await createAdminClient()
  const { data, error } = await supabase
    .from('departments')
    .insert({
      key: input.key,
      name: input.name,
      sort_order: input.sortOrder ?? 0,
    })
    .select()
    .single()

  if (error) throw error
  return mapRow(data as Record<string, unknown>)
}

export async function updateDepartment(
  key: string,
  patch: Partial<{ name: string; sortOrder: number; archived: boolean }>
): Promise<DepartmentRow> {
  const supabase = await createAdminClient()
  const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (patch.name !== undefined) updateData.name = patch.name
  if (patch.sortOrder !== undefined) updateData.sort_order = patch.sortOrder
  if (patch.archived !== undefined) {
    updateData.archived_at = patch.archived ? new Date().toISOString() : null
  }

  const { error } = await supabase.from('departments').update(updateData).eq('key', key)
  if (error) throw error

  const row = await getDepartmentByKey(key)
  if (!row) throw new Error('Department not found after update')
  return row
}
