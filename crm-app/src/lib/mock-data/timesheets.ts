import { Timesheet, TimesheetEntry, WeekTimesheetData } from '@/types/timesheet'
import { generateId } from '@/lib/utils'

const createEntry = (taskId: string, taskTitle: string, hours: number, description: string): TimesheetEntry => ({
  id: generateId(),
  taskId,
  taskTitle,
  hours,
  description,
})

export function getWeekStart(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  return new Date(d.setDate(diff))
}

export function getWeekEnd(weekStart: Date): Date {
  const end = new Date(weekStart)
  end.setDate(end.getDate() + 6)
  return end
}

export function formatDateKey(date: Date): string {
  return date.toISOString().split('T')[0]
}

const today = new Date()
const dayOfWeek = today.getDay()
const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)
const thisWeekMonday = new Date(today.setDate(diff))

const mon = new Date(thisWeekMonday)
const tue = new Date(thisWeekMonday); tue.setDate(tue.getDate() + 1)
const wed = new Date(thisWeekMonday); wed.setDate(wed.getDate() + 2)
const thu = new Date(thisWeekMonday); thu.setDate(thu.getDate() + 3)
const fri = new Date(thisWeekMonday); fri.setDate(fri.getDate() + 4)

const lastMon = new Date(mon); lastMon.setDate(lastMon.getDate() - 7)
const lastTue = new Date(tue); lastTue.setDate(lastTue.getDate() - 7)
const lastWed = new Date(wed); lastWed.setDate(lastWed.getDate() - 7)
const lastThu = new Date(thu); lastThu.setDate(lastThu.getDate() - 7)
const lastFri = new Date(fri); lastFri.setDate(lastFri.getDate() - 7)

