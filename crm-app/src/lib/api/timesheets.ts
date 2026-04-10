import { apiFetch } from '@/lib/api/client'
import type {
  Timesheet,
  TimesheetEntry,
  TimesheetApproval,
  TimesheetFilters,
  CreateTimesheetInput,
  UpdateTimesheetInput,
  CreateTimesheetEntryInput,
  UpdateTimesheetEntryInput,
} from '@/types/timesheet'

export async function getTimesheets(filters?: TimesheetFilters): Promise<{ data: Timesheet[] }> {
  const params = new URLSearchParams()

  if (filters?.employeeId) params.append('employeeId', filters.employeeId)
  if (filters?.workDate) params.append('workDate', filters.workDate)
  if (filters?.fromDate) params.append('fromDate', filters.fromDate)
  if (filters?.toDate) params.append('toDate', filters.toDate)
  if (filters?.page) params.append('page', filters.page.toString())
  if (filters?.limit) params.append('limit', filters.limit.toString())

  const query = params.toString()
  return apiFetch(`/timesheets${query ? `?${query}` : ''}`)
}

export async function getTimesheetById(id: string): Promise<{
  data: Timesheet
  approvals: TimesheetApproval[]
}> {
  return apiFetch(`/timesheets/${id}`)
}

export async function createTimesheet(input: CreateTimesheetInput): Promise<{ data: Timesheet }> {
  return apiFetch('/timesheets', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export async function updateTimesheet(
  id: string,
  input: UpdateTimesheetInput
): Promise<{ data: Timesheet }> {
  return apiFetch(`/timesheets/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  })
}

export async function deleteTimesheet(id: string): Promise<{ message: string }> {
  return apiFetch(`/timesheets/${id}`, {
    method: 'DELETE',
  })
}

export async function getTimesheetEntries(
  timesheetId: string
): Promise<{ data: TimesheetEntry[] }> {
  return apiFetch(`/timesheets/${timesheetId}/entries`)
}

export async function createTimesheetEntry(
  timesheetId: string,
  input: CreateTimesheetEntryInput
): Promise<{ data: TimesheetEntry }> {
  return apiFetch(`/timesheets/${timesheetId}/entries`, {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export async function updateTimesheetEntry(
  entryId: string,
  input: UpdateTimesheetEntryInput
): Promise<{ data: TimesheetEntry }> {
  return apiFetch(`/timesheet-entries/${entryId}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  })
}

export async function deleteTimesheetEntry(
  entryId: string
): Promise<{ message: string }> {
  return apiFetch(`/timesheet-entries/${entryId}`, {
    method: 'DELETE',
  })
}

/** Total pending time entries the current approver can act on (entry-level workflow). */
export async function getPendingTimesheetEntriesTotal(): Promise<number> {
  const res = await apiFetch<{
    data: unknown[]
    pagination: { total: number }
  }>('/timesheet-entries/pending?limit=1&page=1')
  return res.pagination?.total ?? 0
}

/** Current user’s entry approval counts (pending / approved / rejected). */
export async function getMyTimesheetEntryStats(): Promise<{
  data: { pending: number; approved: number; rejected: number }
}> {
  return apiFetch('/timesheet-entries/my-stats')
}
