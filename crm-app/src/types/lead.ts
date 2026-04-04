import { CustomFieldsData } from './lead-type'

export type LeadStatus = 'new' | 'contacted' | 'follow_up' | 'qualified' | 'converted' | 'lost'
export type LeadSource = 'ads' | 'referral' | 'organic'
export type LeadPriority = 'hot' | 'warm' | 'cold'
export type CallOutcome = 'answered' | 'no_answer' | 'busy' | 'voicemail' | 'wrong_number'

export type { CustomFieldsData }

export interface CallRecord {
  id: string
  leadId: string
  calledBy: string
  calledByName: string
  phoneNumber: string
  startedAt: Date
  endedAt: Date | null
  duration: number
  outcome: CallOutcome
  recordingUrl: string | null
  remarks: string
  followUpRequired: boolean
  followUpDate: Date | null
  createdAt: Date
}

export interface LeadActivity {
  id: string
  type: 'created' | 'claimed' | 'contacted' | 'follow_up' | 'converted' | 'lost' | 'note' | 'call' | 'status_change' | 'type_change'
  description: string
  createdAt: Date
  createdBy: string
  metadata?: Record<string, unknown>
}

export interface Lead {
  id: string
  name: string
  email: string
  phone: string
  alternatePhone?: string
  
  // Lead Type System
  typeId: string
  typeName: string
  typeStatus: string
  typeSource: string
  customFields: CustomFieldsData
  
  // Legacy fields (for backwards compatibility with student leads)
  courseInterested?: string
  source: LeadSource
  status: LeadStatus
  priority: LeadPriority
  
  // Assignment & Workflow
  assignedTo: string | null
  claimedAt: Date | null
  notes: string
  lastContactedAt: Date | null
  nextFollowUpAt: Date | null
  
  // Call Tracking
  callRecords: CallRecord[]
  totalCalls: number
  lastCallOutcome: CallOutcome | null
  
  // Conversion
  convertedAt: Date | null
  convertedBy: string | null
  conversionTargetId?: string
  lossReason: string | null
  
  // Approval (for intern, job leads)
  approvalStatus?: 'pending' | 'approved' | 'rejected'
  approvedBy?: string
  approvedAt?: Date
  rejectionReason?: string
  
  // Metadata
  createdAt: Date
  updatedAt: Date
  timeline: LeadActivity[]
}