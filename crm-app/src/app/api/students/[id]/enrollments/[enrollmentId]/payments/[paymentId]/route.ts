import { NextRequest, NextResponse } from 'next/server'
import { withAuth, type AuthenticatedUser } from '@/lib/auth/middleware'
import { hasPermission } from '@/lib/auth/authorization'
import { getStudentPaymentById, updateStudentPayment, deleteStudentPayment } from '@/lib/db/queries/students'
import { z } from 'zod'
import type { StudentPaymentMethod } from '@/types/student'

const updatePaymentSchema = z.object({
  amount: z.coerce.number().min(1).optional(),
  paymentMethod: z.enum(['cash', 'upi', 'bank_transfer', 'card', 'cheque']).optional(),
  paymentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  receiptNumber: z.string().max(100).optional(),
  notes: z.string().max(500).optional(),
})

async function canManageStudentPayments(user: AuthenticatedUser): Promise<boolean> {
  return hasPermission(user, 'payments.create') || hasPermission(user, 'payments.process')
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; enrollmentId: string; paymentId: string }> }
) {
  return withAuth(request, async () => {
    try {
      const { paymentId } = await params
      const data = await getStudentPaymentById(paymentId)
      if (!data) {
        return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
      }
      return NextResponse.json({ data })
    } catch (error) {
      console.error('GET payment error:', error)
      return NextResponse.json({ error: 'Internal error' }, { status: 500 })
    }
  })
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; enrollmentId: string; paymentId: string }> }
) {
  return withAuth(request, async (user) => {
    if (!(await canManageStudentPayments(user))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    try {
      const { paymentId } = await params
      const body = await request.json()
      const validated = updatePaymentSchema.parse(body)
      const data = await updateStudentPayment(paymentId, {
        amount: validated.amount,
        paymentMethod: validated.paymentMethod as StudentPaymentMethod,
        paymentDate: validated.paymentDate,
        receiptNumber: validated.receiptNumber,
        notes: validated.notes,
      })
      return NextResponse.json({ data })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
      }
      if (error instanceof Error && error.message === 'Payment not found') {
        return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
      }
      console.error('PUT payment error:', error)
      return NextResponse.json({ error: 'Internal error' }, { status: 500 })
    }
  })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; enrollmentId: string; paymentId: string }> }
) {
  return withAuth(request, async (user) => {
    if (!(await canManageStudentPayments(user))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    try {
      const { paymentId } = await params
      await deleteStudentPayment(paymentId)
      return NextResponse.json({ message: 'Payment deleted' })
    } catch (error) {
      console.error('DELETE payment error:', error)
      return NextResponse.json({ error: 'Internal error' }, { status: 500 })
    }
  })
}