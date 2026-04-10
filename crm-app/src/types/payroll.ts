export type PayrollStatus = 'draft' | 'processed' | 'paid' | 'cancelled'
export type PayrollRunStatus = 'draft' | 'processing' | 'completed' | 'locked'
export type PayrollRunType = 'regular' | 'supplementary' | 'off_cycle'
export type WorkerType = 'paid_employee' | 'unpaid_employee' | 'paid_intern' | 'unpaid_intern'
export type PaymentMethod = 'bank_transfer' | 'cash' | 'cheque' | 'upi'

export interface SalaryBreakdown {
  basic: number
  hra: number
  allowances: number
  deductions: number
  gross: number
  net: number
}

export interface SalaryStructure {
  id: string
  userId: string
  ctc: number
  grossMonthly: number
  basic: number
  hra: number
  conveyanceAllowance: number
  medicalAllowance: number
  specialAllowance: number
  pfApplicable: boolean
  esiApplicable: boolean
  effectiveFrom: string
  effectiveTo: string | null
  createdBy: string | null
  createdAt: string
  updatedAt: string
}

export interface PayrollSettings {
  id: string
  basicPercentage: number
  hraPercentage: number
  conveyanceAllowance: number
  medicalAllowance: number
  specialAllowanceType: string
  pfEmployeeRate: number
  pfEmployerRate: number
  esiEmployeeRate: number
  esiEmployerRate: number
  esiThreshold: number
  professionalTax: number
  payrollDay: number
  payPeriodStart: number
  payPeriodEnd: number
  overtimeRateMultiplier: number
  standardWorkingHours: number
  expectedHoursPerMonth: number
  updatedAt: string
  updatedBy: string | null
}

export interface PayrollRun {
  id: string
  month: number
  year: number
  status: PayrollRunStatus
  runType: PayrollRunType
  totalEmployees: number
  totalGross: number
  totalDeductions: number
  totalNet: number
  processedAt: string | null
  processedBy: string | null
  lockedAt: string | null
  lockedBy: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
}

export interface PayrollRecord {
  id: string
  payrollRunId: string | null
  userId: string
  employeeName: string
  employeeDepartment: string
  employeeRole: string
  month: number
  year: number
  workerType: WorkerType
  totalDays: number
  presentDays: number
  absentDays: number
  paidLeaves: number
  unpaidLeaves: number
  halfDays: number
  payableDays: number
  overtimeHours: number
  basic: number
  hra: number
  conveyanceAllowance: number
  medicalAllowance: number
  specialAllowance: number
  overtimePay: number
  grossEarnings: number
  pfEmployee: number
  esiEmployee: number
  professionalTax: number
  tds: number
  lossOfPay: number
  otherDeductions: number
  totalDeductions: number
  pfEmployer: number
  esiEmployer: number
  netPay: number
  status: PayrollStatus
  paidOn: string | null
  paymentMethod: PaymentMethod | null
  paymentReference: string | null
  payslipNumber: string | null
  payslipGeneratedAt: string | null
  generatedBy: string | null
  approvedBy: string | null
  approvedAt: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
}

export interface PayrollRecordWithEmployee extends PayrollRecord {
  employeeEmail: string
  employeeAvatar: string | null
}

export interface PayrollSummary {
  totalPaid: number
  totalProcessed: number
  totalPending: number
  paidCount: number
  processedCount: number
  pendingCount: number
  totalEmployees: number
}

export interface PayrollFormData {
  month: number
  year: number
  selectedUserIds: string[]
  notes?: string
}

export interface MarkPaidData {
  paidOn: string
  paymentMethod: PaymentMethod
  paymentReference?: string
}

export interface CreateSalaryStructureInput {
  userId: string
  ctc: number
  grossMonthly: number
  basic: number
  hra: number
  conveyanceAllowance?: number
  medicalAllowance?: number
  specialAllowance?: number
  pfApplicable?: boolean
  esiApplicable?: boolean
  effectiveFrom?: string
}

export interface WorkerClassification {
  workerType: WorkerType
  isPaid: boolean
  isIntern: boolean
  label: string
}

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
] as const

export const WORKER_TYPE_LABELS: Record<WorkerType, string> = {
  paid_employee: 'Paid Employee',
  unpaid_employee: 'Unpaid Employee',
  paid_intern: 'Paid Intern',
  unpaid_intern: 'Unpaid Intern',
}

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  bank_transfer: 'Bank Transfer',
  cash: 'Cash',
  cheque: 'Cheque',
  upi: 'UPI',
}
