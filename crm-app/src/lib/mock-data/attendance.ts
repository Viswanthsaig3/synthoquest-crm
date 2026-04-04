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
  ...generateAttendance('usr_5', 'Rahul Kumar', 30),
  ...generateAttendance('usr_6', 'Sneha Reddy', 30),
  ...generateAttendance('usr_7', 'Amit Verma', 30),
  ...generateAttendance('usr_8', 'Kavitha Nair', 30),
  ...generateAttendance('usr_9', 'Sanjay Gupta', 30),
  ...generateAttendance('usr_10', 'Divya Krishnan', 30),
  ...generateAttendance('usr_11', 'Manish Joshi', 30),
  ...generateAttendance('usr_12', 'Pooja Menon', 30),
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

export function getAllAttendance(): AttendanceRecord[] {
  return [...mockAttendance].sort((a, b) => b.date.getTime() - a.date.getTime())
}

export function getTeamAttendance(employeeIds: string[]): AttendanceRecord[] {
  return mockAttendance.filter(a => employeeIds.includes(a.employeeId))
}

export function getTodayTeamAttendance(employeeIds: string[]): AttendanceRecord[] {
  const today = new Date().toDateString()
  return mockAttendance.filter(a => 
    employeeIds.includes(a.employeeId) && a.date.toDateString() === today
  )
}

export function getTeamAttendanceSummary(employeeIds: string[]): {
  totalEmployees: number
  present: number
  absent: number
  late: number
  halfDay: number
  notCheckedIn: number
} {
  const today = new Date().toDateString()
  const todayRecords = mockAttendance.filter(a => 
    employeeIds.includes(a.employeeId) && a.date.toDateString() === today
  )
  
  const checkedInIds = new Set(todayRecords.map(r => r.employeeId))
  const notCheckedIn = employeeIds.filter(id => !checkedInIds.has(id)).length
  
  return {
    totalEmployees: employeeIds.length,
    present: todayRecords.filter(r => r.status === 'present').length,
    absent: todayRecords.filter(r => r.status === 'absent').length,
    late: todayRecords.filter(r => r.status === 'late').length,
    halfDay: todayRecords.filter(r => r.status === 'half_day').length,
    notCheckedIn,
  }
}

export function getAttendanceByDateRange(employeeId: string, startDate: Date, endDate: Date): AttendanceRecord[] {
  return mockAttendance.filter(a => {
    if (a.employeeId !== employeeId) return false
    const date = new Date(a.date)
    return date >= startDate && date <= endDate
  })
}