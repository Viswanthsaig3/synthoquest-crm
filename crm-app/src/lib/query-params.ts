import type { TaskPriority, TaskStatus, TaskType } from '@/lib/db/queries/tasks'
import type { LeadPriority, LeadStatus } from '@/lib/db/queries/leads'
import type { TimeEntryStatus } from '@/types/time-entry'

const TASK_STATUSES: TaskStatus[] = [
  'pending',
  'in_progress',
  'review',
  'completed',
  'cancelled',
  'on_hold',
]
const TASK_PRIORITIES: TaskPriority[] = ['low', 'medium', 'high', 'urgent']
const TASK_TYPES: TaskType[] = ['task', 'bug', 'feature', 'maintenance', 'training', 'meeting']

const LEAD_STATUSES: LeadStatus[] = [
  'new',
  'contacted',
  'follow_up',
  'qualified',
  'converted',
  'lost',
]
const LEAD_PRIORITIES: LeadPriority[] = ['hot', 'warm', 'cold']

const TIME_ENTRY_STATUSES: TimeEntryStatus[] = ['pending', 'approved', 'rejected']

function parseEnum<T extends string>(value: string | null, allowed: readonly T[]): T | undefined {
  if (value === null || value === '') return undefined
  return (allowed as readonly string[]).includes(value) ? (value as T) : undefined
}

export function parseOptionalTaskStatus(param: string | null): TaskStatus | undefined {
  return parseEnum(param, TASK_STATUSES)
}

export function parseOptionalTaskPriority(param: string | null): TaskPriority | undefined {
  return parseEnum(param, TASK_PRIORITIES)
}

export function parseOptionalTaskType(param: string | null): TaskType | undefined {
  return parseEnum(param, TASK_TYPES)
}

export function parseOptionalLeadStatus(param: string | null): LeadStatus | undefined {
  return parseEnum(param, LEAD_STATUSES)
}

export function parseOptionalLeadPriority(param: string | null): LeadPriority | undefined {
  return parseEnum(param, LEAD_PRIORITIES)
}

export function parseOptionalTimeEntryStatus(param: string | null): TimeEntryStatus | undefined {
  return parseEnum(param, TIME_ENTRY_STATUSES)
}
