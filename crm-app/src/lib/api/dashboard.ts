import { apiFetch } from '@/lib/api/client'
import type { User } from '@/types/user'
import type { Task } from '@/lib/db/queries/tasks'
import type { Timesheet } from '@/lib/db/queries/timesheets'

export type DashboardSummary = {
  employees: User[]
  tasks: Task[]
  timesheets: Timesheet[]
}

export async function getDashboardSummary(): Promise<{ data: DashboardSummary }> {
  return apiFetch('/dashboard/summary')
}
