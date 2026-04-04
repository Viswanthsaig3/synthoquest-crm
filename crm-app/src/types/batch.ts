export type BatchStatus = 'upcoming' | 'ongoing' | 'completed' | 'cancelled'
export type BatchMode = 'online' | 'offline' | 'hybrid'
export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'

export interface BatchSchedule {
  day: DayOfWeek
  startTime: string
  endTime: string
}

export interface Batch {
  id: string
  name: string
  courseId: string
  courseName: string
  instructorId: string
  instructorName: string
  mode: BatchMode
  status: BatchStatus
  startDate: Date
  endDate: Date
  schedule: BatchSchedule[]
  maxCapacity: number
  enrolledCount: number
  availableSeats: number
  venue?: string
  onlineLink?: string
  fee: number
  discount: number
  description: string
  syllabus?: string[]
  prerequisites?: string[]
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

export interface BatchStudent {
  id: string
  batchId: string
  studentId: string
  studentName: string
  studentEmail: string
  studentPhone: string
  enrolledAt: Date
  status: 'active' | 'completed' | 'dropped'
  progress: number
  attendance: number
}