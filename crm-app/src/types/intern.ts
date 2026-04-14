import type { InternPayment, InternPaymentSummary } from './intern-payment'

export type InternStatus = 'applied' | 'shortlisted' | 'offered' | 'active' | 'completed' | 'dropped' | 'rejected'
export type InternshipType = 'paid' | 'unpaid' | 'paid_by_student'
export type InternDepartment = 'training' | 'sales' | 'marketing' | 'content'
export type InternDuration = 
  | '1_month' | '2_months' | '3_months' | '4_months' | '5_months' | '6_months'
  | '7_months' | '8_months' | '9_months' | '10_months' | '11_months' | '12_months'

export interface Intern {
  id: string
  name: string
  email: string
  phone: string
  managedBy?: string | null
  alternatePhone?: string
  
  internshipType: InternshipType
  duration: InternDuration
  department: InternDepartment
  
  college: string
  degree: string
  year: string
  
  skills: string[]
  resumeUrl?: string
  linkedinUrl?: string
  portfolioUrl?: string
  
  startDate?: Date
  expectedEndDate?: Date
  actualEndDate?: Date
  
  status: InternStatus
  source: string
  
  leadId?: string
  convertedFrom?: string
  convertedAt?: Date
  convertedBy?: string
  
  supervisorId?: string
  supervisorName?: string
  
  performanceRating?: number
  feedback?: string
  
  stipend?: number
  feePaid?: number
  totalFee?: number
  remainingBalance?: number
  compensationType?: 'paid' | 'unpaid' | 'paid_by_student'
  compensationAmount?: number | null
  paymentSummary?: InternPaymentSummary
  payments?: InternPayment[]
  
  notes: string
  
  approvalStatus: 'pending' | 'approved' | 'rejected'
  approvedBy?: string
  approvedAt?: Date
  rejectionReason?: string
  
  createdAt: Date
  updatedAt: Date
}

export interface InternDocument {
  id: string
  internId: string
  name: string
  type: 'resume' | 'id_proof' | 'offer_letter' | 'completion_certificate' | 'other'
  url: string
  uploadedAt: Date
}

export interface InternAttendance {
  id: string
  internId: string
  date: Date
  checkIn?: Date
  checkOut?: Date
  status: 'present' | 'absent' | 'half_day' | 'leave'
  notes?: string
}

export interface InternTask {
  id: string
  internId: string
  title: string
  description: string
  assignedBy: string
  assignedAt: Date
  dueDate: Date
  completedAt?: Date
  status: 'pending' | 'in_progress' | 'completed' | 'overdue'
  feedback?: string
}
