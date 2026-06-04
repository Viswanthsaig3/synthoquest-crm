import { apiFetch } from '@/lib/api/client'
import type { AutocompleteFieldType } from '@/lib/db/queries/autocomplete'

export async function getAutocompleteSuggestions(fieldType: AutocompleteFieldType, search?: string) {
  const params = new URLSearchParams()
  params.append('fieldType', fieldType)
  if (search) params.append('search', search)
  
  return apiFetch<{ data: { id: string; fieldType: string; value: string; usageCount: number }[] }>(
    `/autocomplete?${params.toString()}`
  )
}

export async function saveAutocompleteValue(fieldType: AutocompleteFieldType, value: string) {
  return apiFetch<{ message: string }>(`/autocomplete`, {
    method: 'POST',
    body: JSON.stringify({ fieldType, value }),
  })
}