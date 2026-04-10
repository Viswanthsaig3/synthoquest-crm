import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/middleware'
import { hasPermission } from '@/lib/auth/authorization'
import {
  createPayrollRun,
  createPayrollRecords,
  getPayrollSettings,
  getAttendanceSummaryForMonth,
  payrollRecordExists,
} from '@/lib/db/queries/payroll'
import { getUsers } from '@/lib/db/queries/users'
import { classifyWorker, isWorkerPayrollEligible } from '@/lib/payroll/worker-type'
import { calculatePayroll } from '@/lib/payroll/calculator'
import { createAdminClient } from '@/lib/db/server-client'
import { z } from 'zod'
import type { PayrollRecord, WorkerType } from '@/types/payroll'

const runSchema = z.object({
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2020).max(2100),
  selectedUserIds: z.array(z.string().uuid()).min(1),
  notes: z.string().optional(),
})

export async function POST(request: NextRequest) {
  return withAuth(request, async (user) => {
    try {
      if (!(await hasPermission(user, 'payroll.process'))) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      const body = await request.json()
      const validated = runSchema.parse(body)

      const settings = await getPayrollSettings()
      if (!settings) {
        return NextResponse.json({ error: 'Payroll settings not configured' }, { status: 400 })
      }

      const { data: allUsers } = await getUsers({ limit: 1000, status: 'active' })
      const eligibleUsers = allUsers.filter((u) =>
        validated.selectedUserIds.includes(u.id) && isWorkerPayrollEligible(u),
      )

      if (eligibleUsers.length === 0) {
        return NextResponse.json(
          { error: 'No eligible employees found for payroll' },
          { status: 400 },
        )
      }

      const alreadyProcessed: string[] = []
      for (const uid of validated.selectedUserIds) {
        if (await payrollRecordExists(uid, validated.month, validated.year)) {
          alreadyProcessed.push(uid)
        }
      }

      const toProcess = eligibleUsers.filter((u) => !alreadyProcessed.includes(u.id))
      if (toProcess.length === 0) {
        return NextResponse.json(
          { error: 'All selected employees already have payroll records for this period' },
          { status: 400 },
        )
      }

      const supabase = await createAdminClient()
      const records: Array<Omit<PayrollRecord, 'id' | 'createdAt' | 'updatedAt' | 'employeeName' | 'employeeDepartment' | 'employeeRole' | 'employeeEmail' | 'employeeAvatar'>> = []

      for (const emp of toProcess) {
        const classification = classifyWorker(emp)
        const attendance = await getAttendanceSummaryForMonth(emp.id, validated.month, validated.year)

        // Resolve the monthly salary: use compensation_amount for employees,
        // or intern_profiles.stipend for interns, falling back to compensation_amount
        let monthlySalary = emp.compensationAmount ?? 0
        if (classification.isIntern) {
          const { data: internProfile } = await supabase
            .from('intern_profiles')
            .select('stipend')
            .eq('user_id', emp.id)
            .single()
          monthlySalary = internProfile?.stipend ?? emp.compensationAmount ?? 0
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
          month: validated.month,
          year: validated.year,
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
          generatedBy: user.userId,
          approvedBy: null,
          approvedAt: null,
          notes: validated.notes || null,
        })
      }

      const totalGross = records.reduce((sum, r) => sum + r.grossEarnings, 0)
      const totalDeductions = records.reduce((sum, r) => sum + r.totalDeductions, 0)
      const totalNet = records.reduce((sum, r) => sum + r.netPay, 0)

      const run = await createPayrollRun({
        month: validated.month,
        year: validated.year,
        runType: 'regular',
        processedBy: user.userId,
        totalEmployees: records.length,
        totalGross,
        totalDeductions,
        totalNet,
        notes: validated.notes,
      })

      for (const record of records) {
        record.payrollRunId = run.id
      }

      const createdRecords = await createPayrollRecords(records)

      return NextResponse.json({
        run,
        records: createdRecords,
      }, { status: 201 })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Validation error', details: error.errors },
          { status: 400 },
        )
      }
      console.error('POST /api/payroll/run error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  })
}
