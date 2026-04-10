import { createAdminClient } from '../server-client'

export interface Role {
  id: string
  key: string
  name: string
  description: string | null
  isSystem: boolean
  archivedAt?: string | null
  createdAt: string
  updatedAt: string
  permissions?: string[]
}

export async function getAllRoles(): Promise<Role[]> {
  const supabase = await createAdminClient()
  
  const { data, error } = await supabase
    .from('roles')
    .select('*')
    .is('archived_at', null)
    .order('key')

  if (error) throw error

  return data.map((role: {
    id: string
    key: string
    name: string
    description: string | null
    is_system: boolean
    archived_at?: string | null
    created_at: string
    updated_at: string
  }) => ({
    id: role.id,
    key: role.key,
    name: role.name,
    description: role.description,
    isSystem: role.is_system,
    archivedAt: role.archived_at,
    createdAt: role.created_at,
    updatedAt: role.updated_at,
  }))
}

export async function getRoleByKey(key: string): Promise<Role | null> {
  const supabase = await createAdminClient()
  
  const { data, error } = await supabase
    .from('roles')
    .select('*')
    .eq('key', key)
    .is('archived_at', null)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }

  return {
    ...data,
    isSystem: data.is_system,
    archivedAt: data.archived_at,
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
    permissions: (rolePermissions as unknown as { permission: { key: string } }[]).map(
      (rp) => rp.permission.key
    ),
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
  if (role.key === 'admin') {
    throw new Error('Cannot modify admin permissions')
  }

  // Get permission IDs
  const { data: permissions, error: permError } = await supabase
    .from('permissions')
    .select('id, key')
    .in('key', permissionKeys)

  if (permError) throw permError

  if (permissions.length !== permissionKeys.length) {
    throw new Error('Some permissions not found')
  }

  const permissionIds = permissions.map((p: { id: string }) => p.id)

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

  if (inserts.length > 0) {
    const { error: insertError } = await supabase
      .from('role_permissions')
      .insert(inserts)

    if (insertError) throw insertError
  }

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
    .insert({
      key: role.key,
      name: role.name,
      description: role.description ?? null,
      is_system: role.isSystem ?? false,
    })
    .select()
    .single()

  if (error) throw error

  return {
    ...data,
    isSystem: data.is_system,
    archivedAt: data.archived_at,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  } as Role
}

export async function updateRole(
  key: string,
  updates: {
    name?: string
    description?: string | null
  }
): Promise<Role> {
  const supabase = await createAdminClient()
  const role = await getRoleByKey(key)
  if (!role) throw new Error('Role not found')
  if (role.key === 'admin') throw new Error('Cannot modify admin role')

  const { data, error } = await supabase
    .from('roles')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', role.id)
    .select('*')
    .single()

  if (error) throw error

  return {
    ...data,
    isSystem: data.is_system,
    archivedAt: data.archived_at,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  } as Role
}

export async function archiveRole(key: string): Promise<void> {
  const supabase = await createAdminClient()
  
  const role = await getRoleByKey(key)
  if (!role) throw new Error('Role not found')

  if (role.key === 'admin') {
    throw new Error('Cannot archive admin role')
  }

  const { error } = await supabase
    .from('roles')
    .update({
      archived_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
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

export interface UserRoleAuditEntry {
  id: string
  oldRole: string
  newRole: string
  reason: string | null
  changedAt: string
  changedBy: { id: string; name: string; email: string } | null
}

export async function getUserRoleHistory(userId: string): Promise<UserRoleAuditEntry[]> {
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

  type AuditRow = {
    id: string
    old_role: string
    new_role: string
    reason: string | null
    changed_at: string
    changer: { id: string; name: string; email: string } | null
  }
  return (data as unknown as AuditRow[]).map((audit) => ({
    id: audit.id,
    oldRole: audit.old_role,
    newRole: audit.new_role,
    reason: audit.reason,
    changedAt: audit.changed_at,
    changedBy: audit.changer,
  }))
}
