import { createAdminClient } from '@/lib/db/server-client'
import { getPayrollSettings, getAttendanceSummaryForMonth, createPayrollRun, createPayrollRecords } from '@/lib/db/queries/payroll'
import { getUsers } from '@/lib/db/queries/users'
import { getInternStipends } from '@/lib/db/queries/interns'
import { classifyWorker, isWorkerPayrollEligible } from '@/lib/payroll/worker-type'
import { calculatePayroll } from '@/lib/payroll/calculator'
import type { PayrollRecord, WorkerType } from '@/types/payroll'
import type { User } from '@/types/user'

export interface PayrollRunInput {
  month: number
  year: number
  selectedUserIds: string[]
  processedBy: string
  notes?: string
}

export interface PayrollRunResult {
  run: {
    id: string
    month: number
    year: number
    totalEmployees: number
    totalGross: number
    totalDeductions: number
    totalNet: number
  }
  records: PayrollRecord[]
  skipped: {
    userId: string
    reason: 'not_eligible' | 'already_processed'
  }[]
}

export async function runPayroll(input: PayrollRunInput): Promise<PayrollRunResult> {
  const settings = await getPayrollSettings()
  if (!settings) {
    throw new Error('Payroll settings not configured')
  }

  const { data: allUsers } = await getUsers({ limit: 1000, status: 'active' })
  
  const eligibleUsers = allUsers.filter((u) =>
    input.selectedUserIds.includes(u.id) && isWorkerPayrollEligible(u),
  )

  const skipped: PayrollRunResult['skipped'] = []
  
  for (const uid of input.selectedUserIds) {
    const user = allUsers.find((u) => u.id === uid)
    if (!user) continue
    
    if (!isWorkerPayrollEligible(user)) {
      skipped.push({ userId: uid, reason: 'not_eligible' })
    }
  }

  const supabase = await createAdminClient()
  const { data: existingRecords } = await supabase
    .from('payroll_records')
    .select('user_id')
    .in('user_id', input.selectedUserIds)
    .eq('month', input.month)
    .eq('year', input.year)
    .is('deleted_at', null)

  const processedUserIds = new Set((existingRecords || []).map((r) => r.user_id))
  for (const uid of Array.from(processedUserIds)) {
    if (!skipped.some((s) => s.userId === uid)) {
      skipped.push({ userId: uid, reason: 'already_processed' })
    }
  }

  const toProcess = eligibleUsers.filter((u) => !processedUserIds.has(u.id))
  
  if (toProcess.length === 0) {
    throw new Error('No eligible employees to process')
  }

  const internIds = toProcess.filter((u) => u.role === 'intern').map((u) => u.id)
  const internStipends = await getInternStipends(internIds)

  const records: Array<Omit<PayrollRecord, 'id' | 'createdAt' | 'updatedAt' | 'employeeName' | 'employeeDepartment' | 'employeeRole' | 'employeeEmail' | 'employeeAvatar'>> = []

  for (const emp of toProcess) {
    const classification = classifyWorker(emp)
    const attendance = await getAttendanceSummaryForMonth(emp.id, input.month, input.year)

    let monthlySalary = emp.compensationAmount ?? 0
    if (classification.isIntern) {
      monthlySalary = internStipends.get(emp.id) ?? emp.compensationAmount ?? 0
    }

    const calcResult = calculatePayroll({
      workerType: classification.workerType,
      monthlySalary,
      settings,
      attendance,
    })

    records.push({
      payrollRunId: null,
      userId: emp.id,
      month: input.month,
      year: input.year,
      workerType: classification.workerType as WorkerType,
      totalDays: calcResult.totalDays,
      presentDays: calcResult.presentDays,
      absentDays: calcResult.absentDays,
      paidLeaves: calcResult.paidLeaves,
      unpaidLeaves: calcResult.unpaidLeaves,
      halfDays: calcResult.halfDays,
      payableDays: calcResult.payableDays,
      overtimeHours: calcResult.overtimeHours,
      basic: calcResult.basic,
      hra: calcResult.hra,
      conveyanceAllowance: calcResult.conveyanceAllowance,
      medicalAllowance: calcResult.medicalAllowance,
      specialAllowance: calcResult.specialAllowance,
      overtimePay: calcResult.overtimePay,
      grossEarnings: calcResult.grossEarnings,
      pfEmployee: calcResult.pfEmployee,
      esiEmployee: calcResult.esiEmployee,
      professionalTax: calcResult.professionalTax,
      tds: calcResult.tds,
      lossOfPay: calcResult.lossOfPay,
      otherDeductions: calcResult.otherDeductions,
      totalDeductions: calcResult.totalDeductions,
      pfEmployer: calcResult.pfEmployer,
      esiEmployer: calcResult.esiEmployer,
      netPay: calcResult.netPay,
      status: 'processed',
      paidOn: null,
      paymentMethod: null,
      paymentReference: null,
      payslipNumber: null,
      payslipGeneratedAt: null,
      generatedBy: input.processedBy,
      approvedBy: null,
      approvedAt: null,
      notes: input.notes || null,
    })
  }

  const totalGross = records.reduce((sum, r) => sum + r.grossEarnings, 0)
  const totalDeductions = records.reduce((sum, r) => sum + r.totalDeductions, 0)
  const totalNet = records.reduce((sum, r) => sum + r.netPay, 0)

  const run = await createPayrollRun({
    month: input.month,
    year: input.year,
    runType: 'regular',
    processedBy: input.processedBy,
    totalEmployees: records.length,
    totalGross,
    totalDeductions,
    totalNet,
    notes: input.notes,
  })

  for (const record of records) {
    record.payrollRunId = run.id
  }

  const createdRecords = await createPayrollRecords(records)

  return {
    run: {
      id: run.id,
      month: run.month,
      year: run.year,
      totalEmployees: run.totalEmployees,
      totalGross: run.totalGross,
      totalDeductions: run.totalDeductions,
      totalNet: run.totalNet,
    },
    records: createdRecords,
    skipped,
  }
}