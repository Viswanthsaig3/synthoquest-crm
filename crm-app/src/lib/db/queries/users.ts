import { createAdminClient } from '../server-client'
import { sanitizeSearchTerm } from '../sanitize'
import type { CompensationType, User } from '@/types/user'

interface UserRow {
  id: string
  email: string
  password_hash: string | null
  name: string
  phone: string | null
  role: string
  department: string
  status: 'active' | 'inactive' | 'suspended'
  avatar: string | null
  salary: number | null
  compensation_type: CompensationType | null
  compensation_amount: number | null
  compensation_updated_at: string | null
  compensation_updated_by: string | null
  managed_by: string | null
  join_date: string
  last_login_at: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

function mapUserRow(row: UserRow): User {
  return {
    id: row.id,
    email: row.email,
    password_hash: row.password_hash || undefined,
    name: row.name,
    phone: row.phone || '',
    role: row.role,
    department: row.department,
    status: row.status,
    avatar: row.avatar,
    salary: row.salary ?? undefined,
    compensationType:
      row.compensation_type ?? ((row.salary ?? 0) > 0 ? 'paid' : 'unpaid'),
    compensationAmount:
      row.compensation_amount ?? (row.salary !== null ? row.salary : null),
    compensationUpdatedAt: row.compensation_updated_at,
    compensationUpdatedBy: row.compensation_updated_by,
    managedBy: row.managed_by,
    joinDate: row.join_date,
    lastLoginAt: row.last_login_at,
  }
}

export async function getUserById(id: string): Promise<User | null> {
  const supabase = await createAdminClient()

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }

  return mapUserRow(data as UserRow)
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const supabase = await createAdminClient()

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .is('deleted_at', null)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }

  return mapUserRow(data as UserRow)
}

export interface GetUsersFilters {
  department?: string
  role?: string
  status?: string
  search?: string
  managedBy?: string
  page?: number
  limit?: number
}

export async function getUsers(filters: GetUsersFilters = {}) {
  const supabase = await createAdminClient()

  const page = filters.page || 1
  const limit = Math.min(filters.limit || 20, 100)
  const start = (page - 1) * limit
  const end = start + limit - 1

  let query = supabase
    .from('users')
    .select('*', { count: 'exact' })
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .range(start, end)

  if (filters.department) {
    query = query.eq('department', filters.department)
  }

  if (filters.role) {
    query = query.eq('role', filters.role)
  }

  if (filters.status) {
    query = query.eq('status', filters.status)
  }

  if (filters.search) {
    const safe = sanitizeSearchTerm(filters.search)
    if (safe.length > 0) {
      query = query.or(`name.ilike.%${safe}%,email.ilike.%${safe}%`)
    }
  }

  if (filters.managedBy) {
    query = query.eq('managed_by', filters.managedBy)
  }

  const { data, error, count } = await query

  if (error) throw error

  return {
    data: (data as UserRow[]).map(mapUserRow),
    pagination: {
      page,
      limit,
      total: count || 0,
    },
  }
}

export async function createUser(
  user: Omit<User, 'id' | 'joinDate' | 'lastLoginAt'> & {
    passwordHash: string
    compensationType?: CompensationType
    compensationAmount?: number | null
  }
): Promise<User> {
  const supabase = await createAdminClient()

  const { passwordHash, managedBy, compensationType, compensationAmount, ...otherFields } = user

  const computedType: CompensationType =
    compensationType ?? ((otherFields.salary ?? 0) > 0 ? 'paid' : 'unpaid')
  const computedAmount =
    compensationAmount !== undefined
      ? compensationAmount
      : computedType === 'paid'
      ? otherFields.salary ?? null
      : null

  const { data, error } = await supabase
    .from('users')
    .insert({
      ...otherFields,
      password_hash: passwordHash,
      managed_by: managedBy,
      join_date: new Date().toISOString(),
      last_login_at: null,
      compensation_type: computedType,
      compensation_amount: computedAmount,
      compensation_updated_at: new Date().toISOString(),
      compensation_updated_by: null,
      salary: computedType === 'paid' ? computedAmount : null,
    })
    .select()
    .single()

  if (error) throw error
  return mapUserRow(data as UserRow)
}

