import { createAdminClient } from '../server-client'
import type { 
  InternPayment, 
  InternPaymentMethod,
  InternPaymentSummary,
  CreateInternPaymentInput,
  UpdateInternPaymentInput 
} from '@/types/intern-payment'

interface InternPaymentRow {
  id: string
  intern_id: string
  amount: number
  payment_method: InternPaymentMethod
  payment_date: string
  receipt_number: string | null
  notes: string | null
  collected_by: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
  users?: { name: string } | null
}

function mapPaymentRow(row: InternPaymentRow): InternPayment {
  const collector = row.users as unknown
  const collectorData = Array.isArray(collector) ? collector[0] : collector as { name: string } | null
  
  return {
    id: row.id,
    internId: row.intern_id,
    amount: row.amount,
    paymentMethod: row.payment_method,
    paymentDate: new Date(row.payment_date),
    receiptNumber: row.receipt_number || undefined,
    notes: row.notes || undefined,
    collectedBy: row.collected_by || undefined,
    collectedByName: collectorData?.name || undefined,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  }
}

export async function getInternPayments(internId: string): Promise<InternPayment[]> {
  const supabase = await createAdminClient()
  
  const { data, error } = await supabase
    .from('intern_payments')
    .select(`
      *,
      users!intern_payments_collected_by_fkey (
        name
      )
    `)
    .eq('intern_id', internId)
    .is('deleted_at', null)
    .order('payment_date', { ascending: false })
  
  if (error) throw error
  
  return (data || []).map(mapPaymentRow)
}

export async function getInternPaymentById(paymentId: string): Promise<InternPayment | null> {
  const supabase = await createAdminClient()
  
  const { data, error } = await supabase
    .from('intern_payments')
    .select(`
      *,
      users!intern_payments_collected_by_fkey (
        name
      )
    `)
    .eq('id', paymentId)
    .is('deleted_at', null)
    .single()
  
  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }
  
  return mapPaymentRow(data as InternPaymentRow)
}

export async function createInternPayment(
  internId: string,
  input: CreateInternPaymentInput,
  collectedBy?: string
): Promise<InternPayment> {
  const supabase = await createAdminClient()
  const now = new Date().toISOString()
  
  const insertData: Record<string, unknown> = {
    intern_id: internId,
    amount: input.amount,
    payment_method: input.paymentMethod,
    payment_date: input.paymentDate || new Date().toISOString().split('T')[0],
    receipt_number: input.receiptNumber || null,
    notes: input.notes || null,
    collected_by: collectedBy || null,
  }
  
  const { data, error } = await supabase
    .from('intern_payments')
    .insert(insertData)
    .select(`
      *,
      users!intern_payments_collected_by_fkey (
        name
      )
    `)
    .single()
  
  if (error) throw error
  
  return mapPaymentRow(data as InternPaymentRow)
}

export async function updateInternPayment(
  paymentId: string,
  input: UpdateInternPaymentInput
): Promise<InternPayment> {
  const supabase = await createAdminClient()
  const now = new Date().toISOString()
  
  const updateData: Record<string, unknown> = {
    updated_at: now,
  }
  
  if (input.amount !== undefined) updateData.amount = input.amount
  if (input.paymentMethod !== undefined) updateData.payment_method = input.paymentMethod
  if (input.paymentDate !== undefined) updateData.payment_date = input.paymentDate
  if (input.receiptNumber !== undefined) updateData.receipt_number = input.receiptNumber || null
  if (input.notes !== undefined) updateData.notes = input.notes || null
  
  const { data, error } = await supabase
    .from('intern_payments')
    .update(updateData)
    .eq('id', paymentId)
    .is('deleted_at', null)
    .select(`
      *,
      users!intern_payments_collected_by_fkey (
        name
      )
    `)
    .single()
  
  if (error) {
    if (error.code === 'PGRST116') throw new Error('Payment not found')
    throw error
  }
  
  return mapPaymentRow(data as InternPaymentRow)
}

export async function deleteInternPayment(paymentId: string): Promise<void> {
  const supabase = await createAdminClient()
  const now = new Date().toISOString()
  
  const { error } = await supabase
    .from('intern_payments')
    .update({ deleted_at: now, updated_at: now })
    .eq('id', paymentId)
  
  if (error) throw error
}

export async function getInternPaymentSummary(internId: string): Promise<InternPaymentSummary> {
  const supabase = await createAdminClient()
  
  // Get total fee and remaining balance from intern_profiles
  const { data: profile, error: profileError } = await supabase
    .from('intern_profiles')
    .select('total_fee, remaining_balance, fee_paid')
    .eq('user_id', internId)
    .single()
  
  if (profileError && profileError.code !== 'PGRST116') throw profileError
  
  // Get all payments
  const payments = await getInternPayments(internId)
  
  // Calculate totals
  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0)
  const totalFee = profile?.total_fee || 0
  const remainingBalance = profile?.remaining_balance || totalFee - totalPaid
  
  return {
    totalFee,
    totalPaid,
    remainingBalance,
    payments,
  }
}

export async function updateInternTotalFee(
  internId: string,
  totalFee: number
): Promise<void> {
  const supabase = await createAdminClient()
  const now = new Date().toISOString()
  
  const { error } = await supabase
    .from('intern_profiles')
    .update({ total_fee: totalFee, updated_at: now })
    .eq('user_id', internId)
  
  if (error) throw error
  
  // Trigger will automatically update remaining_balance
}