export const mockTimesheets: Timesheet[] = [
  // Rahul Kumar (usr_5) - Sales Rep - This Week
  {
    id: 'ts_1_mon',
    employeeId: 'usr_5',
    employeeName: 'Rahul Kumar',
    date: mon,
    entries: [
      createEntry('task_1', 'Follow up with new leads', 3, 'Made 15 calls to new leads'),
      createEntry('task_10', 'Prepare sales report', 4, 'Started compiling data'),
    ],
    status: 'submitted',
    approvedBy: null,
    approvedAt: null,
    totalHours: 7,
    createdAt: mon,
  },
  {
    id: 'ts_1_tue',
    employeeId: 'usr_5',
    employeeName: 'Rahul Kumar',
    date: tue,
    entries: [
      createEntry('task_1', 'Follow up with new leads', 5, 'Follow-up calls and emails'),
      createEntry('task_7', 'Review lost leads report', 2, 'Initial analysis'),
    ],
    status: 'approved',
    approvedBy: 'usr_3',
    approvedAt: tue,
    totalHours: 7,
    createdAt: tue,
  },
  {
    id: 'ts_1_wed',
    employeeId: 'usr_5',
    employeeName: 'Rahul Kumar',
    date: wed,
    entries: [
      createEntry('task_10', 'Prepare sales report', 6, 'Data analysis ongoing'),
    ],
    status: 'approved',
    approvedBy: 'usr_3',
    approvedAt: wed,
    totalHours: 6,
    createdAt: wed,
  },
  {
    id: 'ts_1_thu',
    employeeId: 'usr_5',
    employeeName: 'Rahul Kumar',
    date: thu,
    entries: [
      createEntry('task_1', 'Follow up with new leads', 4, 'Lead qualification'),
    ],
    status: 'submitted',
    approvedBy: null,
    approvedAt: null,
    totalHours: 4,
    createdAt: thu,
  },
  // Sneha Reddy (usr_6) - Sales Rep - This Week
  {
    id: 'ts_2_mon',
    employeeId: 'usr_6',
    employeeName: 'Sneha Reddy',
    date: mon,
    entries: [
      createEntry('task_7', 'Review lost leads report', 4, 'Started analysis'),
    ],
    status: 'approved',
    approvedBy: 'usr_3',
    approvedAt: mon,
    totalHours: 4,
    createdAt: mon,
  },
  {
    id: 'ts_2_tue',
    employeeId: 'usr_6',
    employeeName: 'Sneha Reddy',
    date: tue,
    entries: [
      createEntry('task_7', 'Review lost leads report', 6, 'Data collection'),
    ],
    status: 'approved',
    approvedBy: 'usr_3',
    approvedAt: tue,
    totalHours: 6,
    createdAt: tue,
  },
  {
    id: 'ts_2_wed',
    employeeId: 'usr_6',
    employeeName: 'Sneha Reddy',
    date: wed,
    entries: [
      createEntry('task_7', 'Review lost leads report', 5, 'Analysis in progress'),
    ],
    status: 'approved',
    approvedBy: 'usr_3',
    approvedAt: wed,
    totalHours: 5,
    createdAt: wed,
  },
  {
    id: 'ts_2_thu',
    employeeId: 'usr_6',
    employeeName: 'Sneha Reddy',
    date: thu,
    entries: [
      createEntry('task_7', 'Review lost leads report', 4, 'Writing report'),
    ],
    status: 'submitted',
    approvedBy: null,
    approvedAt: null,
    totalHours: 4,
    createdAt: thu,
  },
  // Amit Verma (usr_7) - Employee (Training) - This Week
  {
    id: 'ts_3_mon',
    employeeId: 'usr_7',
    employeeName: 'Amit Verma',
    date: mon,
    entries: [
      createEntry('task_2', 'Prepare demo session for Cloud Security', 5, 'Created outline'),
    ],
    status: 'approved',
    approvedBy: 'usr_4',
    approvedAt: mon,
    totalHours: 5,
    createdAt: mon,
  },
  {
    id: 'ts_3_tue',
    employeeId: 'usr_7',
    employeeName: 'Amit Verma',
    date: tue,
    entries: [
      createEntry('task_2', 'Prepare demo session for Cloud Security', 6, 'Developing slides'),
    ],
    status: 'approved',
    approvedBy: 'usr_4',
    approvedAt: tue,
    totalHours: 6,
    createdAt: tue,
  },
  {
    id: 'ts_3_wed',
    employeeId: 'usr_7',
    employeeName: 'Amit Verma',
    date: wed,
    entries: [
      createEntry('task_2', 'Prepare demo session for Cloud Security', 7, 'Adding examples'),
    ],
    status: 'submitted',
    approvedBy: null,
    approvedAt: null,
    totalHours: 7,
    createdAt: wed,
  },
  {
    id: 'ts_3_thu',
    employeeId: 'usr_7',
    employeeName: 'Amit Verma',
    date: thu,
    entries: [
      createEntry('task_12', 'Infrastructure security audit', 3, 'Planning phase'),
    ],
    status: 'submitted',
    approvedBy: null,
    approvedAt: null,
    totalHours: 3,
    createdAt: thu,
  },
  // Kavitha Nair (usr_8) - Employee (Marketing) - This Week
  {
    id: 'ts_4_mon',
    employeeId: 'usr_8',
    employeeName: 'Kavitha Nair',
    date: mon,
    entries: [
      createEntry('task_4', 'Social media campaign for new batch', 4, 'Content creation'),
    ],
    status: 'approved',
    approvedBy: 'usr_2',
    approvedAt: mon,
    totalHours: 4,
    createdAt: mon,
  },
  {
    id: 'ts_4_tue',
    employeeId: 'usr_8',
    employeeName: 'Kavitha Nair',
    date: tue,
    entries: [
      createEntry('task_4', 'Social media campaign for new batch', 5, 'Designing graphics'),
    ],
    status: 'submitted',
    approvedBy: null,
    approvedAt: null,
    totalHours: 5,
    createdAt: tue,
  },
  // Sanjay Gupta (usr_9) - Employee (Training) - This Week
  {
    id: 'ts_5_mon',
    employeeId: 'usr_9',
    employeeName: 'Sanjay Gupta',
    date: mon,
    entries: [
      createEntry('task_5', 'Prepare lab environment', 4, 'Setting up servers'),
    ],
    status: 'approved',
    approvedBy: 'usr_4',
    approvedAt: mon,
    totalHours: 4,
    createdAt: mon,
  },
  {
    id: 'ts_5_tue',
    employeeId: 'usr_9',
    employeeName: 'Sanjay Gupta',
    date: tue,
    entries: [
      createEntry('task_5', 'Prepare lab environment', 3, 'Testing configurations'),
    ],
    status: 'approved',
    approvedBy: 'usr_4',
    approvedAt: tue,
    totalHours: 3,
    createdAt: tue,
  },
  {
    id: 'ts_5_wed',
    employeeId: 'usr_9',
    employeeName: 'Sanjay Gupta',
    date: wed,
    entries: [
      createEntry('task_5', 'Prepare lab environment', 5, 'Documentation'),
    ],
    status: 'submitted',
    approvedBy: null,
    approvedAt: null,
    totalHours: 5,
    createdAt: wed,
  },
  // Divya Krishnan (usr_10) - Sales Rep - This Week
  {
    id: 'ts_6_mon',
    employeeId: 'usr_10',
    employeeName: 'Divya Krishnan',
    date: mon,
    entries: [
      createEntry('task_5', 'Contact converted leads', 4, 'Sending emails'),
    ],
    status: 'approved',
    approvedBy: 'usr_3',
    approvedAt: mon,
    totalHours: 4,
    createdAt: mon,
  },
  {
    id: 'ts_6_tue',
    employeeId: 'usr_10',
    employeeName: 'Divya Krishnan',
    date: tue,
    entries: [
      createEntry('task_5', 'Contact converted leads', 3, 'Follow-ups'),
    ],
    status: 'approved',
    approvedBy: 'usr_3',
    approvedAt: tue,
    totalHours: 3,
    createdAt: tue,
  },
  {
    id: 'ts_6_wed',
    employeeId: 'usr_10',
    employeeName: 'Divya Krishnan',
    date: wed,
    entries: [
      createEntry('task_1', 'Lead prospecting', 6, 'Cold calling'),
    ],
    status: 'submitted',
    approvedBy: null,
    approvedAt: null,
    totalHours: 6,
    createdAt: wed,
  },
  // Manish Joshi (usr_11) - Employee (Marketing) - This Week
  {
    id: 'ts_7_mon',
    employeeId: 'usr_11',
    employeeName: 'Manish Joshi',
    date: mon,
    entries: [
      createEntry('task_4', 'Email marketing campaign', 5, 'Drafting emails'),
    ],
    status: 'approved',
    approvedBy: 'usr_2',
    approvedAt: mon,
    totalHours: 5,
    createdAt: mon,
  },
  {
    id: 'ts_7_tue',
    employeeId: 'usr_11',
    employeeName: 'Manish Joshi',
    date: tue,
    entries: [
      createEntry('task_4', 'Email marketing campaign', 4, 'A/B testing'),
    ],
    status: 'submitted',
    approvedBy: null,
    approvedAt: null,
    totalHours: 4,
    createdAt: tue,
  },
  // Pooja Menon (usr_12) - Employee (Training) - This Week
  {
    id: 'ts_8_mon',
    employeeId: 'usr_12',
    employeeName: 'Pooja Menon',
    date: mon,
    entries: [
      createEntry('task_2', 'Course material preparation', 6, 'Creating slides'),
    ],
    status: 'approved',
    approvedBy: 'usr_4',
    approvedAt: mon,
    totalHours: 6,
    createdAt: mon,
  },
  {
    id: 'ts_8_tue',
    employeeId: 'usr_12',
    employeeName: 'Pooja Menon',
    date: tue,
    entries: [
      createEntry('task_2', 'Course material preparation', 5, 'Reviewing content'),
    ],
    status: 'submitted',
    approvedBy: null,
    approvedAt: null,
    totalHours: 5,
    createdAt: tue,
  },
  // Last Week entries for better testing
  {
    id: 'ts_last_1',
    employeeId: 'usr_5',
    employeeName: 'Rahul Kumar',
    date: lastMon,
    entries: [
      createEntry('task_1', 'Lead follow-up', 8, 'Full day of calls'),
    ],
    status: 'approved',
    approvedBy: 'usr_3',
    approvedAt: lastMon,
    totalHours: 8,
    createdAt: lastMon,
  },
  {
    id: 'ts_last_2',
    employeeId: 'usr_6',
    employeeName: 'Sneha Reddy',
    date: lastTue,
    entries: [
      createEntry('task_7', 'Report writing', 7, 'Completed report'),
    ],
    status: 'approved',
    approvedBy: 'usr_3',
    approvedAt: lastTue,
    totalHours: 7,
    createdAt: lastTue,
  },
  {
    id: 'ts_last_3',
    employeeId: 'usr_7',
    employeeName: 'Amit Verma',
    date: lastWed,
    entries: [
      createEntry('task_2', 'Training session prep', 6, 'Prepared materials'),
    ],
    status: 'approved',
    approvedBy: 'usr_4',
    approvedAt: lastWed,
    totalHours: 6,
    createdAt: lastWed,
  },
  {
    id: 'ts_last_4',
    employeeId: 'usr_10',
    employeeName: 'Divya Krishnan',
    date: lastThu,
    entries: [
      createEntry('task_1', 'Client meetings', 5, 'Multiple demos'),
    ],
    status: 'approved',
    approvedBy: 'usr_3',
    approvedAt: lastThu,
    totalHours: 5,
    createdAt: lastThu,
  },
]

