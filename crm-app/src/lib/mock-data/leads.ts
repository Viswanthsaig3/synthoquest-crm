import { Lead, LeadActivity, CallRecord, CustomFieldsData } from '@/types/lead'
import { generateId } from '@/lib/utils'
import { STUDENT_TYPE_ID, INTERN_TYPE_ID } from './lead-types'

const createActivity = (type: LeadActivity['type'], description: string, createdBy: string, metadata?: Record<string, unknown>): LeadActivity => ({
  id: generateId(),
  type,
  description,
  createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
  createdBy,
  metadata,
})

const createCallRecord = (
  leadId: string,
  calledBy: string,
  calledByName: string,
  phoneNumber: string,
  outcome: CallRecord['outcome'],
  duration: number,
  remarks: string,
  daysAgo: number,
  followUpRequired: boolean = false,
  followUpDays: number = 0
): CallRecord => ({
  id: generateId(),
  leadId,
  calledBy,
  calledByName,
  phoneNumber,
  startedAt: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000 - duration * 60 * 1000),
  endedAt: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000),
  duration,
  outcome,
  recordingUrl: outcome === 'answered' ? `/recordings/${generateId()}.mp3` : null,
  remarks,
  followUpRequired,
  followUpDate: followUpRequired ? new Date(Date.now() + followUpDays * 24 * 60 * 60 * 1000) : null,
  createdAt: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000),
})

const today = new Date()
const daysAgo = (days: number) => new Date(Date.now() - days * 24 * 60 * 60 * 1000)

