import type { Bug, BugFilters, BugHistoryEntry, BugSeverity, BugStatus } from '@/types/bug'
import { apiFetch } from '@/lib/api/client'

export async function getBugs(filters?: BugFilters): Promise<{
  data: Bug[]
  pagination: { page: number; limit: number; total: number; totalPages: number }
}> {
  const params = new URLSearchParams()

  if (filters?.status) params.append('status', filters.status)
  if (filters?.severity) params.append('severity', filters.severity)
  if (filters?.assignedTo) params.append('assignedTo', filters.assignedTo)
  if (filters?.search) params.append('search', filters.search)
  if (filters?.page) params.append('page', filters.page.toString())
  if (filters?.limit) params.append('limit', filters.limit.toString())

  const query = params.toString()
  return apiFetch(`/bugs${query ? `?${query}` : ''}`)
}

export async function getBugById(id: string): Promise<{ data: Bug }> {
  return apiFetch(`/bugs/${id}`)
}

export async function createBug(data: {
  title: string
  description: string
  severity: BugSeverity
  pageUrl: string
  errorContext?: string
  userAgent?: string
  screenshotUrl?: string
  screenshotFilename?: string
  screenshotSize?: number
}): Promise<{ data: Bug }> {
  return apiFetch('/bugs', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateBugStatus(
  id: string,
  status: BugStatus
): Promise<{ data: Bug }> {
  return apiFetch(`/bugs/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  })
}

export async function assignBug(id: string, assignedTo: string): Promise<{ data: Bug }> {
  return apiFetch(`/bugs/${id}/assign`, {
    method: 'PUT',
    body: JSON.stringify({ assignedTo }),
  })
}

export async function deleteBugScreenshot(id: string): Promise<{ data: Bug }> {
  return apiFetch(`/bugs/${id}/screenshot`, {
    method: 'DELETE',
  })
}

export async function deleteBug(id: string): Promise<{ success: boolean }> {
  return apiFetch(`/bugs/${id}`, {
    method: 'DELETE',
  })
}