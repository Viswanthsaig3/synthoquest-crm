export type InternStatus = 'applied' | 'shortlisted' | 'offered' | 'active' | 'completed' | 'dropped' | 'rejected'
export type InternshipType = 'paid' | 'unpaid'
export type InternDepartment = 'training' | 'sales' | 'marketing' | 'content'

export interface Intern {
  id: string
  name: string
  email: string
  phone: string
  alternatePhone?: string
  
  // Internship Details
  internshipType: InternshipType
  duration: '1_month' | '2_months' | '3_months'
  department: InternDepartment
  
  // Education
  college: string
  degree: string
  year: string
  
  // Skills & Links
  skills: string[]
  resumeUrl?: string
  linkedinUrl?: string
  portfolioUrl?: string
  
  // Dates
  startDate?: Date
  expectedEndDate?: Date
  actualEndDate?: Date
  
  // Status & Workflow
  status: InternStatus
  source: string
  
  // Conversion Info
  leadId?: string
  convertedFrom?: string
  convertedAt?: Date
  convertedBy?: string
  
  // Supervisor
  supervisorId?: string
  supervisorName?: string
  
  // Performance
  performanceRating?: number
  feedback?: string
  
  // Stipend (for paid interns)
  stipend?: number
  
  // Notes
  notes: string
  
  // Approval
  approvalStatus: 'pending' | 'approved' | 'rejected'
  approvedBy?: string
  approvedAt?: Date
  rejectionReason?: string
  
  // Metadata
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