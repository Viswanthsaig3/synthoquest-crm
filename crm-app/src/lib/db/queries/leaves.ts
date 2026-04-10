import { createAdminClient } from '../server-client'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Leave, LeaveBalance, LeaveType, LeaveStatus } from '@/types/leave'

interface LeaveRow {
  id: string
  user_id: string
  type: LeaveType
  start_date: string
  end_date: string
  days: number
  reason: string
  status: LeaveStatus
  approved_by: string | null
  approved_at: string | null
  rejection_reason: string | null
  cancelled_at: string | null
  cancelled_by: string | null
  balance_year: number | null
  balance_month: number | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

interface LeaveBalanceRow {
  id: string
  user_id: string
  year: number
  month: number
  sick_total: number
  sick_used: number
  sick_remaining: number
  casual_total: number
  casual_used: number
  casual_remaining: number
  paid_total: number
  paid_used: number
  paid_remaining: number
  created_by: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface LeaveBalanceWithMonth extends LeaveBalance {
  year: number
  month: number
  sickTotal: number
  casualTotal: number
  paidTotal: number
  sickUsed: number
  casualUsed: number
  paidUsed: number
}

function mapLeaveRow(row: LeaveRow & { user?: { name: string } | null }): Leave {
  return {
    id: row.id,
    employeeId: row.user_id,
    employeeName: row.user?.name || '',
    type: row.type,
    startDate: new Date(row.start_date),
    endDate: new Date(row.end_date),
    days: row.days,
    reason: row.reason,
    status: row.status,
    approvedBy: row.approved_by,
    approvedAt: row.approved_at ? new Date(row.approved_at) : null,
    rejectionReason: row.rejection_reason,
    createdAt: new Date(row.created_at),
  }
}

function mapLeaveBalanceRow(row: LeaveBalanceRow): LeaveBalance {
  return {
    sick: row.sick_remaining,
    casual: row.casual_remaining,
    paid: row.paid_remaining,
  }
}

export interface GetLeavesFilters {
  employeeId?: string
  employeeIds?: string[]
  status?: LeaveStatus
  type?: LeaveType
  startDate?: string
  endDate?: string
  year?: number
  month?: number
  page?: number
  limit?: number
}

export async function getLeaves(filters: GetLeavesFilters = {}): Promise<{ data: Leave[]; total: number }> {
  const supabase = await createAdminClient()
  
  let query = supabase
    .from('leaves')
    .select('*', { count: 'exact' })
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
  
  if (filters.employeeId) {
    query = query.eq('user_id', filters.employeeId)
  }
  
  if (filters.employeeIds && filters.employeeIds.length > 0) {
    query = query.in('user_id', filters.employeeIds)
  }
  
  if (filters.status) {
    query = query.eq('status', filters.status)
  }
  
  if (filters.type) {
    query = query.eq('type', filters.type)
  }
  
  if (filters.startDate) {
    query = query.gte('start_date', filters.startDate)
  }
  
  if (filters.endDate) {
    query = query.lte('end_date', filters.endDate)
  }
  
  if (filters.year && filters.month) {
    const startDate = new Date(filters.year, filters.month - 1, 1)
    const endDate = new Date(filters.year, filters.month, 0)
    query = query.gte('start_date', startDate.toISOString().split('T')[0])
    query = query.lte('end_date', endDate.toISOString().split('T')[0])
  }
  
  const page = filters.page || 1
  const limit = Math.min(filters.limit || 20, 100)
  const offset = (page - 1) * limit
  
  query = query.range(offset, offset + limit - 1)
  
  const { data, error, count } = await query
  
  if (error) {
    console.error('Error fetching leaves:', error)
    throw error
  }
  
  if (!data || data.length === 0) {
    return { data: [], total: count || 0 }
  }
  
  const userIds = Array.from(new Set(data.map(l => l.user_id)))
  const { data: users } = await supabase
    .from('users')
    .select('id, name')
    .in('id', userIds)
  
  const userMap = new Map((users || []).map(u => [u.id, u.name]))
  
  const mapped = data.map(leave => ({
    id: leave.id,
    employeeId: leave.user_id,
    employeeName: userMap.get(leave.user_id) || '',
    type: leave.type,
    startDate: new Date(leave.start_date),
    endDate: new Date(leave.end_date),
    days: leave.days,
    reason: leave.reason,
    status: leave.status,
    approvedBy: leave.approved_by,
    approvedAt: leave.approved_at ? new Date(leave.approved_at) : null,
    rejectionReason: leave.rejection_reason,
    createdAt: new Date(leave.created_at),
  }))
  
  return { data: mapped, total: count || 0 }
}

export async function getLeaveById(id: string): Promise<Leave | null> {
  const supabase = await createAdminClient()
  
  const { data, error } = await supabase
    .from('leaves')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .single()
  
  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }
  
