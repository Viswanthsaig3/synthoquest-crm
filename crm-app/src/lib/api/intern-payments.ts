import type { 
  InternPayment, 
  InternPaymentSummary,
  InternPaymentMethod,
  CreateInternPaymentInput,
  UpdateInternPaymentInput 
} from '@/types/intern-payment'
import { apiFetch } from '@/lib/api/client'

export async function getInternPayments(internId: string): Promise<{ data: InternPayment[] }> {
  return apiFetch(`/interns/${internId}/payments`)
}

export async function getInternPaymentSummary(internId: string): Promise<{ data: InternPaymentSummary }> {
  return apiFetch(`/interns/${internId}/payments?summary=true`)
}

export async function createInternPayment(
  internId: string,
  input: CreateInternPaymentInput
): Promise<{ data: InternPayment; message: string }> {
  return apiFetch(`/interns/${internId}/payments`, {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export async function getInternPaymentById(
  internId: string,
  paymentId: string
): Promise<{ data: InternPayment }> {
  return apiFetch(`/interns/${internId}/payments/${paymentId}`)
}

export async function updateInternPayment(
  internId: string,
  paymentId: string,
  input: UpdateInternPaymentInput
): Promise<{ data: InternPayment; message: string }> {
  return apiFetch(`/interns/${internId}/payments/${paymentId}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  })
}

export async function deleteInternPayment(
  internId: string,
  paymentId: string
): Promise<{ message: string }> {
  return apiFetch(`/interns/${internId}/payments/${paymentId}`, {
    method: 'DELETE',
  })
}