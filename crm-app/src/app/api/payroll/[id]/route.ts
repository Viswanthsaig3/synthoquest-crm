import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/middleware'
import { hasPermission } from '@/lib/auth/authorization'
import { getPayrollRecordById, markPayrollPaid, updatePayrollRecord } from '@/lib/db/queries/payroll'
import { z } from 'zod'

const markPaidSchema = z.object({
  status: z.literal('paid').optional(),
  paidOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  paymentMethod: z.enum(['bank_transfer', 'cash', 'cheque', 'upi']),
  paymentReference: z.string().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  return withAuth(request, async (user) => {
    try {
      const { id } = await params
      const canViewAll = await hasPermission(user, 'payroll.view_all')
      const canViewOwn = await hasPermission(user, 'payroll.view_own')

      if (!canViewAll && !canViewOwn) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      const record = await getPayrollRecordById(id)
      if (!record) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 })
      }

      if (!canViewAll && record.userId !== user.userId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      return NextResponse.json({ data: record })
    } catch (error) {
      console.error('GET /api/payroll/[id] error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  })
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  return withAuth(request, async (user) => {
    try {
      if (!(await hasPermission(user, 'payroll.process'))) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      const { id } = await params
      const body = await request.json()
      const validated = markPaidSchema.parse(body)

      const record = await getPayrollRecordById(id)
      if (!record) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 })
      }

      if (record.status === 'paid') {
        return NextResponse.json({ error: 'Already paid' }, { status: 400 })
      }

      const updated = await markPayrollPaid(id, {
        paidOn: validated.paidOn,
        paymentMethod: validated.paymentMethod,
        paymentReference: validated.paymentReference,
      })

      return NextResponse.json({ data: updated })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Validation error', details: error.errors },
          { status: 400 },
        )
      }
      console.error('PUT /api/payroll/[id] error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  })
}
