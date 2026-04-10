import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/middleware'
import { hasPermission } from '@/lib/auth/authorization'
import { getUserById, updateUserCompensation } from '@/lib/db/queries/users'
import { z } from 'zod'

const updateCompensationSchema = z.object({
  compensationType: z.enum(['paid', 'unpaid']),
  compensationAmount: z.number().min(0).nullable().optional(),
  reason: z.string().max(500).optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(request, async (user) => {
    try {
      const { id } = await params
      const canViewCompensation = await hasPermission(user, 'compensation.manage')
      const isSelf = user.userId === id

      if (!canViewCompensation && !isSelf) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      const target = await getUserById(id)
      if (!target) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }

      return NextResponse.json({
        data: {
          userId: target.id,
          compensationType: target.compensationType,
          compensationAmount: target.compensationAmount,
          compensationUpdatedAt: target.compensationUpdatedAt,
        }
      })
    } catch (error) {
      console.error('Get compensation error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async (user) => {
    try {
      const canManageCompensation = await hasPermission(user, 'compensation.manage')
      if (!canManageCompensation) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      const target = await getUserById(params.id)
      if (!target) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }

      const body = await request.json()
      const validated = updateCompensationSchema.parse(body)

      const updated = await updateUserCompensation({
        userId: params.id,
        compensationType: validated.compensationType,
        compensationAmount: validated.compensationAmount,
        reason: validated.reason,
        changedBy: user.userId,
      })

      return NextResponse.json({ data: updated })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Validation error', details: error.errors },
          { status: 400 }
        )
      }

      console.error('Update compensation error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  })
}