export async function updateUser(id: string, updates: Partial<User>): Promise<User> {
  const supabase = await createAdminClient()

  const payload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }

  if (updates.name !== undefined) payload.name = updates.name
  if (updates.phone !== undefined) payload.phone = updates.phone
  if (updates.department !== undefined) payload.department = updates.department
  if (updates.role !== undefined) payload.role = updates.role
  if (updates.status !== undefined) payload.status = updates.status
  if (updates.avatar !== undefined) payload.avatar = updates.avatar
  if (updates.managedBy !== undefined) payload.managed_by = updates.managedBy

  // Deprecated compatibility path: salary is retained until payroll migration is complete.
  if (updates.salary !== undefined) {
    payload.salary = updates.salary
    payload.compensation_type = updates.salary > 0 ? 'paid' : 'unpaid'
    payload.compensation_amount = updates.salary > 0 ? updates.salary : null
    payload.compensation_updated_at = new Date().toISOString()
  }

  if (updates.compensationType !== undefined) {
    payload.compensation_type = updates.compensationType
    payload.compensation_updated_at = new Date().toISOString()
  }

  if (updates.compensationAmount !== undefined) {
    payload.compensation_amount = updates.compensationAmount
    payload.compensation_updated_at = new Date().toISOString()
  }

  if (updates.compensationUpdatedBy !== undefined) {
    payload.compensation_updated_by = updates.compensationUpdatedBy
  }

  const { data, error } = await supabase.from('users').update(payload).eq('id', id).select().single()

  if (error) throw error
  return mapUserRow(data as UserRow)
}

