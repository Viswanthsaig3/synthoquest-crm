import { NextRequest, NextResponse } from 'next/server'
import { withAuth, type AuthenticatedUser } from '@/lib/auth/middleware'
import { hasPermission } from '@/lib/auth/authorization'
import { getStudentPayments, createStudentPayment, getStudentPaymentSummary } from '@/lib/db/queries/students'
import { z } from 'zod'
import type { StudentPaymentMethod } from '@/types/student'

const createPaymentSchema = z.object({
  amount: z.coerce.number().min(1, 'Amount must be greater than 0'),
  paymentMethod: z.enum(['cash', 'upi', 'bank_transfer', 'card', 'cheque']),
  paymentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  receiptNumber: z.string().max(100).optional(),
  notes: z.string().max(500).optional(),
})

async function canManageStudentPayments(user: AuthenticatedUser): Promise<boolean> {
  return hasPermission(user, 'payments.create') || hasPermission(user, 'payments.process')
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; enrollmentId: string }> }
) {
  return withAuth(request, async () => {
    try {
      const { id, enrollmentId } = await params
      const { searchParams } = new URL(request.url)
      
      if (searchParams.get('summary') === 'true') {
        const data = await getStudentPaymentSummary(enrollmentId)
        return NextResponse.json({ data })
      }
      
      const data = await getStudentPayments(enrollmentId)
      return NextResponse.json({ data })
    } catch (error) {
      console.error('GET /api/students/[id]/enrollments/[enrollmentId]/payments error:', error)
      return NextResponse.json({ error: 'Internal error' }, { status: 500 })
    }
  })
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; enrollmentId: string }> }
) {
  return withAuth(request, async (user) => {
    if (!(await canManageStudentPayments(user))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    try {
      const { id, enrollmentId } = await params
      const body = await request.json()
      const validated = createPaymentSchema.parse(body)
      const data = await createStudentPayment(enrollmentId, {
        amount: validated.amount,
        paymentMethod: validated.paymentMethod as StudentPaymentMethod,
        paymentDate: validated.paymentDate,
        receiptNumber: validated.receiptNumber,
        notes: validated.notes,
      }, user.userId)
      return NextResponse.json({ data }, { status: 201 })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
      }
      console.error('POST /api/students/[id]/enrollments/[enrollmentId]/payments error:', error)
      return NextResponse.json({ error: 'Internal error' }, { status: 500 })
    }
  })
}