import type { User } from '@/types/user'
import { apiFetch } from '@/lib/api/client'

export interface AssignableUser {
  id: string
  name: string
  email: string
  role: string
  department: string
  avatar: string | null
}

export async function getAssignableUsers(): Promise<{ data: AssignableUser[]; total: number }> {
  return apiFetch('/users/assignable')
}

export async function getEmployees(filters?: {
  department?: string
  role?: string
  status?: string
  search?: string
  page?: number
  limit?: number
}): Promise<{ data: User[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> {
  const params = new URLSearchParams()
  
  if (filters?.department) params.append('department', filters.department)
  if (filters?.role) params.append('role', filters.role)
  if (filters?.status) params.append('status', filters.status)
  if (filters?.search) params.append('search', filters.search)
  if (filters?.page) params.append('page', filters.page.toString())
  if (filters?.limit) params.append('limit', filters.limit.toString())
  
  const query = params.toString()
  return apiFetch(`/employees${query ? `?${query}` : ''}`)
}

export async function getEmployeeById(id: string): Promise<{ data: User }> {
  return apiFetch(`/employees/${id}`)
}

export async function updateEmployee(id: string, data: Partial<{
  name: string
  phone: string
  department: string
  role: string
  status: string
  salary: number
  compensationType: 'paid' | 'unpaid'
  compensationAmount: number | null
  compensationReason: string
  avatar: string
  managedBy: string
}>): Promise<{ data: User }> {
  return apiFetch(`/employees/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function createEmployee(data: {
  email: string
  name: string
  password: string
  phone?: string
  department: string
  role: string
  salary?: number
  compensationType?: 'paid' | 'unpaid'
  compensationAmount?: number | null
  managedBy?: string
}): Promise<{ data: User }> {
  return apiFetch(`/employees`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateEmployeeCompensation(
  id: string,
  data: {
    compensationType: 'paid' | 'unpaid'
    compensationAmount?: number | null
    reason?: string
  }
): Promise<{ data: User }> {
  return apiFetch(`/users/${id}/compensation`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export async function deleteEmployee(id: string): Promise<{ message: string }> {
  return apiFetch(`/employees/${id}`, {
    method: 'DELETE',
  })
}

export async function changePassword(id: string, data: {
  currentPassword?: string
  newPassword: string
}): Promise<{ message: string }> {
  return apiFetch(`/employees/${id}/password`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}
