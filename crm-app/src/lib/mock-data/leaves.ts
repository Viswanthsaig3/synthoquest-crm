import { Leave, LeaveBalance } from '@/types/leave'
import { generateId } from '@/lib/utils'

export const leaveBalances: Record<string, LeaveBalance> = {
  'usr_5': { sick: 5, casual: 7, paid: 10 },
  'usr_6': { sick: 6, casual: 8, paid: 12 },
  'usr_7': { sick: 4, casual: 6, paid: 8 },
  'usr_8': { sick: 5, casual: 7, paid: 10 },
  'usr_9': { sick: 6, casual: 7, paid: 11 },
  'usr_10': { sick: 5, casual: 6, paid: 9 },
  'usr_11': { sick: 4, casual: 5, paid: 8 },
  'usr_12': { sick: 5, casual: 7, paid: 10 },
}

export const mockLeaves: Leave[] = [
  {
    id: 'leave_1',
    employeeId: 'usr_5',
    employeeName: 'James Wilson',
    type: 'casual',
    startDate: new Date('2024-01-25'),
    endDate: new Date('2024-01-26'),
    days: 2,
    reason: 'Family function',
    status: 'pending',
    approvedBy: null,
    approvedAt: null,
    rejectionReason: null,
    createdAt: new Date('2024-01-20'),
  },
  {
    id: 'leave_2',
    employeeId: 'usr_7',
    employeeName: 'David Brown',
    type: 'sick',
    startDate: new Date('2024-01-18'),
    endDate: new Date('2024-01-18'),
    days: 1,
    reason: 'Not feeling well, fever',
    status: 'approved',
    approvedBy: 'usr_4',
    approvedAt: new Date('2024-01-17'),
    rejectionReason: null,
    createdAt: new Date('2024-01-17'),
  },
  {
    id: 'leave_3',
    employeeId: 'usr_8',
    employeeName: 'Jennifer Taylor',
    type: 'paid',
    startDate: new Date('2024-02-01'),
    endDate: new Date('2024-02-03'),
    days: 3,
    reason: 'Personal vacation',
    status: 'approved',
    approvedBy: 'usr_2',
    approvedAt: new Date('2024-01-15'),
    rejectionReason: null,
    createdAt: new Date('2024-01-14'),
  },
  {
    id: 'leave_4',
    employeeId: 'usr_10',
    employeeName: 'Amanda White',
    type: 'casual',
    startDate: new Date('2024-01-29'),
    endDate: new Date('2024-01-29'),
    days: 1,
    reason: 'Personal work',
    status: 'pending',
    approvedBy: null,
    approvedAt: null,
    rejectionReason: null,
    createdAt: new Date('2024-01-20'),
  },
  {
    id: 'leave_5',
    employeeId: 'usr_11',
    employeeName: 'Chris Thompson',
    type: 'sick',
    startDate: new Date('2024-01-22'),
    endDate: new Date('2024-01-23'),
    days: 2,
    reason: 'Medical appointment',
    status: 'rejected',
    approvedBy: 'usr_2',
    approvedAt: new Date('2024-01-21'),
    rejectionReason: 'Insufficient leave balance and critical project deadline',
    createdAt: new Date('2024-01-20'),
  },
  {
    id: 'leave_6',
    employeeId: 'usr_6',
    employeeName: 'Lisa Anderson',
    type: 'paid',
    startDate: new Date('2024-02-10'),
    endDate: new Date('2024-02-15'),
    days: 6,
    reason: 'Family trip',
    status: 'pending',
    approvedBy: null,
    approvedAt: null,
    rejectionReason: null,
    createdAt: new Date('2024-01-19'),
  },
]

export function getLeavesByEmployee(employeeId: string): Leave[] {
  return mockLeaves.filter(l => l.employeeId === employeeId)
}

export function getLeaveById(id: string): Leave | undefined {
  return mockLeaves.find(l => l.id === id)
}

export function getPendingLeaves(): Leave[] {
  return mockLeaves.filter(l => l.status === 'pending')
}

export function getLeaveBalance(employeeId: string): LeaveBalance {
  return leaveBalances[employeeId] || { sick: 0, casual: 0, paid: 0 }
}