export const mockLeads: Lead[] = [
  // STUDENT LEADS
  {
    id: 'lead_1',
    name: 'Rakesh Agarwal',
    email: 'rakesh.agarwal@email.com',
    phone: '+91 87654 32100',
    typeId: STUDENT_TYPE_ID,
    typeName: 'Student Lead',
    typeStatus: 'new',
    typeSource: 'ads',
    customFields: {
      sf_course: 'Ethical Hacking',
      sf_batch_pref: 'weekend',
      sf_experience: '1-2',
    },
    courseInterested: 'Ethical Hacking',
    source: 'ads',
    status: 'new',
    priority: 'hot',
    assignedTo: null,
    claimedAt: null,
    notes: 'Interested in advanced security courses',
    lastContactedAt: null,
    nextFollowUpAt: null,
    callRecords: [],
    totalCalls: 0,
    lastCallOutcome: null,
    convertedAt: null,
    convertedBy: null,
    lossReason: null,
    createdAt: daysAgo(5),
    updatedAt: daysAgo(5),
    timeline: [
      createActivity('created', 'Lead created from Google Ads', 'usr_1'),
    ],
  },
  {
    id: 'lead_2',
    name: 'Kavitha Raman',
    email: 'kavitha.raman@email.com',
    phone: '+91 87654 32101',
    alternatePhone: '+91 98765 12345',
    typeId: STUDENT_TYPE_ID,
    typeName: 'Student Lead',
    typeStatus: 'follow_up',
    typeSource: 'referral',
    customFields: {
      sf_course: 'Cyber Security Fundamentals',
      sf_batch_pref: 'weekday',
      sf_experience: '0',
    },
    courseInterested: 'Cyber Security Fundamentals',
    source: 'referral',
    status: 'follow_up',
    priority: 'hot',
    assignedTo: 'usr_5',
    claimedAt: daysAgo(6),
    notes: 'Referred by existing student, very interested in weekend batch',
    lastContactedAt: daysAgo(1),
    nextFollowUpAt: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
    callRecords: [
      createCallRecord('lead_2', 'usr_5', 'Rahul Kumar', '+91 87654 32101', 'answered', 8, 'Discussed weekend batch options, very interested. Will confirm by tomorrow.', 0, true, 1),
      createCallRecord('lead_2', 'usr_5', 'Rahul Kumar', '+91 87654 32101', 'answered', 12, 'Initial discussion, comparing with other institutes', 2, false),
    ],
    totalCalls: 2,
    lastCallOutcome: 'answered',
    convertedAt: null,
    convertedBy: null,
    lossReason: null,
    createdAt: daysAgo(6),
    updatedAt: daysAgo(1),
    timeline: [
      createActivity('created', 'Lead created from referral', 'usr_4'),
      createActivity('claimed', 'Claimed by Rahul Kumar', 'usr_5'),
      createActivity('call', 'Called - Discussed course options', 'usr_5'),
      createActivity('call', 'Called - Very interested, follow-up scheduled', 'usr_5'),
    ],
  },
  {
    id: 'lead_3',
    name: 'Suresh Pillai',
    email: 'suresh.pillai@email.com',
    phone: '+91 87654 32102',
    typeId: STUDENT_TYPE_ID,
    typeName: 'Student Lead',
    typeStatus: 'qualified',
    typeSource: 'organic',
    customFields: {
      sf_course: 'Penetration Testing',
      sf_batch_pref: 'weekday',
      sf_experience: '3-5',
      sf_company: 'TechCorp Solutions',
    },
    courseInterested: 'Penetration Testing',
    source: 'organic',
    status: 'qualified',
    priority: 'hot',
    assignedTo: 'usr_5',
    claimedAt: daysAgo(10),
    notes: 'Corporate training requirement, wants batch for 5 people',
    lastContactedAt: daysAgo(2),
    nextFollowUpAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    callRecords: [
      createCallRecord('lead_3', 'usr_5', 'Rahul Kumar', '+91 87654 32102', 'answered', 15, 'Corporate training discussion, needs proposal for 5 employees', 1, true, 3),
      createCallRecord('lead_3', 'usr_5', 'Rahul Kumar', '+91 87654 32102', 'answered', 10, 'Sent curriculum, discussing pricing', 3, false),
    ],
    totalCalls: 2,
    lastCallOutcome: 'answered',
    convertedAt: null,
    convertedBy: null,
    lossReason: null,
    createdAt: daysAgo(10),
    updatedAt: daysAgo(2),
    timeline: [
      createActivity('created', 'Lead created from organic search', 'usr_1'),
      createActivity('claimed', 'Claimed by Rahul Kumar', 'usr_5'),
      createActivity('status_change', 'Status changed to Qualified', 'usr_5', { from: 'follow_up', to: 'qualified' }),
    ],
  },
  {
    id: 'lead_4',
    name: 'Deepika Rao',
    email: 'deepika.rao@email.com',
    phone: '+91 87654 32103',
    typeId: STUDENT_TYPE_ID,
    typeName: 'Student Lead',
    typeStatus: 'new',
    typeSource: 'ads',
    customFields: {
      sf_course: 'Cloud Security',
      sf_batch_pref: 'weekend',
    },
    courseInterested: 'Cloud Security',
    source: 'ads',
    status: 'new',
    priority: 'warm',
    assignedTo: null,
    claimedAt: null,
    notes: 'Looking for weekend batches',
    lastContactedAt: null,
    nextFollowUpAt: null,
    callRecords: [],
    totalCalls: 0,
    lastCallOutcome: null,
    convertedAt: null,
    convertedBy: null,
    lossReason: null,
    createdAt: daysAgo(2),
    updatedAt: daysAgo(2),
    timeline: [
      createActivity('created', 'Lead created from Google Ads', 'usr_1'),
    ],
  },
  {
    id: 'lead_5',
    name: 'Karthik Natarajan',
    email: 'karthik.natarajan@email.com',
    phone: '+91 87654 32104',
    typeId: STUDENT_TYPE_ID,
    typeName: 'Student Lead',
    typeStatus: 'contacted',
    typeSource: 'referral',
    customFields: {
      sf_course: 'CISSP Preparation',
      sf_experience: '5+',
      sf_company: 'Wipro',
    },
    courseInterested: 'CISSP Preparation',
    source: 'referral',
    status: 'contacted',
    priority: 'warm',
    assignedTo: 'usr_6',
    claimedAt: daysAgo(7),
    notes: 'IT professional with 5 years experience',
    lastContactedAt: daysAgo(3),
    nextFollowUpAt: null,
    callRecords: [
      createCallRecord('lead_5', 'usr_6', 'Sneha Reddy', '+91 87654 32104', 'answered', 10, 'Discussed certification goals, sent study plan', 2, false),
    ],
    totalCalls: 1,
    lastCallOutcome: 'answered',
    convertedAt: null,
    convertedBy: null,
    lossReason: null,
    createdAt: daysAgo(7),
    updatedAt: daysAgo(3),
    timeline: [
      createActivity('created', 'Lead created from referral', 'usr_3'),
      createActivity('claimed', 'Claimed by Sneha Reddy', 'usr_6'),
      createActivity('call', 'Discussed certification goals', 'usr_6'),
    ],
  },
  {
    id: 'lead_6',
    name: 'Lakshmi Venkatesh',
    email: 'lakshmi.venkatesh@email.com',
    phone: '+91 87654 32105',
    typeId: STUDENT_TYPE_ID,
    typeName: 'Student Lead',
    typeStatus: 'lost',
    typeSource: 'organic',
    customFields: {
      sf_course: 'Network Security',
      sf_experience: '1-2',
    },
    courseInterested: 'Network Security',
    source: 'organic',
    status: 'lost',
    priority: 'cold',
    assignedTo: 'usr_5',
    claimedAt: daysAgo(12),
    notes: 'Budget constraints',
    lastContactedAt: daysAgo(8),
    nextFollowUpAt: null,
    callRecords: [
      createCallRecord('lead_6', 'usr_5', 'Rahul Kumar', '+91 87654 32105', 'answered', 5, 'Not interested at this time - budget issues', 6, false),
    ],
    totalCalls: 1,
    lastCallOutcome: 'answered',
    convertedAt: null,
    convertedBy: null,
    lossReason: 'Budget constraints - not interested at this time',
    createdAt: daysAgo(12),
    updatedAt: daysAgo(8),
    timeline: [
      createActivity('created', 'Lead created from organic search', 'usr_1'),
      createActivity('claimed', 'Claimed by Rahul Kumar', 'usr_5'),
      createActivity('lost', 'Budget constraints - not interested', 'usr_5'),
    ],
  },
  {
    id: 'lead_7',
    name: 'Meera Krishnan',
    email: 'meera.krishnan@email.com',
    phone: '+91 87654 32107',
    typeId: STUDENT_TYPE_ID,
    typeName: 'Student Lead',
    typeStatus: 'converted',
    typeSource: 'referral',
    customFields: {
      sf_course: 'Ethical Hacking',
      sf_batch_pref: 'weekday',
      sf_experience: '0',
    },
    courseInterested: 'Ethical Hacking',
    source: 'referral',
    status: 'converted',
    priority: 'hot',
    assignedTo: 'usr_6',
    claimedAt: daysAgo(15),
    notes: 'College student, interested in internship',
    lastContactedAt: daysAgo(10),
    nextFollowUpAt: null,
    callRecords: [
      createCallRecord('lead_7', 'usr_6', 'Sneha Reddy', '+91 87654 32107', 'answered', 15, 'Enrollment confirmed', 8, false),
    ],
    totalCalls: 1,
    lastCallOutcome: 'answered',
    convertedAt: daysAgo(10),
    convertedBy: 'usr_6',
    lossReason: null,
    createdAt: daysAgo(15),
    updatedAt: daysAgo(10),
    timeline: [
      createActivity('created', 'Lead created from referral', 'usr_4'),
      createActivity('claimed', 'Claimed by Sneha Reddy', 'usr_6'),
      createActivity('converted', 'Enrolled in Ethical Hacking course', 'usr_6'),
    ],
  },
  
  // INTERN LEADS
  {
    id: 'lead_intern_1',
    name: 'Arjun Menon',
    email: 'arjun.menon@email.com',
    phone: '+91 98765 11111',
    typeId: INTERN_TYPE_ID,
    typeName: 'Intern Lead',
    typeStatus: 'applied',
    typeSource: 'website',
    customFields: {
      if_internship_type: 'paid',
      if_duration: '3_months',
      if_department: 'training',
      if_college: 'VIT University, Vellore',
      if_degree: 'B.Tech Computer Science',
      if_year: '3',
      if_skills: 'Python, Networking, Linux',
      if_resume: 'https://drive.google.com/file/arjun-resume',
      if_linkedin: 'https://linkedin.com/in/arjunmenon',
    },
    courseInterested: undefined,
    source: 'referral',
    status: 'new',
    priority: 'hot',
    assignedTo: 'usr_2',
    claimedAt: daysAgo(1),
    notes: 'Strong technical background, referred by alumni',
    lastContactedAt: null,
    nextFollowUpAt: null,
    callRecords: [],
    totalCalls: 0,
    lastCallOutcome: null,
    convertedAt: null,
    convertedBy: null,
    lossReason: null,
    approvalStatus: 'pending',
    createdAt: daysAgo(1),
    updatedAt: daysAgo(1),
    timeline: [
      createActivity('created', 'Intern application received via website', 'usr_1'),
    ],
  },
  {
    id: 'lead_intern_2',
    name: 'Priya Sundarajan',
    email: 'priya.sundarajan@email.com',
    phone: '+91 98765 22222',
    typeId: INTERN_TYPE_ID,
    typeName: 'Intern Lead',
    typeStatus: 'shortlisted',
    typeSource: 'campus',
    customFields: {
      if_internship_type: 'unpaid',
      if_duration: '2_months',
      if_department: 'marketing',
      if_college: 'IIT Madras',
      if_degree: 'MBA Marketing',
      if_year: '2',
      if_skills: 'Digital Marketing, Content Writing, SEO',
      if_resume: 'https://drive.google.com/file/priya-resume',
      if_linkedin: 'https://linkedin.com/in/priyasundarajan',
      if_portfolio: 'https://priyawrites.com',
    },
    courseInterested: undefined,
    source: 'referral',
    status: 'new',
    priority: 'hot',
    assignedTo: 'usr_2',
    claimedAt: daysAgo(5),
    notes: 'Excellent communication skills, portfolio looks great',
    lastContactedAt: daysAgo(2),
    nextFollowUpAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    callRecords: [
      createCallRecord('lead_intern_2', 'usr_2', 'Priya Patel', '+91 98765 22222', 'answered', 12, 'Discussed role expectations, scheduled technical round', 2, true, 3),
    ],
    totalCalls: 1,
    lastCallOutcome: 'answered',
    convertedAt: null,
    convertedBy: null,
    lossReason: null,
    approvalStatus: 'pending',
    createdAt: daysAgo(5),
    updatedAt: daysAgo(2),
    timeline: [
      createActivity('created', 'Application from campus drive at IIT Madras', 'usr_2'),
      createActivity('status_change', 'Shortlisted for interview', 'usr_2', { from: 'applied', to: 'shortlisted' }),
      createActivity('call', 'Initial screening call completed', 'usr_2'),
    ],
  },
  {
    id: 'lead_intern_3',
    name: 'Vikash Kumar',
    email: 'vikash.kumar@email.com',
    phone: '+91 98765 33333',
    typeId: INTERN_TYPE_ID,
    typeName: 'Intern Lead',
    typeStatus: 'offered',
    typeSource: 'job_portal',
    customFields: {
      if_internship_type: 'paid',
      if_duration: '3_months',
      if_department: 'sales',
      if_college: 'Delhi University',
      if_degree: 'BBA',
      if_year: '3',
      if_skills: 'Communication, MS Office, CRM',
      if_resume: 'https://drive.google.com/file/vikash-resume',
      if_linkedin: 'https://linkedin.com/in/vikashkumar',
    },
    courseInterested: undefined,
    source: 'organic',
    status: 'new',
    priority: 'warm',
    assignedTo: 'usr_2',
    claimedAt: daysAgo(8),
    notes: 'Good sales aptitude, cleared all interview rounds',
    lastContactedAt: daysAgo(1),
    nextFollowUpAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    callRecords: [
      createCallRecord('lead_intern_3', 'usr_2', 'Priya Patel', '+91 98765 33333', 'answered', 10, 'Offer extended, awaiting confirmation', 1, true, 5),
      createCallRecord('lead_intern_3', 'usr_2', 'Priya Patel', '+91 98765 33333', 'answered', 15, 'Second round - role play exercise', 4, false),
      createCallRecord('lead_intern_3', 'usr_2', 'Priya Patel', '+91 98765 33333', 'answered', 8, 'Initial HR screening', 7, false),
    ],
    totalCalls: 3,
    lastCallOutcome: 'answered',
    convertedAt: null,
    convertedBy: null,
    lossReason: null,
    approvalStatus: 'approved',
    approvedBy: 'usr_2',
    approvedAt: daysAgo(3),
    createdAt: daysAgo(10),
    updatedAt: daysAgo(1),
    timeline: [
      createActivity('created', 'Application from LinkedIn job posting', 'usr_1'),
      createActivity('claimed', 'HR Manager took ownership', 'usr_2'),
      createActivity('status_change', 'Moved to Shortlisted', 'usr_2', { from: 'applied', to: 'shortlisted' }),
      createActivity('status_change', 'Offer extended', 'usr_2', { from: 'shortlisted', to: 'offered' }),
    ],
  },
  {
    id: 'lead_intern_4',
    name: 'Sneha Gupta',
    email: 'sneha.gupta@email.com',
    phone: '+91 98765 44444',
    typeId: INTERN_TYPE_ID,
    typeName: 'Intern Lead',
    typeStatus: 'active',
    typeSource: 'website',
    customFields: {
      if_internship_type: 'paid',
      if_duration: '3_months',
      if_department: 'training',
      if_college: 'BITS Pilani',
      if_degree: 'MSc Computer Science',
      if_year: '2',
      if_skills: 'Java, Python, Machine Learning',
      if_resume: 'https://drive.google.com/file/sneha-resume',
      if_linkedin: 'https://linkedin.com/in/snehagupta',
      if_portfolio: 'https://github.com/snehagupta',
    },
    courseInterested: undefined,
    source: 'organic',
    status: 'new',
    priority: 'hot',
    assignedTo: 'usr_2',
    claimedAt: daysAgo(20),
    notes: 'Currently interning, performing well',
    lastContactedAt: daysAgo(5),
    nextFollowUpAt: null,
    callRecords: [],
    totalCalls: 0,
    lastCallOutcome: null,
    convertedAt: daysAgo(15),
    convertedBy: 'usr_2',
    conversionTargetId: 'intern_1',
    lossReason: null,
    approvalStatus: 'approved',
    approvedBy: 'usr_2',
    approvedAt: daysAgo(18),
    createdAt: daysAgo(22),
    updatedAt: daysAgo(15),
    timeline: [
      createActivity('created', 'Intern application via website', 'usr_1'),
      createActivity('claimed', 'HR Manager took ownership', 'usr_2'),
      createActivity('status_change', 'Shortlisted', 'usr_2', { from: 'applied', to: 'shortlisted' }),
      createActivity('status_change', 'Offer accepted', 'usr_2', { from: 'offered', to: 'active' }),
      createActivity('converted', 'Started internship', 'usr_2'),
    ],
  },
  {
    id: 'lead_intern_5',
    name: 'Rahul Sharma',
    email: 'rahul.sharma@email.com',
    phone: '+91 98765 55555',
    typeId: INTERN_TYPE_ID,
    typeName: 'Intern Lead',
    typeStatus: 'rejected',
    typeSource: 'campus',
    customFields: {
      if_internship_type: 'unpaid',
      if_duration: '1_month',
      if_department: 'content',
      if_college: 'Amity University',
      if_degree: 'BJMC',
      if_year: '3',
      if_skills: 'Content Writing, Social Media',
    },
    courseInterested: undefined,
    source: 'referral',
    status: 'new',
    priority: 'cold',
    assignedTo: 'usr_2',
    claimedAt: daysAgo(6),
    notes: 'Profile not matching current requirements',
    lastContactedAt: daysAgo(4),
    nextFollowUpAt: null,
    callRecords: [
      createCallRecord('lead_intern_5', 'usr_2', 'Priya Patel', '+91 98765 55555', 'answered', 5, 'Informed about rejection, encouraged to apply later', 4, false),
    ],
    totalCalls: 1,
    lastCallOutcome: 'answered',
    convertedAt: null,
    convertedBy: null,
    lossReason: null,
    approvalStatus: 'rejected',
    rejectionReason: 'Insufficient portfolio and experience for the role',
    createdAt: daysAgo(7),
    updatedAt: daysAgo(4),
    timeline: [
      createActivity('created', 'Application from campus drive', 'usr_2'),
      createActivity('claimed', 'HR Manager reviewed application', 'usr_2'),
      createActivity('status_change', 'Rejected after screening', 'usr_2', { from: 'applied', to: 'rejected' }),
    ],
  },
  {
    id: 'lead_intern_6',
    name: 'Ananya Iyer',
    email: 'ananya.iyer@email.com',
    phone: '+91 98765 66666',
    typeId: INTERN_TYPE_ID,
    typeName: 'Intern Lead',
    typeStatus: 'applied',
    typeSource: 'referral',
    customFields: {
      if_internship_type: 'paid',
      if_duration: '2_months',
      if_department: 'training',
      if_college: 'NIT Trichy',
      if_degree: 'B.Tech IT',
      if_year: '4',
      if_skills: 'Cyber Security, CTF, Linux',
      if_resume: 'https://drive.google.com/file/ananya-resume',
      if_linkedin: 'https://linkedin.com/in/ananyaiyer',
      if_portfolio: 'https://github.com/ananyaiyer',
    },
    courseInterested: undefined,
    source: 'referral',
    status: 'new',
    priority: 'hot',
    assignedTo: null,
    claimedAt: null,
    notes: 'Referred by current trainer, strong CTF background',
    lastContactedAt: null,
    nextFollowUpAt: null,
    callRecords: [],
    totalCalls: 0,
    lastCallOutcome: null,
    convertedAt: null,
    convertedBy: null,
    lossReason: null,
    approvalStatus: 'pending',
    createdAt: daysAgo(0),
    updatedAt: daysAgo(0),
    timeline: [
      createActivity('created', 'Intern application received via referral', 'usr_4'),
    ],
  },
]

