export type PayrollStatus = 'pending' | 'processed' | 'paid'

export interface SalaryBreakdown {
  basic: number
  hra: number
  allowances: number
  deductions: number
  gross: number
  net: number
}

export interface PayrollRecord {
  id: string
  employeeId: string
  employeeName: string
  month: string
  year: number
  salary: SalaryBreakdown
  daysWorked: number
  daysInMonth: number
  leavesTaken: number
  unpaidLeaves: number
  status: PayrollStatus
  generatedAt: Date
  paidAt: Date | null
}