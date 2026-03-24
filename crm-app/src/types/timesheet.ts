export type TimesheetStatus = 'draft' | 'submitted' | 'approved' | 'rejected'

export interface TimesheetEntry {
  id: string
  date: Date
  taskId: string
  taskTitle: string
  hours: number
  description: string
}

export interface Timesheet {
  id: string
  employeeId: string
  employeeName: string
  weekStartDate: Date
  entries: TimesheetEntry[]
  status: TimesheetStatus
  approvedBy: string | null
  approvedAt: Date | null
  totalHours: number
  createdAt: Date
}