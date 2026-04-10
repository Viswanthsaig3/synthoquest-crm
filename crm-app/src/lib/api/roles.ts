import { apiFetch } from '@/lib/api/client'

export interface RoleRecord {
  key: string
  name: string
  isSystem?: boolean
}

export async function getRoles(): Promise<{ data: RoleRecord[] }> {
  return apiFetch('/roles')
}
