import type {
  PayrollSettings,
  WorkerType,
} from '@/types/payroll'

export interface AttendanceSummary {
  totalDays: number
  presentDays: number
  absentDays: number
  paidLeaves: number
  unpaidLeaves: number
  halfDays: number
  totalHoursWorked: number
  overtimeHours: number
}

export interface PayrollCalculationInput {
  workerType: WorkerType
  /** Monthly salary/stipend from users.compensation_amount or intern_profiles.stipend */
  monthlySalary: number
  settings: PayrollSettings
  attendance: AttendanceSummary
}

export interface PayrollCalculationResult {
  workerType: WorkerType
  totalDays: number
  presentDays: number
  absentDays: number
  paidLeaves: number
  unpaidLeaves: number
  halfDays: number
  payableDays: number
  overtimeHours: number
  totalHoursWorked: number
  expectedHours: number
  monthlySalary: number
  calculatedSalary: number
  overtimeHoursUnpaid: number
  completionPercentage: number
  grossEarnings: number
  totalDeductions: number
  netPay: number
  // These fields are kept at 0 for DB compatibility but not actively used
  basic: number
  hra: number
  conveyanceAllowance: number
  medicalAllowance: number
  specialAllowance: number
  overtimePay: number
  pfEmployee: number
  esiEmployee: number
  professionalTax: number
  tds: number
  lossOfPay: number
  otherDeductions: number
  pfEmployer: number
  esiEmployer: number
}

export function calculatePayroll(input: PayrollCalculationInput): PayrollCalculationResult {
  const { workerType, monthlySalary, settings, attendance } = input

  const payableDays =
    attendance.presentDays +
    attendance.paidLeaves +
    attendance.halfDays * 0.5

  const base: PayrollCalculationResult = {
    workerType,
    totalDays: attendance.totalDays,
    presentDays: attendance.presentDays,
    absentDays: attendance.absentDays,
    paidLeaves: attendance.paidLeaves,
    unpaidLeaves: attendance.unpaidLeaves,
    halfDays: attendance.halfDays,
    payableDays,
    overtimeHours: attendance.overtimeHours,
    totalHoursWorked: attendance.totalHoursWorked,
    expectedHours: settings.expectedHoursPerMonth,
    monthlySalary: 0,
    calculatedSalary: 0,
    overtimeHoursUnpaid: 0,
    completionPercentage: 0,
    grossEarnings: 0,
    totalDeductions: 0,
    netPay: 0,
    // DB compatibility fields — all zero
    basic: 0,
    hra: 0,
    conveyanceAllowance: 0,
    medicalAllowance: 0,
    specialAllowance: 0,
    overtimePay: 0,
    pfEmployee: 0,
    esiEmployee: 0,
    professionalTax: 0,
    tds: 0,
    lossOfPay: 0,
    otherDeductions: 0,
    pfEmployer: 0,
    esiEmployer: 0,
  }

  // Paid workers (employees and interns) — same hours-based calculation
  if (workerType === 'paid_employee' || workerType === 'paid_intern') {
    return calculatePaidWorker(base, monthlySalary, settings, attendance)
  }

  // Unpaid workers — compute completion % for hours tracking but salary stays 0
  if (settings.expectedHoursPerMonth > 0) {
    base.completionPercentage = round2((attendance.totalHoursWorked / settings.expectedHoursPerMonth) * 100)
  }

  return base
}

/** Shared calculation for paid employees and paid interns — both use hours-based proration */
function calculatePaidWorker(
  base: PayrollCalculationResult,
  monthlySalary: number,
  settings: PayrollSettings,
  attendance: AttendanceSummary,
): PayrollCalculationResult {
  const expectedHours = settings.expectedHoursPerMonth
  const totalHoursWorked = attendance.totalHoursWorked

  let calculatedSalary = 0
  let completionPercentage = 0
  if (expectedHours > 0) {
    const ratio = totalHoursWorked / expectedHours
    completionPercentage = round2(ratio * 100)
    calculatedSalary = round2(monthlySalary * Math.min(ratio, 1))
  }

  const overtimeHoursUnpaid = totalHoursWorked > expectedHours ? round2(totalHoursWorked - expectedHours) : 0

  return {
    ...base,
    monthlySalary,
    calculatedSalary,
    overtimeHoursUnpaid,
    completionPercentage,
    grossEarnings: calculatedSalary,
    netPay: calculatedSalary,
    basic: calculatedSalary,
  }
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100
}
