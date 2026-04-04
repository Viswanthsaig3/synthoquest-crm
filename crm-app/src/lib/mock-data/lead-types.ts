import { LeadType, LeadTypeField, LeadTypeStatus, LeadTypeSource } from '@/types/lead-type'
import { generateId } from '@/lib/utils'

const STUDENT_TYPE_ID = 'lt_student'
const INTERN_TYPE_ID = 'lt_intern'

const studentFields: LeadTypeField[] = [
  {
    id: 'sf_course',
    name: 'courseInterested',
    label: 'Course Interested',
    type: 'select',
    placeholder: 'Select course',
    required: true,
    options: [
      { value: 'Cyber Security Fundamentals', label: 'Cyber Security Fundamentals' },
      { value: 'Ethical Hacking', label: 'Ethical Hacking' },
      { value: 'Penetration Testing', label: 'Penetration Testing' },
      { value: 'Network Security', label: 'Network Security' },
      { value: 'Cloud Security', label: 'Cloud Security' },
      { value: 'Incident Response', label: 'Incident Response' },
      { value: 'Security Analytics', label: 'Security Analytics' },
      { value: 'CompTIA Security+', label: 'CompTIA Security+' },
      { value: 'CISSP Preparation', label: 'CISSP Preparation' },
      { value: 'CEH Certification', label: 'CEH Certification' },
    ],
    order: 1,
  },
  {
    id: 'sf_batch_pref',
    name: 'batchPreference',
    label: 'Batch Preference',
    type: 'select',
    placeholder: 'Select preference',
    required: false,
    options: [
      { value: 'weekday', label: 'Weekday Batch' },
      { value: 'weekend', label: 'Weekend Batch' },
      { value: 'online', label: 'Online Only' },
      { value: 'flexible', label: 'Flexible' },
    ],
    order: 2,
  },
  {
    id: 'sf_experience',
    name: 'experience',
    label: 'Years of Experience',
    type: 'select',
    placeholder: 'Select experience',
    required: false,
    options: [
      { value: '0', label: 'Fresher' },
      { value: '1-2', label: '1-2 years' },
      { value: '3-5', label: '3-5 years' },
      { value: '5+', label: '5+ years' },
    ],
    order: 3,
  },
  {
    id: 'sf_company',
    name: 'currentCompany',
    label: 'Current Company',
    type: 'text',
    placeholder: 'Enter current company',
    required: false,
    order: 4,
  },
  {
    id: 'sf_objective',
    name: 'learningObjective',
    label: 'Learning Objective',
    type: 'textarea',
    placeholder: 'What do you want to achieve from this course?',
    required: false,
    order: 5,
  },
]

const studentStatuses: LeadTypeStatus[] = [
  { id: 'ss_new', value: 'new', label: 'New', color: 'blue', order: 1, isInitial: true },
  { id: 'ss_contacted', value: 'contacted', label: 'Contacted', color: 'purple', order: 2, allowedTransitions: ['follow_up', 'qualified', 'lost'] },
  { id: 'ss_followup', value: 'follow_up', label: 'Follow Up', color: 'orange', order: 3, allowedTransitions: ['qualified', 'lost'] },
  { id: 'ss_qualified', value: 'qualified', label: 'Qualified', color: 'cyan', order: 4, allowedTransitions: ['converted', 'lost'] },
  { id: 'ss_converted', value: 'converted', label: 'Converted', color: 'green', order: 5, isFinal: true },
  { id: 'ss_lost', value: 'lost', label: 'Lost', color: 'red', order: 6, isFinal: true },
]

const studentSources: LeadTypeSource[] = [
  { id: 'ss_ads', value: 'ads', label: 'Google Ads', description: 'Paid advertising campaigns' },
  { id: 'ss_referral', value: 'referral', label: 'Referral', description: 'Referred by existing student or employee' },
  { id: 'ss_organic', value: 'organic', label: 'Organic Search', description: 'Found through search engines' },
  { id: 'ss_social', value: 'social', label: 'Social Media', description: 'From social media platforms' },
  { id: 'ss_event', value: 'event', label: 'Event/Webinar', description: 'Attended an event or webinar' },
]

