import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/middleware'
import { getTaskById, startTask } from '@/lib/db/queries/tasks'

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

      try {
        const updated = await startTask(params.id, user.userId)
        return NextResponse.json({ data: updated })
      } catch (startError) {
        if (startError instanceof Error && startError.message.includes('already started')) {
          return NextResponse.json({ error: 'Task already started' }, { status: 400 })
        }
        throw startError
      }
    } catch (error) {
      console.error('Start task error:', error)
      return NextResponse.json({ error: 'An unexpected error occurred. Please try again.' }, { status: 500 })
    }
  })
}