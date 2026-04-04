export type PaymentStatus = 'pending' | 'partial' | 'paid' | 'overdue' | 'refunded'
export type PaymentMethod = 'cash' | 'card' | 'upi' | 'bank_transfer' | 'cheque'
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'cancelled'

export interface Payment {
  id: string
  studentId: string
  studentName: string
  enrollmentId: string
  courseName: string
  batchName: string
  amount: number
  method: PaymentMethod
  status: PaymentStatus
  transactionId?: string
  receiptNumber: string
  paidAt?: Date
  dueDate?: Date
  notes?: string
  collectedBy: string
  createdAt: Date
  updatedAt: Date
}

export interface Invoice {
  id: string
  invoiceNumber: string
  studentId: string
  studentName: string
  studentEmail: string
  studentPhone: string
  enrollmentId: string
  courseName: string
  batchName: string
  items: InvoiceItem[]
  subtotal: number
  discount: number
  tax: number
  total: number
  paidAmount: number
  dueAmount: number
  status: InvoiceStatus
  issuedAt: Date
  dueDate: Date
  paidAt?: Date
  createdBy: string
  createdAt: Date
}

export interface InvoiceItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
  total: number
}

export interface PaymentPlan {
  id: string
  name: string
  installments: PaymentInstallment[]
  totalAmount: number
  description: string
}

export interface PaymentInstallment {
  id: string
  installmentNumber: number
  amount: number
  dueDate: Date
  status: 'pending' | 'paid' | 'overdue'
  paidAt?: Date
}