const internFields: LeadTypeField[] = [
  {
    id: 'if_internship_type',
    name: 'internshipType',
    label: 'Internship Type',
    type: 'select',
    placeholder: 'Select type',
    required: true,
    options: [
      { value: 'paid', label: 'Paid Internship' },
      { value: 'unpaid', label: 'Unpaid Internship' },
    ],
    order: 1,
  },
  {
    id: 'if_duration',
    name: 'duration',
    label: 'Preferred Duration',
    type: 'select',
    placeholder: 'Select duration',
    required: true,
    options: [
      { value: '1_month', label: '1 Month' },
      { value: '2_months', label: '2 Months' },
      { value: '3_months', label: '3 Months' },
    ],
    order: 2,
  },
  {
    id: 'if_department',
    name: 'department',
    label: 'Department Interest',
    type: 'select',
    placeholder: 'Select department',
    required: true,
    options: [
      { value: 'training', label: 'Training' },
      { value: 'sales', label: 'Sales' },
      { value: 'marketing', label: 'Marketing' },
      { value: 'content', label: 'Content Development' },
    ],
    order: 3,
  },
  {
    id: 'if_college',
    name: 'college',
    label: 'College/University',
    type: 'text',
    placeholder: 'Enter college name',
    required: true,
    order: 4,
  },
  {
    id: 'if_degree',
    name: 'degree',
    label: 'Degree/Course',
    type: 'text',
    placeholder: 'e.g., B.Tech Computer Science',
    required: true,
    order: 5,
  },
  {
    id: 'if_year',
    name: 'year',
    label: 'Current Year',
    type: 'select',
    placeholder: 'Select year',
    required: true,
    options: [
      { value: '1', label: '1st Year' },
      { value: '2', label: '2nd Year' },
      { value: '3', label: '3rd Year' },
      { value: '4', label: '4th Year' },
      { value: 'passed', label: 'Passed Out' },
    ],
    order: 6,
  },
  {
    id: 'if_skills',
    name: 'skills',
    label: 'Skills',
    type: 'text',
    placeholder: 'e.g., Python, Networking, Linux',
    required: false,
    order: 7,
  },
  {
    id: 'if_resume',
    name: 'resumeUrl',
    label: 'Resume URL',
    type: 'url',
    placeholder: 'https://drive.google.com/...',
    required: false,
    order: 8,
  },
  {
    id: 'if_linkedin',
    name: 'linkedinUrl',
    label: 'LinkedIn Profile',
    type: 'url',
    placeholder: 'https://linkedin.com/in/...',
    required: false,
    order: 9,
  },
  {
    id: 'if_portfolio',
    name: 'portfolioUrl',
    label: 'Portfolio/GitHub',
    type: 'url',
    placeholder: 'https://github.com/...',
    required: false,
    order: 10,
  },
  {
    id: 'if_availability',
    name: 'availability',
    label: 'Start Date Availability',
    type: 'date',
    required: false,
    order: 11,
  },
  {
    id: 'if_cover_letter',
    name: 'coverLetter',
    label: 'Cover Letter / Why You?',
    type: 'textarea',
    placeholder: 'Tell us why you want to intern with us...',
    required: false,
    order: 12,
  },
]

const internStatuses: LeadTypeStatus[] = [
  { id: 'is_applied', value: 'applied', label: 'Applied', color: 'blue', order: 1, isInitial: true },
  { id: 'is_shortlisted', value: 'shortlisted', label: 'Shortlisted', color: 'purple', order: 2, allowedTransitions: ['offered', 'rejected'] },
  { id: 'is_offered', value: 'offered', label: 'Offered', color: 'orange', order: 3, allowedTransitions: ['active', 'rejected'] },
  { id: 'is_active', value: 'active', label: 'Active', color: 'green', order: 4, allowedTransitions: ['completed', 'dropped'] },
  { id: 'is_completed', value: 'completed', label: 'Completed', color: 'teal', order: 5, isFinal: true },
  { id: 'is_dropped', value: 'dropped', label: 'Dropped', color: 'gray', order: 6, isFinal: true },
  { id: 'is_rejected', value: 'rejected', label: 'Rejected', color: 'red', order: 7, isFinal: true },
]

