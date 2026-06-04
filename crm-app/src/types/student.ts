export type StudentStatus = 'active' | 'completed' | 'dropped' | 'on_hold'
export type EnrollmentStatus = 'enrolled' | 'in_progress' | 'completed' | 'dropped'
export type PaymentPlan = 'full' | 'installment'
export type StudentPaymentMethod = 'cash' | 'upi' | 'bank_transfer' | 'card' | 'cheque'
export type StudentType = 'current' | 'passed_out'

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
  college?: string
  graduationYear?: string
  studentType?: StudentType
  status: StudentStatus
  source: string
  leadId?: string
  convertedFrom?: string
  convertedAt?: Date
  convertedBy?: string
  convertedByName?: string
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
  courseCode?: string
  batchId?: string
  batchName?: string
  status: EnrollmentStatus
  enrolledAt: Date
  enrollmentFee: number
  courseFee: number
  discount: number
  totalFee: number
  paidAmount: number
  dueAmount: number
  remainingBalance: number
  paymentPlan: PaymentPlan
  startDate?: Date
  expectedEndDate?: Date
  actualEndDate?: Date
  instructorId?: string
  instructorName?: string
  progress: number
  certificateIssued: boolean
  certificateId?: string
  notes?: string
}

export interface StudentPayment {
  id: string
  enrollmentId: string
  amount: number
  paymentMethod: StudentPaymentMethod
  paymentDate: Date
  receiptNumber?: string
  notes?: string
  collectedBy?: string
  collectedByName?: string
  createdAt: Date
  updatedAt: Date
}

export interface StudentPaymentSummary {
  totalFee: number
  totalPaid: number
  remainingBalance: number
  payments: StudentPayment[]
}

export interface CreateStudentPaymentInput {
  amount: number
  paymentMethod: StudentPaymentMethod
  paymentDate?: string
  receiptNumber?: string
  notes?: string
}

export interface UpdateStudentPaymentInput {
  amount?: number
  paymentMethod?: StudentPaymentMethod
  paymentDate?: string
  receiptNumber?: string
  notes?: string
}

export interface CreateEnrollmentInput {
  studentId: string
  courseId: string
  batchId?: string
  enrollmentFee?: number
  courseFee: number
  discount?: number
  totalFee: number
  paymentPlan?: PaymentPlan
  startDate?: string
  expectedEndDate?: string
  instructorId?: string
  notes?: string
}

export interface CreateStudentInput {
  name: string
  email: string
  phone: string
  alternatePhone?: string
  qualification?: string
  occupation?: string
  company?: string
  experience?: string
  college?: string
  graduationYear?: string
  studentType?: StudentType
  address?: string
  city?: string
  state?: string
  pincode?: string
  source?: string
  notes?: string
  leadId?: string
}

export interface StudentDocument {
  id: string
  studentId: string
  name: string
  type: 'id_proof' | 'address_proof' | 'qualification' | 'photo' | 'other'
  url: string
  uploadedAt: Date
}

export interface GetStudentsFilters {
  search?: string
  status?: string
  course?: string
  source?: string
}