import { createAdminClient } from '../server-client'
import type { User } from '@/types/user'

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

  return data as User
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

  return data as User
}

export interface GetUsersFilters {
  department?: string
  role?: string
  status?: string
  search?: string
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
    query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`)
  }

  const { data, error } = await query

  if (error) throw error

  return {
    data: data as User[],
    pagination: {
      page,
      limit,
      total: data ? 0 : 0,
    },
  }
}

export async function createUser(user: Omit<User, 'id' | 'joinDate' | 'lastLoginAt'> & { passwordHash: string }): Promise<User> {
  const supabase = await createAdminClient()
  
  const { data, error } = await supabase
    .from('users')
    .insert({
      ...user,
      password_hash: user.passwordHash,
      join_date: new Date().toISOString(),
      last_login_at: null,
    })
    .select()
    .single()

  if (error) throw error
  return data as User
}

export async function updateUser(id: string, updates: Partial<User>): Promise<User> {
  const supabase = await createAdminClient()
  
  const { data, error } = await supabase
    .from('users')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as User
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
