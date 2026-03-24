export type LeadStatus = 'new' | 'contacted' | 'converted' | 'lost'
export type LeadSource = 'ads' | 'referral' | 'organic'

export interface LeadActivity {
  id: string
  type: 'created' | 'contacted' | 'follow_up' | 'converted' | 'lost' | 'note'
  description: string
  createdAt: Date
  createdBy: string
}

export interface Lead {
  id: string
  name: string
  email: string
  phone: string
  courseInterested: string
  source: LeadSource
  status: LeadStatus
  assignedTo: string
  notes: string
  createdAt: Date
  updatedAt: Date
  timeline: LeadActivity[]
}