import { apiFetch } from '@/lib/api/client'
import type {
  PayrollRecord,
  PayrollRecordWithEmployee,
  PayrollRun,
  PayrollSettings,
  PayrollSummary,
  PayrollFormData,
  MarkPaidData,
} from '@/types/payroll'

interface ApiEnvelope<T> {
  data: T
  pagination?: { page: number; limit: number; total: number }
}

export async function fetchPayrollSettings(): Promise<PayrollSettings> {
  const result = await apiFetch<ApiEnvelope<PayrollSettings>>('/payroll/settings')
  return result.data
}

export async function updatePayrollSettings(updates: Partial<PayrollSettings>): Promise<PayrollSettings> {
  const result = await apiFetch<ApiEnvelope<PayrollSettings>>('/payroll/settings', {
    method: 'PUT',
    body: JSON.stringify(updates),
  })
  return result.data
}

export async function fetchPayrollRecords(filters?: {
  month?: number
  year?: number
  userId?: string
  status?: string
  page?: number
  limit?: number
}): Promise<{ data: PayrollRecordWithEmployee[]; pagination: { page: number; limit: number; total: number } }> {
  const params = new URLSearchParams()
  if (filters?.month) params.set('month', String(filters.month))
  if (filters?.year) params.set('year', String(filters.year))
  if (filters?.userId) params.set('userId', filters.userId)
  if (filters?.status) params.set('status', filters.status)
  if (filters?.page) params.set('page', String(filters.page))
  if (filters?.limit) params.set('limit', String(filters.limit))

  const qs = params.toString()
  return await apiFetch(`/payroll${qs ? `?${qs}` : ''}`)
}

export async function fetchPayrollRecord(id: string): Promise<PayrollRecordWithEmployee> {
  const result = await apiFetch<ApiEnvelope<PayrollRecordWithEmployee>>(`/payroll/${id}`)
  return result.data
}

export async function runPayroll(data: PayrollFormData): Promise<{ run: PayrollRun; records: PayrollRecord[] }> {
  return await apiFetch('/payroll/run', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function markPayrollPaid(id: string, data: MarkPaidData): Promise<PayrollRecord> {
  const result = await apiFetch<ApiEnvelope<PayrollRecord>>(`/payroll/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
  return result.data
}

export async function fetchPayrollSummary(month?: number, year?: number): Promise<PayrollSummary> {
  const params = new URLSearchParams()
  if (month) params.set('month', String(month))
  if (year) params.set('year', String(year))

  const qs = params.toString()
  const result = await apiFetch<ApiEnvelope<PayrollSummary>>(`/payroll/summary${qs ? `?${qs}` : ''}`)
  return result.data
}

export async function fetchPayrollEligibleEmployees(): Promise<Array<{
  id: string
  name: string
  email: string
  department: string
  role: string
  avatar: string | null
  workerType: string
  label: string
  compensationAmount: number | null
  hasSalaryStructure: boolean
}>> {
  const result = await apiFetch<ApiEnvelope<Array<{
    id: string
    name: string
    email: string
    department: string
    role: string
    avatar: string | null
    workerType: string
    label: string
    compensationAmount: number | null
    hasSalaryStructure: boolean
  }>>>('/payroll/employees')
  return result.data
}

// ─── Hours Tracking ──────────────────────────────────────

export interface DailySession {
  checkIn: string | null
  checkOut: string | null
  hours: number
}

export interface DailyBreakdown {
  date: string
  sessions: DailySession[]
  totalHours: number
  status: string
}

export interface EmployeeHoursData {
  id: string
  name: string
  email: string
  avatar: string | null
  department: string
  role: string
  workerType: string
  workerLabel: string
  isPaid: boolean
  expectedHours: number
  totalHoursWorked: number
  completionPercentage: number
  avgDailyHours: number
  daysPresent: number
  totalDays: number
  absentDays: number
  paidLeaves: number
  unpaidLeaves: number
  halfDays: number
  overtimeHours: number
  monthlySalary: number
  calculatedSalary: number
  dailyBreakdown: DailyBreakdown[]
}

export interface HoursDataTotals {
  totalExpectedHours: number
  totalHoursWorked: number
  avgHoursPerEmployee: number
  totalDeficit: number
  employeeCount: number
}

export interface EmployeeHoursResponse {
  settings: {
    expectedHoursPerMonth: number
    standardWorkingHours: number
  }
  employees: EmployeeHoursData[]
  totals: HoursDataTotals
}

export async function fetchEmployeeHoursData(filters?: {
  month?: number
  year?: number
  department?: string
  workerType?: string
}): Promise<EmployeeHoursResponse> {
  const params = new URLSearchParams()
  if (filters?.month) params.set('month', String(filters.month))
  if (filters?.year) params.set('year', String(filters.year))
  if (filters?.department) params.set('department', filters.department)
  if (filters?.workerType) params.set('workerType', filters.workerType)

  const qs = params.toString()
  return await apiFetch(`/payroll/hours${qs ? `?${qs}` : ''}`)
}