const internSources: LeadTypeSource[] = [
  { id: 'is_website', value: 'website', label: 'Website Application', description: 'Applied through company website' },
  { id: 'is_campus', value: 'campus', label: 'Campus Drive', description: 'From campus placement drive' },
  { id: 'is_job_portal', value: 'job_portal', label: 'Job Portal', description: 'LinkedIn, Indeed, etc.' },
  { id: 'is_referral', value: 'referral', label: 'Referral', description: 'Referred by employee or student' },
]

export const mockLeadTypes: LeadType[] = [
  {
    id: STUDENT_TYPE_ID,
    code: 'student',
    name: 'Student Lead',
    description: 'Leads interested in enrolling for courses and certifications',
    icon: 'GraduationCap',
    color: '#3b82f6',
    isActive: true,
    isSystem: true,
    fields: studentFields,
    statuses: studentStatuses,
    sources: studentSources,
    conversionTarget: 'student',
    approvalRequired: false,
    approverRoles: [],
    assignToRoles: ['sales_rep', 'team_lead'],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    createdBy: 'usr_1',
  },
  {
    id: INTERN_TYPE_ID,
    code: 'intern',
    name: 'Intern Lead',
    description: 'Candidates applying for internship positions',
    icon: 'Briefcase',
    color: '#10b981',
    isActive: true,
    isSystem: true,
    fields: internFields,
    statuses: internStatuses,
    sources: internSources,
    conversionTarget: 'intern',
    approvalRequired: true,
    approverRoles: ['hr'],
    assignToRoles: ['hr', 'team_lead'],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    createdBy: 'usr_1',
  },
]

export function getLeadTypeById(id: string): LeadType | undefined {
  return mockLeadTypes.find(lt => lt.id === id)
}

export function getLeadTypeByCode(code: string): LeadType | undefined {
  return mockLeadTypes.find(lt => lt.code === code)
}

export function getActiveLeadTypes(): LeadType[] {
  return mockLeadTypes.filter(lt => lt.isActive)
}

export function getLeadTypeField(typeId: string, fieldName: string): LeadTypeField | undefined {
  const leadType = getLeadTypeById(typeId)
  return leadType?.fields.find(f => f.name === fieldName)
}

export function getLeadTypeStatus(typeId: string, statusValue: string): LeadTypeStatus | undefined {
  const leadType = getLeadTypeById(typeId)
  return leadType?.statuses.find(s => s.value === statusValue)
}

export function getInitialStatus(typeId: string): LeadTypeStatus | undefined {
  const leadType = getLeadTypeById(typeId)
  return leadType?.statuses.find(s => s.isInitial)
}

export function getLeadTypeSources(typeId: string): LeadTypeSource[] {
  const leadType = getLeadTypeById(typeId)
  return leadType?.sources || []
}

export function createLeadType(data: Partial<LeadType>): LeadType {
  return {
    id: generateId(),
    code: 'custom',
    name: data.name || 'New Lead Type',
    description: data.description || '',
    icon: data.icon || 'FileText',
    color: data.color || '#6b7280',
    isActive: true,
    isSystem: false,
    fields: data.fields || [],
    statuses: data.statuses || [],
    sources: data.sources || [],
    conversionTarget: data.conversionTarget || 'none',
    approvalRequired: data.approvalRequired || false,
    approverRoles: data.approverRoles || [],
    assignToRoles: data.assignToRoles || [],
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: data.createdBy || '',
  }
}

export function getLeadTypeStats(): Record<string, { total: number; active: number; converted: number }> {
  const stats: Record<string, { total: number; active: number; converted: number }> = {}
  
  mockLeadTypes.forEach(lt => {
    stats[lt.id] = { total: 0, active: 0, converted: 0 }
  })
  
  return stats
}

export { STUDENT_TYPE_ID, INTERN_TYPE_ID }