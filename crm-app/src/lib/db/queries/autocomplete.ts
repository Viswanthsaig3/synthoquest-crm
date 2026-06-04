import { createAdminClient } from '../server-client'

export type AutocompleteFieldType = 'college' | 'qualification' | 'degree' | 'skill' | 'company' | 'occupation'

export interface AutocompleteValue {
  id: string
  fieldType: AutocompleteFieldType
  value: string
  usageCount: number
}

export async function getAutocompleteSuggestions(
  fieldType: AutocompleteFieldType,
  search?: string,
  limit?: number
): Promise<AutocompleteValue[]> {
  const supabase = await createAdminClient()

  let query = supabase
    .from('autocomplete_values')
    .select('id, field_type, value, usage_count')
    .eq('field_type', fieldType)
    .is('deleted_at', null)
    .order('usage_count', { ascending: false })
    .limit(limit || 10)

  if (search) {
    query = query.ilike('value', `${search}%`)
  }

  const { data, error } = await query

  if (error) throw error

  return (data || []).map(row => ({
    id: row.id,
    fieldType: row.field_type as AutocompleteFieldType,
    value: row.value,
    usageCount: row.usage_count,
  }))
}

export async function saveAutocompleteValue(
  fieldType: AutocompleteFieldType,
  value: string,
  createdBy?: string
): Promise<void> {
  if (!value || value.trim().length < 2) return

  const supabase = await createAdminClient()
  const trimmedValue = value.trim()

  // Check if exists
  const { data: existing } = await supabase
    .from('autocomplete_values')
    .select('id, usage_count')
    .eq('field_type', fieldType)
    .eq('value', trimmedValue)
    .is('deleted_at', null)
    .single()

  if (existing) {
    // Increment usage count
    await supabase
      .from('autocomplete_values')
      .update({ 
        usage_count: existing.usage_count + 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', existing.id)
  } else {
    // Insert new
    await supabase
      .from('autocomplete_values')
      .insert({
        field_type: fieldType,
        value: trimmedValue,
        usage_count: 1,
        created_by: createdBy || null,
      })
  }
}

export async function getTopValues(fieldType: AutocompleteFieldType, limit?: number): Promise<string[]> {
  const suggestions = await getAutocompleteSuggestions(fieldType, undefined, limit || 20)
  return suggestions.map(s => s.value)
}