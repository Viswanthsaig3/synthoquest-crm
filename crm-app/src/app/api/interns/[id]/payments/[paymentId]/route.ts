import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/middleware'
import { hasPermission } from '@/lib/auth/authorization'
import { getUserById } from '@/lib/db/queries/users'
import {
  getInternPaymentById,
  updateInternPayment,
  deleteInternPayment,
} from '@/lib/db/queries/intern-payments'
import { z } from 'zod'

const updatePaymentSchema = z.object({
  amount: z.number().min(1, 'Amount must be greater than 0').optional(),
  paymentMethod: z.enum(['cash', 'upi', 'bank_transfer', 'card', 'cheque']).optional(),
  paymentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  receiptNumber: z.string().max(100).optional(),
  notes: z.string().max(500).optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; paymentId: string } }
) {
  return withAuth(request, async (user) => {
    try {
      const target = await getUserById(params.id)
      if (!target || target.role !== 'intern') {
        return NextResponse.json({ error: 'Intern not found' }, { status: 404 })
      }

      const canViewAll =
        (await hasPermission(user, 'interns.view_all')) ||
        (await hasPermission(user, 'interns.manage_all'))
      const canViewAssigned =
        (await hasPermission(user, 'interns.view_assigned')) ||
        (await hasPermission(user, 'interns.manage_assigned'))
      const isAssigned = target.managedBy === user.userId

      if (!canViewAll && !(canViewAssigned && isAssigned)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      const payment = await getInternPaymentById(params.paymentId)
      if (!payment || payment.internId !== params.id) {
        return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
      }

      return NextResponse.json({ data: payment })
    } catch (error) {
      console.error('Get intern payment error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  })
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; paymentId: string } }
) {
  return withAuth(request, async (user) => {
    try {
      const target = await getUserById(params.id)
      if (!target || target.role !== 'intern') {
        return NextResponse.json({ error: 'Intern not found' }, { status: 404 })
      }

      const canManageAll = await hasPermission(user, 'interns.manage_all')
      const canManageAssigned = await hasPermission(user, 'interns.manage_assigned')
      const isAssigned = target.managedBy === user.userId

      if (!canManageAll && !(canManageAssigned && isAssigned)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      const payment = await getInternPaymentById(params.paymentId)
      if (!payment || payment.internId !== params.id) {
        return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
      }

      const body = await request.json()
      const validated = updatePaymentSchema.parse(body)

      const updated = await updateInternPayment(params.paymentId, {
        amount: validated.amount,
        paymentMethod: validated.paymentMethod,
        paymentDate: validated.paymentDate,
        receiptNumber: validated.receiptNumber,
        notes: validated.notes,
      })

      return NextResponse.json({ data: updated, message: 'Payment updated successfully' })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Validation error', details: error.errors },
          { status: 400 }
        )
      }
      console.error('Update intern payment error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; paymentId: string } }
) {
  return withAuth(request, async (user) => {
    try {
      const target = await getUserById(params.id)
      if (!target || target.role !== 'intern') {
        return NextResponse.json({ error: 'Intern not found' }, { status: 404 })
      }

      const canManageAll = await hasPermission(user, 'interns.manage_all')
      const canManageAssigned = await hasPermission(user, 'interns.manage_assigned')
      const isAssigned = target.managedBy === user.userId

      if (!canManageAll && !(canManageAssigned && isAssigned)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      const payment = await getInternPaymentById(params.paymentId)
      if (!payment || payment.internId !== params.id) {
        return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
      }

      await deleteInternPayment(params.paymentId)

      return NextResponse.json({ message: 'Payment deleted successfully' })
    } catch (error) {
      console.error('Delete intern payment error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  })
}