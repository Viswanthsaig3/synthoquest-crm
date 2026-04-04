import { createAdminClient } from '../server-client'

export interface Role {
  id: string
  key: string
  name: string
  description: string | null
  isSystem: boolean
  createdAt: string
  updatedAt: string
  permissions?: string[]
}

export async function getAllRoles(): Promise<Role[]> {
  const supabase = await createAdminClient()
  
  const { data, error } = await supabase
    .from('roles')
    .select('*')
    .order('key')

  if (error) throw error

  return data.map((role: any) => ({
    ...role,
    isSystem: role.is_system,
    createdAt: role.created_at,
    updatedAt: role.updated_at,
  })) as Role[]
}

export async function getRoleByKey(key: string): Promise<Role | null> {
  const supabase = await createAdminClient()
  
  const { data, error } = await supabase
    .from('roles')
    .select('*')
    .eq('key', key)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }

  return {
    ...data,
    isSystem: data.is_system,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  } as Role
}

export async function getRoleWithPermissions(key: string): Promise<Role | null> {
  const supabase = await createAdminClient()
  
  // Get role
  const role = await getRoleByKey(key)
  if (!role) return null

  // Get permissions
  const { data: rolePermissions, error } = await supabase
    .from('role_permissions')
    .select(`
      permission:permission_id (
        key
      )
    `)
    .eq('role_id', role.id)

  if (error) throw error

  return {
    ...role,
    permissions: rolePermissions.map((rp: any) => rp.permission.key),
  }
}

export async function updateRolePermissions(
  roleKey: string,
  permissionKeys: string[],
  createdBy: string
): Promise<Role> {
  const supabase = await createAdminClient()
  
  const role = await getRoleByKey(roleKey)
  if (!role) throw new Error('Role not found')

  // Get permission IDs
  const { data: permissions, error: permError } = await supabase
    .from('permissions')
    .select('id, key')
    .in('key', permissionKeys)

  if (permError) throw permError

  if (permissions.length !== permissionKeys.length) {
    throw new Error('Some permissions not found')
  }

  const permissionIds = permissions.map((p: any) => p.id)

  // Start transaction-like operation
  // Delete existing permissions
  const { error: deleteError } = await supabase
    .from('role_permissions')
    .delete()
    .eq('role_id', role.id)

  if (deleteError) throw deleteError

  // Insert new permissions
  const inserts = permissionIds.map((permissionId: string) => ({
    role_id: role.id,
    permission_id: permissionId,
    created_by: createdBy,
  }))

  const { error: insertError } = await supabase
    .from('role_permissions')
    .insert(inserts)

  if (insertError) throw insertError

  // Return updated role
  return (await getRoleWithPermissions(roleKey))!
}

export async function createRole(role: {
  key: string
  name: string
  description?: string
  isSystem?: boolean
}): Promise<Role> {
  const supabase = await createAdminClient()
  
  const { data, error } = await supabase
    .from('roles')
    .insert(role)
    .select()
    .single()

  if (error) throw error

  return {
    ...data,
    isSystem: data.is_system,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  } as Role
}

export async function deleteRole(key: string): Promise<void> {
  const supabase = await createAdminClient()
  
  const role = await getRoleByKey(key)
  if (!role) throw new Error('Role not found')

  if (role.isSystem) {
    throw new Error('Cannot delete system roles')
  }

  const { error } = await supabase
    .from('roles')
    .delete()
    .eq('id', role.id)

  if (error) throw error
}

export async function getUserRole(userId: string): Promise<string> {
  const supabase = await createAdminClient()
  
  const { data, error } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .single()

  if (error) throw error
  return data.role
}

export async function changeUserRole(
  userId: string,
  newRole: string,
  changedBy: string,
  reason?: string
): Promise<void> {
  const supabase = await createAdminClient()
  
  // Get current role
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .single()

  if (userError) throw userError

  const oldRole = user.role

  // Update user role
  const { error: updateError } = await supabase
    .from('users')
    .update({ role: newRole })
    .eq('id', userId)

  if (updateError) throw updateError

  // Create audit log
  const { error: auditError } = await supabase
    .from('user_roles_audit')
    .insert({
      user_id: userId,
      old_role: oldRole,
      new_role: newRole,
      changed_by: changedBy,
      reason: reason,
    })

  if (auditError) throw auditError
}

export async function getUserRoleHistory(userId: string): Promise<any[]> {
  const supabase = await createAdminClient()
  
  const { data, error } = await supabase
    .from('user_roles_audit')
    .select(`
      id,
      old_role,
      new_role,
      reason,
      changed_at,
      changer:changed_by (
        id,
        name,
        email
      )
    `)
    .eq('user_id', userId)
    .order('changed_at', { ascending: false })

  if (error) throw error

  return data.map((audit: any) => ({
    id: audit.id,
    oldRole: audit.old_role,
    newRole: audit.new_role,
    reason: audit.reason,
    changedAt: audit.changed_at,
    changedBy: audit.changer,
  }))
}
