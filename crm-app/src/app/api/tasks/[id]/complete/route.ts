import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/middleware'
import { getTaskById, completeTask } from '@/lib/db/queries/tasks'
import { z } from 'zod'

const completeSchema = z.object({
  actualHours: z.number().min(0).max(999.99).optional(),
})

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async (user) => {
    try {
      const task = await getTaskById(params.id)

      if (!task) {
        return NextResponse.json({ error: 'Task not found' }, { status: 404 })
      }

      if (task.assignedTo !== user.userId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      if (task.status !== 'in_progress' && task.status !== 'review') {
        return NextResponse.json(
          { error: 'Only in-progress or review tasks can be completed' },
          { status: 400 }
        )
      }

      const body = await request.json().catch(() => ({}))
      const validated = completeSchema.parse(body)

      const updated = await completeTask(params.id, user.userId, {
        actualHours: validated.actualHours,
      })

      return NextResponse.json({ data: updated })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
      }
      console.error('Complete task error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  })
}