export function getTimesheetsByEmployee(employeeId: string): Timesheet[] {
  return mockTimesheets.filter(ts => ts.employeeId === employeeId)
}

export function getTimesheetById(id: string): Timesheet | undefined {
  return mockTimesheets.find(ts => ts.id === id)
}

export function getTimesheetByDate(employeeId: string, date: Date): Timesheet | undefined {
  const dateKey = formatDateKey(date)
  return mockTimesheets.find(ts => 
    ts.employeeId === employeeId && formatDateKey(ts.date) === dateKey
  )
}

export function getPendingTimesheets(): Timesheet[] {
  return mockTimesheets.filter(ts => ts.status === 'submitted')
}

export function getTimesheetsByWeek(employeeId: string, weekStart: Date): Timesheet[] {
  const weekEnd = getWeekEnd(weekStart)
  return mockTimesheets.filter(ts => {
    if (ts.employeeId !== employeeId) return false
    const tsDate = new Date(ts.date)
    return tsDate >= weekStart && tsDate <= weekEnd
  })
}

export function getWeekTotalHours(employeeId: string, weekStart: Date): number {
  const weekTimesheets = getTimesheetsByWeek(employeeId, weekStart)
  return weekTimesheets.reduce((sum, ts) => sum + ts.totalHours, 0)
}