export function getLeadsByStatus(status: string): Lead[] {
  return mockLeads.filter(lead => lead.status === status)
}

export function getLeadsByAssignee(userId: string): Lead[] {
  return mockLeads.filter(lead => lead.assignedTo === userId)
}

export function getLeadById(id: string): Lead | undefined {
  return mockLeads.find(lead => lead.id === id)
}

export function getUnclaimedLeads(): Lead[] {
  return mockLeads.filter(lead => lead.assignedTo === null)
}

export function getLeadsByType(typeId: string): Lead[] {
  return mockLeads.filter(lead => lead.typeId === typeId)
}

export function getStudentLeads(): Lead[] {
  return mockLeads.filter(lead => lead.typeId === STUDENT_TYPE_ID)
}

export function getInternLeads(): Lead[] {
  return mockLeads.filter(lead => lead.typeId === INTERN_TYPE_ID)
}

export function getPendingApprovals(): Lead[] {
  return mockLeads.filter(lead => lead.approvalStatus === 'pending')
}

export function getLeadsWithFollowUpToday(userId: string): Lead[] {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  
  return mockLeads.filter(lead => {
    if (lead.assignedTo !== userId) return false
    if (!lead.nextFollowUpAt) return false
    const followUp = new Date(lead.nextFollowUpAt)
    followUp.setHours(0, 0, 0, 0)
    return followUp.getTime() === today.getTime()
  })
}

