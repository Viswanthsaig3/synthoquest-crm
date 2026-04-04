export type StudentStatus = 'active' | 'completed' | 'dropped' | 'on_hold'
export type EnrollmentStatus = 'enrolled' | 'in_progress' | 'completed' | 'dropped'

export interface Student {
  id: string
  name: string
  email: string
  phone: string
  alternatePhone?: string
  address?: string
  city?: string
  state?: string
  pincode?: string
  qualification?: string
  occupation?: string
  company?: string
  experience?: string
  status: StudentStatus
  source: string
  leadId?: string
  convertedFrom?: string
  convertedAt: Date
  convertedBy: string
  notes: string
  enrollments: Enrollment[]
  totalPaid: number
  totalDue: number
  createdAt: Date
  updatedAt: Date
}

export interface Enrollment {
  id: string
  studentId: string
  courseId: string
  courseName: string
  batchId: string
  batchName: string
  status: EnrollmentStatus
  enrolledAt: Date
  enrollmentFee: number
  courseFee: number
  discount: number
  totalFee: number
  paidAmount: number
  dueAmount: number
  paymentPlan: 'full' | 'installment'
  startDate: Date
  expectedEndDate: Date
  completedDate?: Date
  instructor?: string
  progress: number
  certificateIssued: boolean
  certificateId?: string
}

export interface StudentDocument {
  id: string
  studentId: string
  name: string
  type: 'id_proof' | 'address_proof' | 'qualification' | 'photo' | 'other'
  url: string
  uploadedAt: Date
}