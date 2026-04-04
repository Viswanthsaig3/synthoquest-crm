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

  return data.map((rp: any) => ({
    ...rp.permission,
    createdAt: rp.permission.created_at,
  })) as Permission[]
}

export async function getUserPermissions(userId: string): Promise<string[]> {
  const supabase = await createAdminClient()
  
  // Get user's role
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .single()

  if (userError) throw userError

  // Get role permissions
  const { data: rolePermissions, error: permError } = await supabase
    .from('role_permissions')
    .select(`
      permission:permission_id (
        key
      )
    `)
    .eq('role_id', user.role)

  if (permError) throw permError

  return rolePermissions.map((rp: any) => rp.permission.key)
}

export async function assignPermissionToRole(
  roleId: string,
  permissionId: string,
  createdBy: string
): Promise<void> {
  const supabase = await createAdminClient()
  
  const { error } = await supabase
    .from('role_permissions')
    .insert({
      role_id: roleId,
      permission_id: permissionId,
      created_by: createdBy,
    })

  if (error) throw error
}

export async function removePermissionFromRole(
  roleId: string,
  permissionId: string
): Promise<void> {
  const supabase = await createAdminClient()
  
  const { error } = await supabase
    .from('role_permissions')
    .delete()
    .eq('role_id', roleId)
    .eq('permission_id', permissionId)

  if (error) throw error
}

export async function getPermissionsByResource(resource: string): Promise<Permission[]> {
  const supabase = await createAdminClient()
  
  const { data, error } = await supabase
    .from('permissions')
    .select('*')
    .eq('resource', resource)
    .order('action')

  if (error) throw error
  return data as Permission[]
}

export async function createPermission(permission: {
  key: string
  name: string
  description?: string
  resource: string
  action: string
}): Promise<Permission> {
  const supabase = await createAdminClient()
  
  const { data, error } = await supabase
    .from('permissions')
    .insert(permission)
    .select()
    .single()

  if (error) throw error
  return data as Permission
}
