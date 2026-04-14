export type InternPaymentMethod = 'cash' | 'upi' | 'bank_transfer' | 'card' | 'cheque'

export interface InternPayment {
  id: string
  internId: string
  amount: number
  paymentMethod: InternPaymentMethod
  paymentDate: Date
  receiptNumber?: string
  notes?: string
  collectedBy?: string | null
  collectedByName?: string
  createdAt: Date
  updatedAt: Date
}

export interface CreateInternPaymentInput {
  amount: number
  paymentMethod: InternPaymentMethod
  paymentDate?: string
  receiptNumber?: string
  notes?: string
}

export interface UpdateInternPaymentInput {
  amount?: number
  paymentMethod?: InternPaymentMethod
  paymentDate?: string
  receiptNumber?: string
  notes?: string
}

export interface InternPaymentSummary {
  totalFee: number
  totalPaid: number
  remainingBalance: number
  payments: InternPayment[]
}