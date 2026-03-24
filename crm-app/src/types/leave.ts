export type LeaveType = 'sick' | 'casual' | 'paid'
export type LeaveStatus = 'pending' | 'approved' | 'rejected'

export interface LeaveBalance {
  sick: number
  casual: number
  paid: number
}

export interface Leave {
  id: string
  employeeId: string
  employeeName: string
  type: LeaveType
  startDate: Date
  endDate: Date
  days: number
  reason: string
  status: LeaveStatus
  approvedBy: string | null
  approvedAt: Date | null
  rejectionReason: string | null
  createdAt: Date
}