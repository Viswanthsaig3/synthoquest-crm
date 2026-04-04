import { createAdminClient } from '../server-client'

export async function logRoleChange(data: {
  userId: string
  oldRole: string
  newRole: string
  changedBy: string
  reason?: string
}): Promise<void> {
  const supabase = await createAdminClient()
  
  const { error } = await supabase
    .from('user_roles_audit')
    .insert({
      user_id: data.userId,
      old_role: data.oldRole,
      new_role: data.newRole,
      changed_by: data.changedBy,
      reason: data.reason,
    })

  if (error) {
    console.error('Failed to log role change:', error)
    throw error
  }
}

export async function logPermissionCheck(data: {
  userId: string
  permission: string
  resource?: string
  resourceId?: string
  granted: boolean
  ipAddress?: string
}): Promise<void> {
  const supabase = await createAdminClient()
  
  const { error } = await supabase
    .from('permission_checks_audit')
    .insert({
      user_id: data.userId,
      permission: data.permission,
      resource: data.resource,
      resource_id: data.resourceId,
      granted: data.granted,
      ip_address: data.ipAddress,
    })

  if (error) {
    // Don't throw on audit log failure - it's not critical
    console.error('Failed to log permission check:', error)
  }
}

export async function getRoleHistory(userId: string, limit = 50): Promise<any[]> {
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
        email,
        role
      )
    `)
    .eq('user_id', userId)
    .order('changed_at', { ascending: false })
    .limit(limit)

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

export async function getPermissionDenials(
  userId?: string,
  limit = 100
): Promise<any[]> {
  const supabase = await createAdminClient()
  
  let query = supabase
    .from('permission_checks_audit')
    .select(`
      id,
      permission,
      resource,
      resource_id,
      checked_at,
      ip_address,
      user: user_id (
        id,
        name,
        email,
        role
      )
    `)
    .eq('granted', false)
    .order('checked_at', { ascending: false })
    .limit(limit)

  if (userId) {
    query = query.eq('user_id', userId)
  }

  const { data, error } = await query

  if (error) throw error

  return data.map((audit: any) => ({
    id: audit.id,
    permission: audit.permission,
    resource: audit.resource,
    resourceId: audit.resource_id,
    checkedAt: audit.checked_at,
    ipAddress: audit.ip_address,
    user: audit.user,
  }))
}

export async function cleanupOldPermissionChecks(daysToKeep = 30): Promise<void> {
  const supabase = await createAdminClient()
  
  const { error } = await supabase.rpc('cleanup_old_permission_checks', {
    days_to_keep: daysToKeep,
  })

  if (error && error.code !== '42883') {
    console.error('Failed to cleanup permission checks:', error)
  }
}
