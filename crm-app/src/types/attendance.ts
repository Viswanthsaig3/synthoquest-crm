export type AttendanceStatus = 'present' | 'absent' | 'late' | 'half_day'

export interface AttendanceRecord {
  id: string
  employeeId: string
  employeeName: string
  date: Date
  checkIn: Date | null
  checkOut: Date | null
  status: AttendanceStatus
  hoursWorked: number
  notes: string
}

export interface AttendanceSummary {
  totalDays: number
  present: number
  absent: number
  late: number
  halfDay: number
  averageHours: number
}