import { Timesheet, TimesheetEntry } from '@/types/timesheet'
import { generateId } from '@/lib/utils'

const createEntry = (date: Date, taskId: string, taskTitle: string, hours: number, description: string): TimesheetEntry => ({
  id: generateId(),
  date,
  taskId,
  taskTitle,
  hours,
  description,
})

const getWeekDates = (startDate: Date): Date[] => {
  const dates: Date[] = []
  for (let i = 0; i < 7; i++) {
    const date = new Date(startDate)
    date.setDate(date.getDate() + i)
    dates.push(date)
  }
  return dates
}

const weekStart = new Date('2024-01-15')
const weekDates = getWeekDates(weekStart)

export const mockTimesheets: Timesheet[] = [
  {
    id: 'ts_1',
    employeeId: 'usr_5',
    employeeName: 'James Wilson',
    weekStartDate: weekStart,
    entries: [
      createEntry(weekDates[0], 'task_1', 'Follow up with Rahul Sharma', 3, 'Made 15 calls to new leads'),
      createEntry(weekDates[0], 'task_10', 'Prepare monthly report', 4, 'Started compiling data'),
      createEntry(weekDates[1], 'task_1', 'Follow up with Rahul Sharma', 5, 'Follow-up calls and emails'),
      createEntry(weekDates[1], 'task_7', 'Review lost leads report', 2, 'Initial analysis'),
      createEntry(weekDates[2], 'task_10', 'Prepare monthly report', 6, 'Data analysis ongoing'),
      createEntry(weekDates[3], 'task_1', 'Follow up with Rahul Sharma', 4, 'Lead qualification'),
      createEntry(weekDates[4], 'task_10', 'Prepare monthly report', 5, 'Finalizing report'),
    ],
    status: 'submitted',
    approvedBy: null,
    approvedAt: null,
    totalHours: 29,
    createdAt: new Date('2024-01-19'),
  },
  {
    id: 'ts_2',
    employeeId: 'usr_6',
    employeeName: 'Lisa Anderson',
    weekStartDate: weekStart,
    entries: [
      createEntry(weekDates[0], 'task_7', 'Review lost leads report', 4, 'Started analysis'),
      createEntry(weekDates[1], 'task_7', 'Review lost leads report', 6, 'Data collection'),
      createEntry(weekDates[2], 'task_7', 'Review lost leads report', 5, 'Analysis in progress'),
      createEntry(weekDates[3], 'task_7', 'Review lost leads report', 4, 'Writing report'),
      createEntry(weekDates[4], 'task_7', 'Review lost leads report', 3, 'Final review'),
    ],
    status: 'approved',
    approvedBy: 'usr_3',
    approvedAt: new Date('2024-01-20'),
    totalHours: 22,
    createdAt: new Date('2024-01-18'),
  },
  {
    id: 'ts_3',
    employeeId: 'usr_7',
    employeeName: 'David Brown',
    weekStartDate: weekStart,
    entries: [
      createEntry(weekDates[0], 'task_2', 'Prepare demo session for Cloud Security', 5, 'Created outline'),
      createEntry(weekDates[1], 'task_2', 'Prepare demo session for Cloud Security', 6, 'Developing slides'),
      createEntry(weekDates[2], 'task_2', 'Prepare demo session for Cloud Security', 7, 'Adding examples'),
      createEntry(weekDates[3], 'task_12', 'Infrastructure security audit', 3, 'Planning phase'),
      createEntry(weekDates[4], 'task_12', 'Infrastructure security audit', 4, 'Initial scanning'),
    ],
    status: 'draft',
    approvedBy: null,
    approvedAt: null,
    totalHours: 25,
    createdAt: new Date('2024-01-19'),
  },
  {
    id: 'ts_4',
    employeeId: 'usr_8',
    employeeName: 'Jennifer Taylor',
    weekStartDate: weekStart,
    entries: [
      createEntry(weekDates[0], 'task_4', 'Social media campaign for new batch', 4, 'Content creation'),
      createEntry(weekDates[1], 'task_4', 'Social media campaign for new batch', 5, 'Designing graphics'),
      createEntry(weekDates[2], 'task_4', 'Social media campaign for new batch', 4, 'Scheduling posts'),
      createEntry(weekDates[3], 'task_8', 'Create student feedback form', 3, 'Form design'),
      createEntry(weekDates[4], 'task_8', 'Create student feedback form', 2, 'Testing and sharing'),
    ],
    status: 'submitted',
    approvedBy: null,
    approvedAt: null,
    totalHours: 18,
    createdAt: new Date('2024-01-19'),
  },
  {
    id: 'ts_5',
    employeeId: 'usr_10',
    employeeName: 'Amanda White',
    weekStartDate: weekStart,
    entries: [
      createEntry(weekDates[0], 'task_5', 'Contact converted leads', 4, 'Sending emails'),
      createEntry(weekDates[1], 'task_5', 'Contact converted leads', 3, 'Follow-ups'),
      createEntry(weekDates[2], 'task_5', 'Contact converted leads', 2, 'Confirmation calls'),
      createEntry(weekDates[3], 'task_5', 'Contact converted leads', 1, 'Final confirmations'),
      createEntry(weekDates[4], 'task_5', 'Contact converted leads', 2, 'Documentation'),
    ],
    status: 'approved',
    approvedBy: 'usr_3',
    approvedAt: new Date('2024-01-19'),
    totalHours: 12,
    createdAt: new Date('2024-01-17'),
  },
]

export function getTimesheetsByEmployee(employeeId: string): Timesheet[] {
  return mockTimesheets.filter(ts => ts.employeeId === employeeId)
}

export function getTimesheetById(id: string): Timesheet | undefined {
  return mockTimesheets.find(ts => ts.id === id)
}

export function getPendingTimesheets(): Timesheet[] {
  return mockTimesheets.filter(ts => ts.status === 'submitted')
}