export function getWeekTimesheetData(employeeId: string, weekStart: Date): WeekTimesheetData {
  const weekEnd = getWeekEnd(weekStart)
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const days: WeekTimesheetData['days'] = []
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(weekStart)
    date.setDate(date.getDate() + i)
    const timesheet = getTimesheetByDate(employeeId, date)
    const isWeekend = i >= 5
    
    days.push({
      date,
      dayName: dayNames[i],
      timesheet,
      hours: timesheet?.totalHours || 0,
      status: isWeekend ? 'missing' : timesheet ? 'logged' : 'missing',
    })
  }
  
  const totalHours = days.reduce((sum, day) => sum + day.hours, 0)
  
  return {
    weekStart,
    weekEnd,
    days,
    totalHours,
  }
}

export function getPendingTimesheetsByTeam(teamMemberIds: string[]): Timesheet[] {
  return mockTimesheets.filter(ts => 
    ts.status === 'submitted' && teamMemberIds.includes(ts.employeeId)
  )
}

export function getAllTimesheets(): Timesheet[] {
  return [...mockTimesheets].sort((a, b) => b.date.getTime() - a.date.getTime())
}

export function getTimesheetsForManager(managerId: string, users: { id: string; managedBy?: string }[]): Timesheet[] {
  const teamIds = users.filter(u => u.managedBy === managerId).map(u => u.id)
  return mockTimesheets.filter(ts => teamIds.includes(ts.employeeId) || ts.employeeId === managerId)
}

export function getTimesheetsByDateRange(startDate: Date, endDate: Date): Timesheet[] {
  return mockTimesheets.filter(ts => {
    const tsDate = new Date(ts.date)
    return tsDate >= startDate && tsDate <= endDate
  })
}

export function getEmployeeTimesheetSummary(employeeId: string): {
  totalHours: number
  submitted: number
  approved: number
  rejected: number
} {
  const employeeTs = mockTimesheets.filter(ts => ts.employeeId === employeeId)
  return {
    totalHours: employeeTs.reduce((sum, ts) => sum + ts.totalHours, 0),
    submitted: employeeTs.filter(ts => ts.status === 'submitted').length,
    approved: employeeTs.filter(ts => ts.status === 'approved').length,
    rejected: employeeTs.filter(ts => ts.status === 'rejected').length,
  }
}