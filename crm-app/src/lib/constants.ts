export const COURSES = [
  'Cyber Security Fundamentals',
  'Ethical Hacking',
  'Penetration Testing',
  'Network Security',
  'Cloud Security',
  'Incident Response',
  'Security Analytics',
  'CompTIA Security+',
  'CISSP Preparation',
  'CEH Certification',
]

export const LEAD_SOURCES = [
  { value: 'ads', label: 'Google Ads' },
  { value: 'referral', label: 'Referral' },
  { value: 'organic', label: 'Organic Search' },
  { value: 'social', label: 'Social Media' },
  { value: 'event', label: 'Event/Webinar' },
]

export const LEAD_STATUSES = [
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'follow_up', label: 'Follow Up' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'converted', label: 'Converted' },
  { value: 'lost', label: 'Lost' },
]

export const LEAD_PRIORITIES = [
  { value: 'hot', label: 'Hot', color: 'red' },
  { value: 'warm', label: 'Warm', color: 'orange' },
  { value: 'cold', label: 'Cold', color: 'blue' },
]

export const LEAD_TYPE_ICONS = [
  { value: 'GraduationCap', label: 'Graduation Cap' },
  { value: 'Briefcase', label: 'Briefcase' },
  { value: 'Users', label: 'Users' },
  { value: 'Building', label: 'Building' },
  { value: 'Handshake', label: 'Handshake' },
  { value: 'FileText', label: 'Document' },
  { value: 'UserPlus', label: 'User Plus' },
  { value: 'Star', label: 'Star' },
]

export const LEAD_TYPE_COLORS = [
  { value: '#3b82f6', label: 'Blue' },
  { value: '#10b981', label: 'Green' },
  { value: '#f59e0b', label: 'Orange' },
  { value: '#ef4444', label: 'Red' },
  { value: '#8b5cf6', label: 'Purple' },
  { value: '#ec4899', label: 'Pink' },
  { value: '#06b6d4', label: 'Cyan' },
  { value: '#6b7280', label: 'Gray' },
]

export const FIELD_TYPES = [
  { value: 'text', label: 'Text Input' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone Number' },
  { value: 'select', label: 'Dropdown Select' },
  { value: 'multiselect', label: 'Multi-Select' },
  { value: 'date', label: 'Date Picker' },
  { value: 'textarea', label: 'Text Area' },
  { value: 'url', label: 'URL/Link' },
  { value: 'number', label: 'Number Input' },
  { value: 'checkbox', label: 'Checkbox' },
]

export const CONVERSION_TARGETS = [
  { value: 'student', label: 'Student' },
  { value: 'intern', label: 'Intern' },
  { value: 'employee', label: 'Employee' },
  { value: 'partnership', label: 'Partnership' },
  { value: 'none', label: 'No Conversion' },
]

export const INTERN_STATUSES = [
  { value: 'applied', label: 'Applied', color: 'blue' },
  { value: 'shortlisted', label: 'Shortlisted', color: 'purple' },
  { value: 'offered', label: 'Offered', color: 'orange' },
  { value: 'active', label: 'Active', color: 'green' },
  { value: 'completed', label: 'Completed', color: 'teal' },
  { value: 'dropped', label: 'Dropped', color: 'gray' },
  { value: 'rejected', label: 'Rejected', color: 'red' },
]

export const INTERN_SOURCES = [
  { value: 'website', label: 'Website Application' },
  { value: 'campus', label: 'Campus Drive' },
  { value: 'job_portal', label: 'Job Portal' },
  { value: 'referral', label: 'Referral' },
]

export const INTERNSHIP_DURATIONS = [
  { value: '1_month', label: '1 Month' },
  { value: '2_months', label: '2 Months' },
  { value: '3_months', label: '3 Months' },
]

export const INTERNSHIP_TYPES = [
  { value: 'paid', label: 'Paid Internship' },
  { value: 'unpaid', label: 'Unpaid Internship' },
]

export const CALL_OUTCOMES = [
  { value: 'answered', label: 'Answered' },
  { value: 'no_answer', label: 'No Answer' },
  { value: 'busy', label: 'Busy' },
  { value: 'voicemail', label: 'Voicemail' },
  { value: 'wrong_number', label: 'Wrong Number' },
]

export const TASK_PRIORITIES = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
]

