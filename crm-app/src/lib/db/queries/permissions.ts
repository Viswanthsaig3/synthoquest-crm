import { createAdminClient } from '../server-client'

export interface Permission {
  id: string
  key: string
  name: string
  description: string | null
  resource: string
  action: string
  createdAt: string
}

export async function getAllPermissions(): Promise<Permission[]> {
  const supabase = await createAdminClient()
  
  const { data, error } = await supabase
    .from('permissions')
    .select('*')
    .order('resource', { ascending: true })
    .order('action', { ascending: true })

  if (error) throw error
  return data as Permission[]
}

export async function getPermissionByKey(key: string): Promise<Permission | null> {
  const supabase = await createAdminClient()
  
  const { data, error } = await supabase
    .from('permissions')
    .select('*')
    .eq('key', key)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }

  return data as Permission
}

export async function getPermissionsByRole(roleId: string): Promise<Permission[]> {
  const supabase = await createAdminClient()
  
  const { data, error } = await supabase
    .from('role_permissions')
    .select(`
      permission:permission_id (
        id,
        key,
        name,
        description,
        resource,
        action,
        created_at
      )
    `)
    .eq('role_id', roleId)

  if (error) throw error

  type RpRow = { permission: Permission & { created_at: string } }
  return (data as unknown as RpRow[]).map((rp) => ({
    ...rp.permission,
    createdAt: rp.permission.created_at,
  }))
}

export async function getUserPermissions(userId: string): Promise<string[]> {
  const supabase = await createAdminClient()
  
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .single()

  if (userError) throw userError

  const { data: role, error: roleError } = await supabase
    .from('roles')
    .select('id')
    .eq('key', user.role)
    .is('archived_at', null)
    .single()

  if (roleError) {
    if (roleError.code === 'PGRST116') return []
    throw roleError
  }

  const { data: rolePermissions, error: permError } = await supabase
    .from('role_permissions')
    .select(`
      permission:permission_id (
        key
      )
    `)
    .eq('role_id', role.id)

  if (permError) throw permError

  type KeyRow = { permission: { key: string } }
  return (rolePermissions as unknown as KeyRow[]).map((rp) => rp.permission.key)
}
