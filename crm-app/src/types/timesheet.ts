export type TimesheetStatus = 'submitted' | 'approved' | 'rejected'

export interface TimesheetEntry {
  id: string
  taskId: string
  taskTitle: string
  hours: number
  description: string
}

export interface Timesheet {
  id: string
  employeeId: string
  employeeName: string
  date: Date
  entries: TimesheetEntry[]
  status: TimesheetStatus
  approvedBy: string | null
  approvedAt: Date | null
  rejectionReason?: string | null
  totalHours: number
  createdAt: Date
}

export interface WeekTimesheetData {
  weekStart: Date
  weekEnd: Date
  days: {
    date: Date
    dayName: string
    timesheet?: Timesheet
    hours: number
    status: 'logged' | 'pending' | 'missing'
  }[]
  totalHours: number
}