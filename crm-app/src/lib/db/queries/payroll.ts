import { createAdminClient } from '../server-client'
import type {
  PayrollRecord,
  PayrollRecordWithEmployee,
  PayrollRun,
  PayrollSettings,
  SalaryStructure,
  PayrollSummary,
  WorkerType,
  MarkPaidData,
} from '@/types/payroll'

interface PayrollSettingsRow {
  id: string
  basic_percentage: number
  hra_percentage: number
  conveyance_allowance: number
  medical_allowance: number
  special_allowance_type: string
  pf_employee_rate: number
  pf_employer_rate: number
  esi_employee_rate: number
  esi_employer_rate: number
  esi_threshold: number
  professional_tax: number
  payroll_day: number
  pay_period_start: number
  pay_period_end: number
  overtime_rate_multiplier: number
  standard_working_hours: number
  expected_hours_per_month: number
  updated_at: string
  updated_by: string | null
}

function mapSettingsRow(row: PayrollSettingsRow): PayrollSettings {
  return {
    id: row.id,
    basicPercentage: row.basic_percentage,
    hraPercentage: row.hra_percentage,
    conveyanceAllowance: row.conveyance_allowance,
    medicalAllowance: row.medical_allowance,
    specialAllowanceType: row.special_allowance_type,
    pfEmployeeRate: row.pf_employee_rate,
    pfEmployerRate: row.pf_employer_rate,
    esiEmployeeRate: row.esi_employee_rate,
    esiEmployerRate: row.esi_employer_rate,
    esiThreshold: row.esi_threshold,
    professionalTax: row.professional_tax,
    payrollDay: row.payroll_day,
    payPeriodStart: row.pay_period_start,
    payPeriodEnd: row.pay_period_end,
    overtimeRateMultiplier: row.overtime_rate_multiplier,
    standardWorkingHours: row.standard_working_hours,
    expectedHoursPerMonth: row.expected_hours_per_month,
    updatedAt: row.updated_at,
    updatedBy: row.updated_by,
  }
}

