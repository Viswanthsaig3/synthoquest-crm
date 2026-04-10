/** Stored value is always `active`; entry-level approval_status drives workflow. */
export type TimesheetStatus = 'active'

export type WorkLocation = 'office' | 'remote' | 'client_site'

export type EntryApprovalStatus = 'pending' | 'approved' | 'rejected'

export interface TimesheetEntry {
  id: string
  timesheetId: string
  date: string
  startTime?: string
  endTime?: string
  breakMinutes: number
  totalHours: number
  taskId?: string
  taskTitle?: string
  description?: string
  billable: boolean
  location?: WorkLocation
  createdAt: string
  approvalStatus?: EntryApprovalStatus
  rejectionReason?: string | null
}

export interface Timesheet {
  id: string
  employeeId: string
  employeeName?: string
  workDate: string
  totalHours: number
  regularHours: number
  overtimeHours: number
  status: TimesheetStatus
  submittedAt?: string
  submittedBy?: string
  approvedAt?: string
  approvedBy?: string
  rejectedAt?: string
  rejectedBy?: string
  rejectionReason?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface TimesheetApproval {
  id: string
  timesheetId: string
  approverId: string
  approverName?: string
  action: 'approved' | 'rejected'
  comments?: string
  createdAt: string
}

export interface CreateTimesheetInput {
  employeeId: string
  workDate: string
  notes?: string
}

export interface UpdateTimesheetInput {
  notes?: string
}

export interface CreateTimesheetEntryInput {
  date: string
  startTime?: string
  endTime?: string
  breakMinutes?: number
  totalHours?: number
  taskId?: string
  description?: string
  billable?: boolean
  location?: string
}

export interface UpdateTimesheetEntryInput {
  date?: string
  startTime?: string
  endTime?: string
  breakMinutes?: number
  totalHours?: number
  taskId?: string
  description?: string
  billable?: boolean
  location?: string
}

export interface TimesheetFilters {
  employeeId?: string
  workDate?: string
  fromDate?: string
  toDate?: string
  page?: number
  limit?: number
}

export interface TimesheetSummary {
  totalHours: number
  timesheetDayCount: number
}

export interface DailyTimesheetData {
  date: Date
  timesheet?: Timesheet
  hours: number
  status: 'logged' | 'pending' | 'missing'
}