export async function updateUserPassword(id: string, passwordHash: string): Promise<void> {
  const supabase = await createAdminClient()

  const { error } = await supabase
    .from('users')
    .update({
      password_hash: passwordHash,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) throw error
}

export async function updateLastLogin(id: string): Promise<void> {
  const supabase = await createAdminClient()

  const { error } = await supabase
    .from('users')
    .update({
      last_login_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) throw error
}

export async function updateUserCompensation(input: {
  userId: string
  compensationType: CompensationType
  compensationAmount?: number | null
  changedBy: string
  reason?: string
}): Promise<User> {
  const supabase = await createAdminClient()
  const { data: updatedOk, error } = await supabase.rpc('update_user_compensation_atomic', {
    p_user_id: input.userId,
    p_compensation_type: input.compensationType,
    p_compensation_amount: input.compensationAmount ?? null,
    p_changed_by: input.changedBy,
    p_reason: input.reason ?? null,
  })

  if (error) {
    if (error.message.includes('User not found')) {
      throw new Error('User not found')
    }
    throw error
  }

  if (!updatedOk) {
    throw new Error('Compensation update failed')
  }

  const updated = await getUserById(input.userId)
  if (!updated) {
    throw new Error('User not found after compensation update')
  }

  return updated
}

export async function deleteUser(id: string): Promise<void> {
  const supabase = await createAdminClient()

  const { error } = await supabase
    .from('users')
    .update({
      deleted_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) throw error
}

/** Active users for org-wide attendance / reporting (optional department filter). */
export async function listActiveUserIds(filters?: { department?: string }): Promise<string[]> {
  const supabase = await createAdminClient()
  let q = supabase.from('users').select('id').eq('status', 'active').is('deleted_at', null)
  if (filters?.department) {
    q = q.eq('department', filters.department)
  }
  const { data, error } = await q
  if (error) throw error
  return (data || []).map((r) => r.id as string)
}

/** Manager + direct reports (same scope as timesheets.approve list). */
export async function getManagerScopedUserIds(managerId: string): Promise<string[]> {
  const supabase = await createAdminClient()
  const { data, error } = await supabase
    .from('users')
    .select('id')
    .eq('managed_by', managerId)
    .is('deleted_at', null)

  if (error) throw error
  return [managerId, ...(data || []).map((m) => m.id as string)]
}

/** Get direct reports (users managed_by this user). */
export async function getDirectReports(managerId: string): Promise<User[]> {
  const supabase = await createAdminClient()
  
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('managed_by', managerId)
    .is('deleted_at', null)
    .order('name', { ascending: true })

  if (error) throw error
  return (data as UserRow[]).map(mapUserRow)
}

export interface HierarchyNode {
  id: string
  name: string
  email: string
  role: string
  department: string
  status: 'active' | 'inactive' | 'suspended'
  avatar: string | null
  managedBy: string | null
  reports: HierarchyNode[]
  reportCount: number
}

export async function getHierarchyTree(filters?: { department?: string }): Promise<HierarchyNode[]> {
  const supabase = await createAdminClient()
  
  let query = supabase
    .from('users')
    .select('id, name, email, role, department, status, avatar, managed_by')
    .is('deleted_at', null)
    .order('name', { ascending: true })

  if (filters?.department) {
    query = query.eq('department', filters.department)
  }

  const { data, error } = await query

  if (error) throw error

  const users = data || []
  const userMap = new Map<string, HierarchyNode>()
  const rootNodes: HierarchyNode[] = []

  users.forEach((u: { id: string; name: string; email: string; role: string; department: string; status: string; avatar: string | null; managed_by: string | null }) => {
    userMap.set(u.id, {
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      department: u.department,
      status: u.status as 'active' | 'inactive' | 'suspended',
      avatar: u.avatar,
      managedBy: u.managed_by,
      reports: [],
      reportCount: 0,
    })
  })

  users.forEach((u: { id: string; managed_by: string | null }) => {
    const node = userMap.get(u.id)!
    if (u.managed_by && userMap.has(u.managed_by)) {
      const manager = userMap.get(u.managed_by)!
      manager.reports.push(node)
      manager.reportCount++
    } else {
      rootNodes.push(node)
    }
  })

  const sortReports = (nodes: HierarchyNode[]): HierarchyNode[] => {
    nodes.sort((a, b) => {
      const roleOrder: Record<string, number> = { admin: 0, hr: 1, team_lead: 2, sales_rep: 3, employee: 4, intern: 5 }
      const aOrder = roleOrder[a.role] ?? 6
      const bOrder = roleOrder[b.role] ?? 6
      if (aOrder !== bOrder) return aOrder - bOrder
      return a.name.localeCompare(b.name)
    })
    nodes.forEach((n) => sortReports(n.reports))
    return nodes
  }

  sortReports(rootNodes)

  return rootNodes
}

export async function updateUserManager(userId: string, managerId: string | null): Promise<User> {
  const supabase = await createAdminClient()

  if (managerId === userId) {
    throw new Error('User cannot be their own manager')
  }

  if (managerId) {
    const { data: descendants, error: descError } = await supabase.rpc('get_user_descendants', {
      p_user_id: userId,
    })

    if (descError) throw descError

    if (descendants && (descendants as string[]).includes(managerId)) {
      throw new Error('Cannot assign a subordinate as manager (would create a cycle)')
    }
  }

  const { data, error } = await supabase
    .from('users')
    .update({
      managed_by: managerId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)
    .select()
    .single()

  if (error) throw error
  return mapUserRow(data as UserRow)
}

/** Get all users that can be assigned tasks by this user (hierarchy descendants, same department). */
export async function getAssignableUsers(userId: string): Promise<User[]> {
  const supabase = await createAdminClient()
  
  const { data, error } = await supabase.rpc('get_assignable_users', {
    p_assigner_id: userId,
    p_department: null
  })

  if (error) throw error
  
  return (data || []).map((row: Record<string, unknown>) => ({
    id: row.id as string,
    email: row.email as string,
    name: row.name as string,
    phone: row.phone as string || '',
    role: row.role as string,
    department: row.department as string,
    status: row.status as 'active' | 'inactive' | 'suspended',
    avatar: row.avatar as string | null,
    managedBy: row.managed_by as string | null,
    joinDate: row.join_date as string,
    salary: undefined,
    compensationType: undefined,
    compensationAmount: null,
  }))
}

/** Check if a user can assign task to another user (async, database check). */
export async function canAssignTaskTo(userId: string, targetUserId: string): Promise<boolean> {
  const supabase = await createAdminClient()
  
  const { data, error } = await supabase.rpc('can_assign_task_to_user', {
    p_assigner_id: userId,
    p_assignee_id: targetUserId
  })

  if (error) {
    console.error('Hierarchy check failed:', error)
    return false
  }
  
  return data === true
}
