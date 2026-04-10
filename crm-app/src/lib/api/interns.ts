import type { Intern } from '@/types/intern'
import { apiFetch } from '@/lib/api/client'

export async function getInterns(filters?: {
  search?: string
  department?: string
  status?: string
  internshipType?: 'paid' | 'unpaid'
  managedBy?: string
  page?: number
  limit?: number
}): Promise<{ data: Intern[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> {
  const params = new URLSearchParams()

  if (filters?.search) params.append('search', filters.search)
  if (filters?.department) params.append('department', filters.department)
  if (filters?.status) params.append('status', filters.status)
  if (filters?.internshipType) params.append('internshipType', filters.internshipType)
  if (filters?.managedBy) params.append('managedBy', filters.managedBy)
  if (filters?.page) params.append('page', filters.page.toString())
  if (filters?.limit) params.append('limit', filters.limit.toString())

  const query = params.toString()
  return apiFetch(`/interns${query ? `?${query}` : ''}`)
}

export async function getInternById(id: string): Promise<{ data: Intern }> {
  return apiFetch(`/interns/${id}`)
}

export async function createIntern(data: {
  email: string
  password: string
  name: string
  phone?: string
  department: string
  managedBy?: string | null
  compensationType?: 'paid' | 'unpaid'
  compensationAmount?: number | null
  profile: {
    internshipType: 'paid' | 'unpaid'
    duration: '1_month' | '2_months' | '3_months'
    college: string
    degree: string
    year: string
    skills?: string[]
    resumeUrl?: string
    linkedinUrl?: string
    portfolioUrl?: string
    startDate?: string
    expectedEndDate?: string
    status?: 'applied' | 'shortlisted' | 'offered' | 'active' | 'completed' | 'dropped' | 'rejected'
    source?: string
    stipend?: number
    notes?: string
    approvalStatus?: 'pending' | 'approved' | 'rejected'
  }
}): Promise<{ data: Intern }> {
  return apiFetch('/interns', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateIntern(
  id: string,
  data: Partial<{
    name: string
    phone: string
    department: string
    managedBy: string | null
    compensationType: 'paid' | 'unpaid'
    compensationAmount: number | null
    compensationReason: string
    profile: Record<string, unknown>
  }>
): Promise<{ data: Intern }> {
  return apiFetch(`/interns/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function approveIntern(id: string): Promise<{ data: Intern; message: string }> {
  return apiFetch(`/interns/${id}/approve`, {
    method: 'POST',
  })
}

export async function rejectIntern(id: string, reason: string): Promise<{ data: Intern; message: string }> {
  return apiFetch(`/interns/${id}/reject`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  })
}

export async function convertInternToEmployee(
  id: string,
  data: {
    position: string
    department: string
    salary?: number
    startDate?: string
    notes?: string
  }
): Promise<{ data: Intern; message: string }> {
  return apiFetch(`/interns/${id}/convert-to-employee`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}