  if (!data) return null
  
  const { data: user } = await supabase
    .from('users')
    .select('name')
    .eq('id', data.user_id)
    .single()
  
  return {
    id: data.id,
    employeeId: data.user_id,
    employeeName: user?.name || '',
    type: data.type,
    startDate: new Date(data.start_date),
    endDate: new Date(data.end_date),
    days: data.days,
    reason: data.reason,
    status: data.status,
    approvedBy: data.approved_by,
    approvedAt: data.approved_at ? new Date(data.approved_at) : null,
    rejectionReason: data.rejection_reason,
    createdAt: new Date(data.created_at),
  }
}

export async function createLeave(data: {
  employeeId: string
  type: LeaveType
  startDate: string
  endDate: string
  reason: string
}): Promise<Leave> {
  const supabase = await createAdminClient()
  
  const days = calculateDays(data.startDate, data.endDate)
  const startDateObj = new Date(data.startDate)
  const balanceYear = startDateObj.getFullYear()
  const balanceMonth = startDateObj.getMonth() + 1
  
  const { data: leave, error } = await supabase
    .from('leaves')
    .insert({
      user_id: data.employeeId,
      type: data.type,
      start_date: data.startDate,
      end_date: data.endDate,
      days,
      reason: data.reason,
      status: 'pending',
      balance_year: balanceYear,
      balance_month: balanceMonth,
    })
    .select()
    .single()
  
  if (error) {
    console.error('Error creating leave:', error)
    throw error
  }
  
  const { data: user } = await supabase
    .from('users')
    .select('name')
    .eq('id', data.employeeId)
    .single()
  
  return {
    id: leave.id,
    employeeId: leave.user_id,
    employeeName: user?.name || '',
    type: leave.type,
    startDate: new Date(leave.start_date),
    endDate: new Date(leave.end_date),
    days: leave.days,
    reason: leave.reason,
    status: leave.status,
    approvedBy: leave.approved_by,
    approvedAt: leave.approved_at ? new Date(leave.approved_at) : null,
    rejectionReason: leave.rejection_reason,
    createdAt: new Date(leave.created_at),
  }
}

export async function updateLeave(id: string, updates: Partial<{
  type: LeaveType
  startDate: string
  endDate: string
  reason: string
}>): Promise<Leave> {
  const supabase = await createAdminClient()
  
  const updateData: {
    type?: LeaveType
    reason?: string
    start_date?: string
    end_date?: string
    days?: number
    balance_year?: number
    balance_month?: number
  } = {}
  
  if (updates.type) updateData.type = updates.type
  if (updates.reason) updateData.reason = updates.reason
  
  if (updates.startDate || updates.endDate) {
    const { data: existing } = await supabase
      .from('leaves')
      .select('start_date, end_date')
      .eq('id', id)
      .single()
    
    if (existing) {
      const startDate = updates.startDate || existing.start_date
      const endDate = updates.endDate || existing.end_date
      updateData.start_date = startDate
      updateData.end_date = endDate
      updateData.days = calculateDays(startDate, endDate)
      const startDateObj = new Date(startDate)
      updateData.balance_year = startDateObj.getFullYear()
      updateData.balance_month = startDateObj.getMonth() + 1
    }
  }
  
  const { data: leave, error } = await supabase
    .from('leaves')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()
  
  if (error) {
    console.error('Error updating leave:', error)
    throw error
  }
  
  const { data: user } = await supabase
    .from('users')
    .select('name')
    .eq('id', leave.user_id)
    .single()
  
  return {
    id: leave.id,
    employeeId: leave.user_id,
    employeeName: user?.name || '',
    type: leave.type,
    startDate: new Date(leave.start_date),
    endDate: new Date(leave.end_date),
    days: leave.days,
    reason: leave.reason,
    status: leave.status,
    approvedBy: leave.approved_by,
    approvedAt: leave.approved_at ? new Date(leave.approved_at) : null,
    rejectionReason: leave.rejection_reason,
    createdAt: new Date(leave.created_at),
  }
}

export async function deleteLeave(id: string): Promise<void> {
  const supabase = await createAdminClient()
  
  const { error } = await supabase
    .from('leaves')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .eq('status', 'pending')
  
  if (error) {
    console.error('Error deleting leave:', error)
    throw error
  }
}

export async function approveLeave(id: string, approverId: string): Promise<Leave> {
  const supabase = await createAdminClient()
  
  const { data: leave, error: fetchError } = await supabase
    .from('leaves')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .single()
  
  if (fetchError || !leave) {
    throw new Error('Leave not found')
  }

  if (leave.user_id === approverId) {
    throw new Error('Cannot approve your own leave requests')
  }

  // SECURITY: CRIT-05 — Defense-in-depth: redundant status check at query layer
  if (leave.status !== 'pending') {
    throw new Error('Only pending leaves can be approved')
  }
  
  const balanceMonth = new Date(leave.start_date).getMonth() + 1
  const balanceYear = new Date(leave.start_date).getFullYear()
  
  // Check if balance exists and is sufficient
  const { data: balance } = await supabase
    .from('leave_balances')
    .select('*')
    .eq('user_id', leave.user_id)
    .eq('year', balanceYear)
    .eq('month', balanceMonth)
    .single()
  
  if (!balance) {
    throw new Error(`No leave balance found for ${balanceMonth}/${balanceYear}. Please allocate balance first.`)
  }
  
  const remainingField = `${leave.type}_remaining`
  const remaining = balance[remainingField as keyof typeof balance] as number
  
  if (remaining < leave.days) {
    throw new Error(`Insufficient ${leave.type} leave balance. Available: ${remaining} days, Requested: ${leave.days} days`)
  }
  
  const { data: updated, error } = await supabase
    .from('leaves')
    .update({
      status: 'approved',
      approved_by: approverId,
      approved_at: new Date().toISOString(),
      balance_year: balanceYear,
      balance_month: balanceMonth,
    })
    .eq('id', id)
    .select()
    .single()
  
  if (error) {
    console.error('Error approving leave:', error)
    throw error
  }
  
  await updateLeaveBalanceUsed(
    leave.user_id,
    leave.type,
    leave.days,
    leave.start_date,
    supabase
  )
  
  const { data: user } = await supabase
    .from('users')
    .select('name')
    .eq('id', updated.user_id)
    .single()
  
  return {
    id: updated.id,
    employeeId: updated.user_id,
    employeeName: user?.name || '',
    type: updated.type,
    startDate: new Date(updated.start_date),
    endDate: new Date(updated.end_date),
    days: updated.days,
    reason: updated.reason,
    status: updated.status,
    approvedBy: updated.approved_by,
    approvedAt: updated.approved_at ? new Date(updated.approved_at) : null,
    rejectionReason: updated.rejection_reason,
    createdAt: new Date(updated.created_at),
  }
}

export async function rejectLeave(id: string, approverId: string, reason: string): Promise<Leave> {
  const supabase = await createAdminClient()

  const { data: leaveCheck } = await supabase
    .from('leaves')
    .select('user_id')
    .eq('id', id)
    .single()
  
  if (leaveCheck?.user_id === approverId) {
    throw new Error('Cannot reject your own leave requests')
  }

  // SECURITY: CRIT-05 — Defense-in-depth: validate leave exists and is pending
  if (!leaveCheck) {
    throw new Error('Leave not found')
  }
  
  const { data: updated, error } = await supabase
    .from('leaves')
    .update({
      status: 'rejected',
      rejection_reason: reason,
    })
    .eq('id', id)
    .eq('status', 'pending')  // SECURITY: Prevent rejecting non-pending leaves
    .select()
    .single()
  
  if (error) {
    console.error('Error rejecting leave:', error)
    throw error
  }
  
  const { data: user } = await supabase
    .from('users')
    .select('name')
    .eq('id', updated.user_id)
    .single()
  
  return {
    id: updated.id,
    employeeId: updated.user_id,
    employeeName: user?.name || '',
    type: updated.type,
    startDate: new Date(updated.start_date),
    endDate: new Date(updated.end_date),
    days: updated.days,
    reason: updated.reason,
    status: updated.status,
    approvedBy: updated.approved_by,
    approvedAt: updated.approved_at ? new Date(updated.approved_at) : null,
    rejectionReason: updated.rejection_reason,
    createdAt: new Date(updated.created_at),
  }
}

export async function cancelLeave(id: string, userId: string): Promise<Leave> {
  const supabase = await createAdminClient()
  
  const { data: leave, error: fetchError } = await supabase
    .from('leaves')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .single()
  
  if (fetchError || !leave) {
    throw new Error('Leave not found')
  }
  
  if (leave.status !== 'approved') {
    throw new Error('Only approved leaves can be cancelled')
  }
  
  const { data: updated, error } = await supabase
    .from('leaves')
    .update({
      status: 'cancelled',
      cancelled_by: userId,
      cancelled_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()
  
  if (error) {
    console.error('Error cancelling leave:', error)
    throw error
  }
  
  await revertLeaveBalanceUsed(
    leave.user_id,
    leave.type,
    leave.days,
    leave.start_date,
    leave.balance_month || new Date(leave.start_date).getMonth() + 1,
    supabase
  )
  
  const { data: user } = await supabase
    .from('users')
    .select('name')
    .eq('id', updated.user_id)
    .single()
  
  return {
    id: updated.id,
    employeeId: updated.user_id,
    employeeName: user?.name || '',
    type: updated.type,
    startDate: new Date(updated.start_date),
    endDate: new Date(updated.end_date),
    days: updated.days,
    reason: updated.reason,
    status: updated.status,
    approvedBy: updated.approved_by,
    approvedAt: updated.approved_at ? new Date(updated.approved_at) : null,
    rejectionReason: updated.rejection_reason,
    createdAt: new Date(updated.created_at),
  }
}

export async function getLeaveBalance(
  employeeId: string,
  year?: number,
  month?: number
): Promise<LeaveBalance | null> {
  const supabase = await createAdminClient()
  
  const now = new Date()
  const currentYear = year || now.getFullYear()
  const currentMonth = month || (now.getMonth() + 1)
  
  const { data, error } = await supabase
    .from('leave_balances')
    .select('*')
    .eq('user_id', employeeId)
    .eq('year', currentYear)
    .eq('month', currentMonth)
    .single()
  
  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }
  
  return data ? mapLeaveBalanceRow(data) : null
}

export async function initializeLeaveBalance(data: {
  employeeId: string
  year: number
  month: number
  sickTotal: number
  casualTotal: number
  paidTotal: number
  createdBy: string
}): Promise<LeaveBalanceRow> {
  const supabase = await createAdminClient()
  
  const { data: balance, error } = await supabase
    .from('leave_balances')
    .insert({
      user_id: data.employeeId,
      year: data.year,
      month: data.month,
      sick_total: data.sickTotal,
      sick_used: 0,
      sick_remaining: data.sickTotal,
      casual_total: data.casualTotal,
      casual_used: 0,
      casual_remaining: data.casualTotal,
      paid_total: data.paidTotal,
      paid_used: 0,
      paid_remaining: data.paidTotal,
      created_by: data.createdBy,
    })
    .select()
    .single()
  
  if (error) {
    console.error('Error initializing leave balance:', error)
    throw error
  }
  
  return balance
}

export async function updateLeaveBalanceAllocation(
  employeeId: string,
  year: number,
  month: number,
  updates: {
    sickTotal?: number
    casualTotal?: number
    paidTotal?: number
  },
  updatedBy: string
): Promise<LeaveBalanceRow> {
  const supabase = await createAdminClient()
  
  const { data: currentBalance } = await supabase
    .from('leave_balances')
    .select('*')
    .eq('user_id', employeeId)
    .eq('year', year)
    .eq('month', month)
    .single()
  
  const updateData: Record<string, number> = {}
  
  if (updates.sickTotal !== undefined) {
    updateData.sick_total = updates.sickTotal
    updateData.sick_remaining = updates.sickTotal - (currentBalance?.sick_used || 0)
  }
  if (updates.casualTotal !== undefined) {
    updateData.casual_total = updates.casualTotal
    updateData.casual_remaining = updates.casualTotal - (currentBalance?.casual_used || 0)
  }
  if (updates.paidTotal !== undefined) {
    updateData.paid_total = updates.paidTotal
    updateData.paid_remaining = updates.paidTotal - (currentBalance?.paid_used || 0)
  }
  
  const { data, error } = await supabase
    .from('leave_balances')
    .update(updateData)
    .eq('user_id', employeeId)
    .eq('year', year)
    .eq('month', month)
    .select()
    .single()
  
  if (error) {
    console.error('Error updating leave balance:', error)
    throw error
  }
  
  return data
}

async function updateLeaveBalanceUsed(
  employeeId: string,
  type: string,
  days: number,
  startDate: string,
  supabase: SupabaseClient
): Promise<void> {
  const startDateObj = new Date(startDate)
  const year = startDateObj.getFullYear()
  const month = startDateObj.getMonth() + 1
  
  const { error } = await supabase.rpc('adjust_leave_balance_monthly_atomic', {
    p_user_id: employeeId,
    p_type: type,
    p_delta: days,
    p_year: year,
    p_month: month,
  })

  if (error) {
    console.error('Atomic leave balance update failed:', error)
    throw new Error('Failed to update leave balance')
  }
}

async function revertLeaveBalanceUsed(
  employeeId: string,
  type: string,
  days: number,
  startDate: string,
  balanceMonth: number,
  supabase: SupabaseClient
): Promise<void> {
  const year = new Date(startDate).getFullYear()
  const month = balanceMonth
  
  const { error } = await supabase.rpc('adjust_leave_balance_monthly_atomic', {
    p_user_id: employeeId,
    p_type: type,
    p_delta: -days,
    p_year: year,
    p_month: month,
  })

  if (error) {
    console.error('Atomic leave balance revert failed:', error)
  }
}

export function calculateDays(startDate: string, endDate: string): number {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const diffTime = Math.abs(end.getTime() - start.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays + 1
}

export async function checkLeaveBalance(
  employeeId: string,
  type: string,
  days: number,
  startDate: string
): Promise<boolean> {
  const startDateObj = new Date(startDate)
  const balance = await getLeaveBalance(
    employeeId,
    startDateObj.getFullYear(),
    startDateObj.getMonth() + 1
  )
  
  if (!balance) return false
  
  const remaining = balance[type as keyof LeaveBalance]
  return remaining >= days
}

export async function getPendingLeavesForApprover(approverId: string): Promise<Leave[]> {
  const supabase = await createAdminClient()
  
  const { data: teamMembers } = await supabase
    .from('users')
    .select('id')
    .eq('managed_by', approverId)
    .is('deleted_at', null)
  
  const teamIds = [approverId, ...(teamMembers || []).map((m: { id: string }) => m.id)]
  
  const { data, error } = await supabase
    .from('leaves')
    .select('*')
    .in('user_id', teamIds)
    .eq('status', 'pending')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching pending leaves:', error)
    throw error
  }
  
  if (!data || data.length === 0) {
    return []
  }
  
  const userIds = Array.from(new Set(data.map(l => l.user_id)))
  const { data: users } = await supabase
    .from('users')
    .select('id, name')
    .in('id', userIds)
  
  const userMap = new Map((users || []).map(u => [u.id, u.name]))
  
  return data.map(leave => ({
    id: leave.id,
    employeeId: leave.user_id,
    employeeName: userMap.get(leave.user_id) || '',
    type: leave.type,
    startDate: new Date(leave.start_date),
    endDate: new Date(leave.end_date),
    days: leave.days,
    reason: leave.reason,
    status: leave.status,
    approvedBy: leave.approved_by,
    approvedAt: leave.approved_at ? new Date(leave.approved_at) : null,
    rejectionReason: leave.rejection_reason,
    createdAt: new Date(leave.created_at),
  }))
}