export function getLeadsUpcomingFollowUps(userId: string): Lead[] {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  return mockLeads
    .filter(lead => {
      if (lead.assignedTo !== userId) return false
      if (!lead.nextFollowUpAt) return false
      const followUp = new Date(lead.nextFollowUpAt)
      return followUp >= today
    })
    .sort((a, b) => {
      if (!a.nextFollowUpAt || !b.nextFollowUpAt) return 0
      return new Date(a.nextFollowUpAt).getTime() - new Date(b.nextFollowUpAt).getTime()
    })
}

export function getRecentCalls(userId: string, limit: number = 5): CallRecord[] {
  const calls: CallRecord[] = []
  mockLeads.forEach(lead => {
    lead.callRecords.forEach(call => {
      if (call.calledBy === userId) {
        calls.push(call)
      }
    })
  })
  return calls
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit)
}

export function getLeadStatsByType(): Record<string, { total: number; active: number; converted: number }> {
  const stats: Record<string, { total: number; active: number; converted: number }> = {}
  
  mockLeads.forEach(lead => {
    if (!stats[lead.typeId]) {
      stats[lead.typeId] = { total: 0, active: 0, converted: 0 }
    }
    stats[lead.typeId].total++
    if (!['lost', 'rejected', 'dropped'].includes(lead.typeStatus)) {
      stats[lead.typeId].active++
    }
    if (lead.convertedAt) {
      stats[lead.typeId].converted++
    }
  })
  
  return stats
}