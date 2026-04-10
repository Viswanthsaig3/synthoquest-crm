import { apiFetch } from '@/lib/api/client'

export interface DepartmentRecord {
  id: string
  key: string
  name: string
  sortOrder: number
  archivedAt?: string | null
}

export async function getDepartments(includeArchived = false): Promise<{ data: DepartmentRecord[] }> {
  const q = includeArchived ? '?includeArchived=true' : ''
  return apiFetch(`/departments${q}`)
}

export async function createDepartment(body: {
  key: string
  name: string
  sortOrder?: number
}): Promise<{ data: DepartmentRecord }> {
  return apiFetch('/departments', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export async function updateDepartment(
  key: string,
  body: Partial<{ name: string; sortOrder: number; archived: boolean }>
): Promise<{ data: DepartmentRecord }> {
  return apiFetch(`/departments/${encodeURIComponent(key)}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
}