export const TASK_STATUSES = [
  { value: 'todo', label: 'To Do' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'done', label: 'Done' },
]

export const LEAVE_TYPES = [
  { value: 'sick', label: 'Sick Leave' },
  { value: 'casual', label: 'Casual Leave' },
  { value: 'paid', label: 'Paid Leave' },
]

export const DEPARTMENTS = [
  { value: 'sales', label: 'Sales' },
  { value: 'training', label: 'Training' },
  { value: 'marketing', label: 'Marketing' },
]

export const ROLES = [
  { value: 'admin', label: 'Admin' },
  { value: 'hr', label: 'HR Manager' },
  { value: 'team_lead', label: 'Team Lead' },
  { value: 'sales_rep', label: 'Sales Representative' },
  { value: 'employee', label: 'Employee' },
]

export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

export const COURSE_FEES: Record<string, number> = {
  'Cyber Security Fundamentals': 25000,
  'Ethical Hacking': 45000,
  'Penetration Testing': 55000,
  'Network Security': 35000,
  'Cloud Security': 50000,
  'Incident Response': 40000,
  'Security Analytics': 45000,
  'CompTIA Security+': 30000,
  'CISSP Preparation': 60000,
  'CEH Certification': 50000,
}

export const STUDENT_STATUSES = [
  { value: 'active', label: 'Active', color: 'green' },
  { value: 'completed', label: 'Completed', color: 'blue' },
  { value: 'dropped', label: 'Dropped', color: 'red' },
  { value: 'on_hold', label: 'On Hold', color: 'orange' },
]

export const ENROLLMENT_STATUSES = [
  { value: 'enrolled', label: 'Enrolled', color: 'blue' },
  { value: 'in_progress', label: 'In Progress', color: 'green' },
  { value: 'completed', label: 'Completed', color: 'purple' },
  { value: 'dropped', label: 'Dropped', color: 'red' },
]

export const BATCH_STATUSES = [
  { value: 'upcoming', label: 'Upcoming', color: 'blue' },
  { value: 'ongoing', label: 'Ongoing', color: 'green' },
  { value: 'completed', label: 'Completed', color: 'purple' },
  { value: 'cancelled', label: 'Cancelled', color: 'red' },
]

export const BATCH_MODES = [
  { value: 'online', label: 'Online' },
  { value: 'offline', label: 'Offline' },
  { value: 'hybrid', label: 'Hybrid' },
]

export const DAYS_OF_WEEK = [
  { value: 'monday', label: 'Monday' },
  { value: 'tuesday', label: 'Tuesday' },
  { value: 'wednesday', label: 'Wednesday' },
  { value: 'thursday', label: 'Thursday' },
  { value: 'friday', label: 'Friday' },
  { value: 'saturday', label: 'Saturday' },
  { value: 'sunday', label: 'Sunday' },
]

export const PAYMENT_STATUSES = [
  { value: 'pending', label: 'Pending', color: 'orange' },
  { value: 'partial', label: 'Partial', color: 'blue' },
  { value: 'paid', label: 'Paid', color: 'green' },
  { value: 'overdue', label: 'Overdue', color: 'red' },
  { value: 'refunded', label: 'Refunded', color: 'purple' },
]

export const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'card', label: 'Credit/Debit Card' },
  { value: 'upi', label: 'UPI' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'cheque', label: 'Cheque' },
]

export const PAYMENT_PLANS = [
  { value: 'full', label: 'Full Payment' },
  { value: 'installment', label: 'Installment' },
]

export const CERTIFICATE_TYPES = [
  { value: 'completion', label: 'Course Completion' },
  { value: 'excellence', label: 'Excellence' },
  { value: 'attendance', label: 'Attendance' },
  { value: 'participation', label: 'Participation' },
]

export const CERTIFICATE_STATUSES = [
  { value: 'issued', label: 'Issued', color: 'green' },
  { value: 'revoked', label: 'Revoked', color: 'red' },
]

export const INVOICE_STATUSES = [
  { value: 'draft', label: 'Draft', color: 'gray' },
  { value: 'sent', label: 'Sent', color: 'blue' },
  { value: 'paid', label: 'Paid', color: 'green' },
  { value: 'cancelled', label: 'Cancelled', color: 'red' },
]

export const TIME_SLOTS = [
  '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', 
  '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'
]