interface SalaryStructureRow {
  id: string
  user_id: string
  ctc: number
  gross_monthly: number
  basic: number
  hra: number
  conveyance_allowance: number
  medical_allowance: number
  special_allowance: number
  pf_applicable: boolean
  esi_applicable: boolean
  effective_from: string
  effective_to: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

function mapStructureRow(row: SalaryStructureRow): SalaryStructure {
  return {
    id: row.id,
    userId: row.user_id,
    ctc: row.ctc,
    grossMonthly: row.gross_monthly,
    basic: row.basic,
    hra: row.hra,
    conveyanceAllowance: row.conveyance_allowance,
    medicalAllowance: row.medical_allowance,
    specialAllowance: row.special_allowance,
    pfApplicable: row.pf_applicable,
    esiApplicable: row.esi_applicable,
    effectiveFrom: row.effective_from,
    effectiveTo: row.effective_to,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

interface PayrollRunRow {
  id: string
  month: number
  year: number
  status: 'draft' | 'processing' | 'completed' | 'locked'
  run_type: 'regular' | 'supplementary' | 'off_cycle'
  total_employees: number
  total_gross: number
  total_deductions: number
  total_net: number
  processed_at: string | null
  processed_by: string | null
  locked_at: string | null
  locked_by: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

function mapRunRow(row: PayrollRunRow): PayrollRun {
  return {
    id: row.id,
    month: row.month,
    year: row.year,
    status: row.status,
    runType: row.run_type,
    totalEmployees: row.total_employees,
    totalGross: row.total_gross,
    totalDeductions: row.total_deductions,
    totalNet: row.total_net,
    processedAt: row.processed_at,
    processedBy: row.processed_by,
    lockedAt: row.locked_at,
    lockedBy: row.locked_by,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

interface PayrollRecordRow {
  id: string
  payroll_run_id: string | null
  user_id: string
  month: number
  year: number
  worker_type: WorkerType
  total_days: number
  present_days: number
  absent_days: number
  paid_leaves: number
  unpaid_leaves: number
  half_days: number
  payable_days: number
  overtime_hours: number
  basic: number
  hra: number
  conveyance_allowance: number
  medical_allowance: number
  special_allowance: number
  overtime_pay: number
  gross_earnings: number
  pf_employee: number
  esi_employee: number
  professional_tax: number
  tds: number
  loss_of_pay: number
  other_deductions: number
  total_deductions: number
  pf_employer: number
  esi_employer: number
  net_pay: number
  status: 'draft' | 'processed' | 'paid' | 'cancelled'
  paid_on: string | null
  payment_method: string | null
  payment_reference: string | null
  payslip_number: string | null
  payslip_generated_at: string | null
  generated_by: string | null
  approved_by: string | null
  approved_at: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

function mapRecordRow(row: PayrollRecordRow & { user_name?: string; user_department?: string; user_role?: string; user_email?: string; user_avatar?: string | null }): PayrollRecordWithEmployee {
  return {
    id: row.id,
    payrollRunId: row.payroll_run_id,
    userId: row.user_id,
    employeeName: row.user_name || '',
    employeeDepartment: row.user_department || '',
    employeeRole: row.user_role || '',
    employeeEmail: row.user_email || '',
    employeeAvatar: row.user_avatar || null,
    month: row.month,
    year: row.year,
    workerType: row.worker_type,
    totalDays: row.total_days,
    presentDays: row.present_days,
    absentDays: row.absent_days,
    paidLeaves: row.paid_leaves,
    unpaidLeaves: row.unpaid_leaves,
    halfDays: row.half_days,
    payableDays: row.payable_days,
    overtimeHours: row.overtime_hours,
    basic: row.basic,
    hra: row.hra,
    conveyanceAllowance: row.conveyance_allowance,
    medicalAllowance: row.medical_allowance,
    specialAllowance: row.special_allowance,
    overtimePay: row.overtime_pay,
    grossEarnings: row.gross_earnings,
    pfEmployee: row.pf_employee,
    esiEmployee: row.esi_employee,
    professionalTax: row.professional_tax,
    tds: row.tds,
    lossOfPay: row.loss_of_pay,
    otherDeductions: row.other_deductions,
    totalDeductions: row.total_deductions,
    pfEmployer: row.pf_employer,
    esiEmployer: row.esi_employer,
    netPay: row.net_pay,
    status: row.status,
    paidOn: row.paid_on,
    paymentMethod: row.payment_method as PayrollRecord['paymentMethod'],
    paymentReference: row.payment_reference,
    payslipNumber: row.payslip_number,
    payslipGeneratedAt: row.payslip_generated_at,
    generatedBy: row.generated_by,
    approvedBy: row.approved_by,
    approvedAt: row.approved_at,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function getPayrollSettings(): Promise<PayrollSettings | null> {
  const supabase = await createAdminClient()
  const { data, error } = await supabase
    .from('payroll_settings')
    .select('*')
    .limit(1)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }
  return mapSettingsRow(data as PayrollSettingsRow)
}

export async function updatePayrollSettings(
  settingsId: string,
  updates: Partial<PayrollSettings>,
  updatedBy: string,
): Promise<PayrollSettings> {
  const supabase = await createAdminClient()
  const payload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
    updated_by: updatedBy,
  }

  if (updates.basicPercentage !== undefined) payload.basic_percentage = updates.basicPercentage
  if (updates.hraPercentage !== undefined) payload.hra_percentage = updates.hraPercentage
  if (updates.conveyanceAllowance !== undefined) payload.conveyance_allowance = updates.conveyanceAllowance
  if (updates.medicalAllowance !== undefined) payload.medical_allowance = updates.medicalAllowance
  if (updates.pfEmployeeRate !== undefined) payload.pf_employee_rate = updates.pfEmployeeRate
  if (updates.pfEmployerRate !== undefined) payload.pf_employer_rate = updates.pfEmployerRate
  if (updates.esiEmployeeRate !== undefined) payload.esi_employee_rate = updates.esiEmployeeRate
  if (updates.esiEmployerRate !== undefined) payload.esi_employer_rate = updates.esiEmployerRate
  if (updates.esiThreshold !== undefined) payload.esi_threshold = updates.esiThreshold
  if (updates.professionalTax !== undefined) payload.professional_tax = updates.professionalTax
  if (updates.payrollDay !== undefined) payload.payroll_day = updates.payrollDay
  if (updates.overtimeRateMultiplier !== undefined) payload.overtime_rate_multiplier = updates.overtimeRateMultiplier
  if (updates.standardWorkingHours !== undefined) payload.standard_working_hours = updates.standardWorkingHours

  const { data, error } = await supabase
    .from('payroll_settings')
    .update(payload)
    .eq('id', settingsId)
    .select()
    .single()

  if (error) throw error
  return mapSettingsRow(data as PayrollSettingsRow)
}

export async function getSalaryStructure(userId: string): Promise<SalaryStructure | null> {
  const supabase = await createAdminClient()
  const { data, error } = await supabase
    .from('salary_structures')
    .select('*')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .is('effective_to', null)
    .order('effective_from', { ascending: false })
    .limit(1)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }
  return mapStructureRow(data as SalaryStructureRow)
}

export async function createSalaryStructure(input: {
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
  createdBy: string
}): Promise<SalaryStructure> {
  const supabase = await createAdminClient()

  const { data: current, error: endError } = await supabase
    .from('salary_structures')
    .update({ effective_to: new Date().toISOString().split('T')[0] })
    .eq('user_id', input.userId)
    .is('effective_to', null)
    .is('deleted_at', null)
    .select()

  if (endError) throw endError

  const { data, error } = await supabase
    .from('salary_structures')
    .insert({
      user_id: input.userId,
      ctc: input.ctc,
      gross_monthly: input.grossMonthly,
      basic: input.basic,
      hra: input.hra,
      conveyance_allowance: input.conveyanceAllowance ?? 0,
      medical_allowance: input.medicalAllowance ?? 0,
      special_allowance: input.specialAllowance ?? 0,
      pf_applicable: input.pfApplicable ?? true,
      esi_applicable: input.esiApplicable ?? true,
      effective_from: input.effectiveFrom ?? new Date().toISOString().split('T')[0],
      created_by: input.createdBy,
    })
    .select()
    .single()

  if (error) throw error
  return mapStructureRow(data as SalaryStructureRow)
}

export async function getPayrollRecords(filters?: {
  month?: number
  year?: number
  userId?: string
  status?: string
  page?: number
  limit?: number
}): Promise<{ data: PayrollRecordWithEmployee[]; pagination: { page: number; limit: number; total: number } }> {
  const supabase = await createAdminClient()
  const page = filters?.page || 1
  const limit = Math.min(filters?.limit || 20, 100)
  const start = (page - 1) * limit
  const end = start + limit - 1

  let query = supabase
    .from('payroll_records')
    .select('*, users!payroll_records_user_id_fkey(name, department, role, email, avatar)', { count: 'exact' })
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .range(start, end)

  if (filters?.month) query = query.eq('month', filters.month)
  if (filters?.year) query = query.eq('year', filters.year)
  if (filters?.userId) query = query.eq('user_id', filters.userId)
  if (filters?.status) query = query.eq('status', filters.status)

  const { data, error, count } = await query
  if (error) throw error

  const records = (data || []).map((row) => {
    const user = row.users as Record<string, unknown> | null
    return mapRecordRow({
      ...row,
      user_name: user?.name as string || '',
      user_department: user?.department as string || '',
      user_role: user?.role as string || '',
      user_email: user?.email as string || '',
      user_avatar: user?.avatar as string | null || null,
    })
  })

  return {
    data: records,
    pagination: { page, limit, total: count || 0 },
  }
}

export async function getPayrollRecordById(id: string): Promise<PayrollRecordWithEmployee | null> {
  const supabase = await createAdminClient()
  const { data, error } = await supabase
    .from('payroll_records')
    .select('*, users!payroll_records_user_id_fkey(name, department, role, email, avatar)')
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }

  const user = data.users as Record<string, unknown> | null
  return mapRecordRow({
    ...data,
    user_name: user?.name as string || '',
    user_department: user?.department as string || '',
    user_role: user?.role as string || '',
    user_email: user?.email as string || '',
    user_avatar: user?.avatar as string | null || null,
  })
}

export async function createPayrollRecords(
  records: Array<Omit<PayrollRecord, 'id' | 'createdAt' | 'updatedAt' | 'employeeName' | 'employeeDepartment' | 'employeeRole' | 'employeeEmail' | 'employeeAvatar'>>,
): Promise<PayrollRecord[]> {
  const supabase = await createAdminClient()
  const rows = records.map((r) => ({
    payroll_run_id: r.payrollRunId,
    user_id: r.userId,
    month: r.month,
    year: r.year,
    worker_type: r.workerType,
    total_days: r.totalDays,
    present_days: r.presentDays,
    absent_days: r.absentDays,
    paid_leaves: r.paidLeaves,
    unpaid_leaves: r.unpaidLeaves,
    half_days: r.halfDays,
    payable_days: r.payableDays,
    overtime_hours: r.overtimeHours,
    basic: r.basic,
    hra: r.hra,
    conveyance_allowance: r.conveyanceAllowance,
    medical_allowance: r.medicalAllowance,
    special_allowance: r.specialAllowance,
    overtime_pay: r.overtimePay,
    gross_earnings: r.grossEarnings,
    pf_employee: r.pfEmployee,
    esi_employee: r.esiEmployee,
    professional_tax: r.professionalTax,
    tds: r.tds,
    loss_of_pay: r.lossOfPay,
    other_deductions: r.otherDeductions,
    total_deductions: r.totalDeductions,
    pf_employer: r.pfEmployer,
    esi_employer: r.esiEmployer,
    net_pay: r.netPay,
    status: r.status,
    generated_by: r.generatedBy,
    notes: r.notes,
  }))

  const { data, error } = await supabase
    .from('payroll_records')
    .insert(rows)
    .select()

  if (error) throw error
  return data as PayrollRecord[]
}

export async function updatePayrollRecord(
  id: string,
  updates: Partial<PayrollRecord>,
): Promise<PayrollRecord> {
  const supabase = await createAdminClient()
  const payload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }

  if (updates.status !== undefined) payload.status = updates.status
  if (updates.paidOn !== undefined) payload.paid_on = updates.paidOn
  if (updates.paymentMethod !== undefined) payload.payment_method = updates.paymentMethod
  if (updates.paymentReference !== undefined) payload.payment_reference = updates.paymentReference
  if (updates.approvedBy !== undefined) payload.approved_by = updates.approvedBy
  if (updates.approvedAt !== undefined) payload.approved_at = updates.approvedAt
  if (updates.notes !== undefined) payload.notes = updates.notes
  if (updates.payslipNumber !== undefined) payload.payslip_number = updates.payslipNumber
  if (updates.payslipGeneratedAt !== undefined) payload.payslip_generated_at = updates.payslipGeneratedAt

  const { data, error } = await supabase
    .from('payroll_records')
    .update(payload)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as PayrollRecord
}

export async function markPayrollPaid(id: string, paidData: MarkPaidData): Promise<PayrollRecord> {
  return updatePayrollRecord(id, {
    status: 'paid',
    paidOn: paidData.paidOn,
    paymentMethod: paidData.paymentMethod,
    paymentReference: paidData.paymentReference,
  })
}

export async function createPayrollRun(input: {
  month: number
  year: number
  runType: 'regular' | 'supplementary' | 'off_cycle'
  processedBy: string
  totalEmployees: number
  totalGross: number
  totalDeductions: number
  totalNet: number
  notes?: string
}): Promise<PayrollRun> {
  const supabase = await createAdminClient()
  const { data, error } = await supabase
    .from('payroll_runs')
    .insert({
      month: input.month,
      year: input.year,
      run_type: input.runType,
      status: 'completed',
      processed_by: input.processedBy,
      processed_at: new Date().toISOString(),
      total_employees: input.totalEmployees,
      total_gross: input.totalGross,
      total_deductions: input.totalDeductions,
      total_net: input.totalNet,
      notes: input.notes,
    })
    .select()
    .single()

  if (error) throw error
  return mapRunRow(data as PayrollRunRow)
}

export async function getPayrollRuns(filters?: {
  month?: number
  year?: number
  page?: number
  limit?: number
}): Promise<{ data: PayrollRun[]; pagination: { page: number; limit: number; total: number } }> {
  const supabase = await createAdminClient()
  const page = filters?.page || 1
  const limit = Math.min(filters?.limit || 20, 100)
  const start = (page - 1) * limit
  const end = start + limit - 1

  let query = supabase
    .from('payroll_runs')
    .select('*', { count: 'exact' })
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .range(start, end)

  if (filters?.month) query = query.eq('month', filters.month)
  if (filters?.year) query = query.eq('year', filters.year)

  const { data, error, count } = await query
  if (error) throw error

  return {
    data: (data || []).map((r) => mapRunRow(r as PayrollRunRow)),
    pagination: { page, limit, total: count || 0 },
  }
}

export async function getPayrollSummary(month?: number, year?: number): Promise<PayrollSummary> {
  const supabase = await createAdminClient()
  let query = supabase
    .from('payroll_records')
    .select('status, net_pay, gross_earnings, total_deductions')
    .is('deleted_at', null)

  if (month) query = query.eq('month', month)
  if (year) query = query.eq('year', year)

  const { data, error } = await query
  if (error) throw error

  const records = data || []
  const summary: PayrollSummary = {
    totalPaid: 0,
    totalProcessed: 0,
    totalPending: 0,
    paidCount: 0,
    processedCount: 0,
    pendingCount: 0,
    totalEmployees: records.length,
  }

  for (const r of records) {
    if (r.status === 'paid') {
      summary.totalPaid += Number(r.net_pay) || 0
      summary.paidCount++
    } else if (r.status === 'processed') {
      summary.totalProcessed += Number(r.net_pay) || 0
      summary.processedCount++
    } else {
      summary.totalPending += Number(r.net_pay) || 0
      summary.pendingCount++
    }
  }

  return summary
}

export async function getAttendanceSummaryForMonth(
  userId: string,
  month: number,
  year: number,
): Promise<{
  totalDays: number
  presentDays: number
  absentDays: number
  paidLeaves: number
  unpaidLeaves: number
  halfDays: number
  overtimeHours: number
  totalHoursWorked: number
}> {
  const supabase = await createAdminClient()

  const startDate = `${year}-${String(month).padStart(2, '0')}-01`
  const endDate = `${year}-${String(month).padStart(2, '0')}-${new Date(year, month, 0).getDate()}`

  const { data: attendance, error: attError } = await supabase
    .from('attendance_records')
    .select('status, total_hours')
    .eq('user_id', userId)
    .gte('date', startDate)
    .lte('date', endDate)
    .is('deleted_at', null)

  if (attError) throw attError

  const { data: leaves, error: leaveError } = await supabase
    .from('leaves')
    .select('type, days, status')
    .eq('user_id', userId)
    .gte('start_date', startDate)
    .lte('end_date', endDate)
    .eq('status', 'approved')
    .is('deleted_at', null)

  if (leaveError) throw leaveError

  const totalDays = new Date(year, month, 0).getDate()
  let presentDays = 0
  let absentDays = 0
  let halfDays = 0
  let totalHoursWorked = 0

  for (const a of attendance || []) {
    if (a.status === 'present') presentDays++
    else if (a.status === 'absent') absentDays++
    else if (a.status === 'half_day') halfDays++
    else if (a.status === 'late') presentDays++

    const hours = Number(a.total_hours) || 0
    totalHoursWorked += hours
  }

  let paidLeaves = 0
  let unpaidLeaves = 0

  for (const l of leaves || []) {
    const days = Number(l.days) || 0
    if (l.type === 'sick' || l.type === 'casual' || l.type === 'paid') {
      paidLeaves += days
    } else {
      unpaidLeaves += days
    }
  }

  const settings = await getPayrollSettings()
  const expectedDailyHours = settings?.standardWorkingHours || 8
  const overtimeHours = Math.max(0, totalHoursWorked - (presentDays + paidLeaves + halfDays * 0.5) * expectedDailyHours)

  return {
    totalDays,
    presentDays,
    absentDays,
    paidLeaves,
    unpaidLeaves,
    halfDays,
    overtimeHours: Math.round(overtimeHours * 100) / 100,
    totalHoursWorked: Math.round(totalHoursWorked * 100) / 100,
  }
}

export async function payrollRecordExists(userId: string, month: number, year: number): Promise<boolean> {
  const supabase = await createAdminClient()
  const { data, error } = await supabase
    .from('payroll_records')
    .select('id')
    .eq('user_id', userId)
    .eq('month', month)
    .eq('year', year)
    .is('deleted_at', null)
    .limit(1)

  if (error) throw error
  return (data || []).length > 0
}
