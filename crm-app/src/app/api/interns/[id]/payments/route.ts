import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/middleware'
import { hasPermission } from '@/lib/auth/authorization'
import { getUserById } from '@/lib/db/queries/users'
import {
  getInternPayments,
  createInternPayment,
  getInternPaymentSummary,
} from '@/lib/db/queries/intern-payments'
import { z } from 'zod'

const createPaymentSchema = z.object({
  amount: z.number().min(1, 'Amount must be greater than 0'),
  paymentMethod: z.enum(['cash', 'upi', 'bank_transfer', 'card', 'cheque']),
  paymentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  receiptNumber: z.string().max(100).optional(),
  notes: z.string().max(500).optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
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

      const searchParams = request.nextUrl.searchParams
      const summary = searchParams.get('summary') === 'true'

      if (summary) {
        const paymentSummary = await getInternPaymentSummary(params.id)
        return NextResponse.json({ data: paymentSummary })
      }

      const payments = await getInternPayments(params.id)
      return NextResponse.json({ data: payments })
    } catch (error) {
      console.error('Get intern payments error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  })
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async (user) => {
    try {
      const target = await getUserById(params.id)
      if (!target || target.role !== 'intern') {
        return NextResponse.json({ error: 'Intern not found' }, { status: 404 })
      }

      // Check if intern is paid_by_student type
      if (target.compensationType !== 'paid_by_student') {
        return NextResponse.json(
          { error: 'Payments can only be added for paid_by_student interns' },
          { status: 400 }
        )
      }

      // Permission check: Admin or Assigned Manager
      const canManageAll = await hasPermission(user, 'interns.manage_all')
      const canManageAssigned = await hasPermission(user, 'interns.manage_assigned')
      const isAssigned = target.managedBy === user.userId

      if (!canManageAll && !(canManageAssigned && isAssigned)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      const body = await request.json()
      const validated = createPaymentSchema.parse(body)

      const payment = await createInternPayment(
        params.id,
        {
          amount: validated.amount,
          paymentMethod: validated.paymentMethod,
          paymentDate: validated.paymentDate,
          receiptNumber: validated.receiptNumber,
          notes: validated.notes,
        },
        user.userId
      )

      return NextResponse.json({ data: payment, message: 'Payment recorded successfully' }, { status: 201 })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Validation error', details: error.errors },
          { status: 400 }
        )
      }
      console.error('Create intern payment error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  })
}