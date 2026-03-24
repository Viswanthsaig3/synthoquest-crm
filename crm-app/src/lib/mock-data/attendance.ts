import { AttendanceRecord, AttendanceSummary } from '@/types/attendance'
import { generateId } from '@/lib/utils'

const generateAttendance = (employeeId: string, employeeName: string, days: number): AttendanceRecord[] => {
  const records: AttendanceRecord[] = []
  const today = new Date()
  
  for (let i = 0; i < days; i++) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    
    if (date.getDay() === 0 || date.getDay() === 6) continue
    
    const isPresent = Math.random() > 0.1
    const isLate = isPresent && Math.random() > 0.7
    
    let checkIn: Date | null = null
    let checkOut: Date | null = null
    let hoursWorked = 0
    let status: AttendanceRecord['status'] = 'absent'
    
    if (isPresent) {
      checkIn = new Date(date)
      checkIn.setHours(9, isLate ? 30 + Math.floor(Math.random() * 30) : Math.floor(Math.random() * 15), 0)
      
      checkOut = new Date(date)
      checkOut.setHours(18, Math.floor(Math.random() * 30), 0)
      
      hoursWorked = (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60)
      
      status = isLate ? 'late' : 'present'
      if (Math.random() > 0.95) {
        status = 'half_day'
        hoursWorked = hoursWorked / 2
      }
    }
    
    records.push({
      id: generateId(),
      employeeId,
      employeeName,
      date,
      checkIn,
      checkOut,
      status,
      hoursWorked: Math.round(hoursWorked * 10) / 10,
      notes: '',
    })
  }
  
  return records
}

export const mockAttendance: AttendanceRecord[] = [
  ...generateAttendance('usr_5', 'James Wilson', 30),
  ...generateAttendance('usr_6', 'Lisa Anderson', 30),
  ...generateAttendance('usr_7', 'David Brown', 30),
  ...generateAttendance('usr_8', 'Jennifer Taylor', 30),
  ...generateAttendance('usr_9', 'Robert Martinez', 30),
  ...generateAttendance('usr_10', 'Amanda White', 30),
  ...generateAttendance('usr_11', 'Chris Thompson', 30),
  ...generateAttendance('usr_12', 'Nicole Garcia', 30),
]

export function getAttendanceByEmployee(employeeId: string): AttendanceRecord[] {
  return mockAttendance.filter(a => a.employeeId === employeeId)
}

export function getAttendanceByDate(date: Date): AttendanceRecord[] {
  const dateStr = date.toDateString()
  return mockAttendance.filter(a => a.date.toDateString() === dateStr)
}

export function getAttendanceSummary(employeeId: string): AttendanceSummary {
  const records = getAttendanceByEmployee(employeeId)
  const totalDays = records.length
  
  return {
    totalDays,
    present: records.filter(r => r.status === 'present').length,
    absent: records.filter(r => r.status === 'absent').length,
    late: records.filter(r => r.status === 'late').length,
    halfDay: records.filter(r => r.status === 'half_day').length,
    averageHours: records.reduce((sum, r) => sum + r.hoursWorked, 0) / totalDays,
  }
}