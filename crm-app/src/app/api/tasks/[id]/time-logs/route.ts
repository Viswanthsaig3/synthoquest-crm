import { NextRequest, NextResponse } from 'next/server'
import { withAuth, type AuthenticatedUser } from '@/lib/auth/middleware'
import { getTaskById, createTimeLog, getTimeLogs } from '@/lib/db/queries/tasks'
import { createAdminClient } from '@/lib/db/server-client'
import { hasPermission } from '@/lib/auth/authorization'
import { z } from 'zod'

const createTimeLogSchema = z.object({
  startedAt: z.string(),
  endedAt: z.string().optional(),
  description: z.string().optional(),
})

async function canAccessTask(user: AuthenticatedUser, task: { assignedTo?: string; assignedBy: string }) {
  if (await hasPermission(user, 'tasks.view_all')) return true
  if (task.assignedTo === user.userId || task.assignedBy === user.userId) return true
  if (!(await hasPermission(user, 'tasks.assign')) || !task.assignedTo) return false

  const supabase = await createAdminClient()
  const { data } = await supabase
    .from('users')
    .select('id')
    .eq('id', task.assignedTo)
    .eq('managed_by', user.userId)
    .is('deleted_at', null)
    .single()

  return !!data
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async (user) => {
    try {
      const task = await getTaskById(params.id)

      if (!task) {
        return NextResponse.json({ error: 'Task not found' }, { status: 404 })
      }

      const canView = await canAccessTask(user, task)

      if (!canView) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      const timeLogs = await getTimeLogs(params.id)

      return NextResponse.json({ data: timeLogs })
    } catch (error) {
      console.error('Get time logs error:', error)
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
      const task = await getTaskById(params.id)

      if (!task) {
        return NextResponse.json({ error: 'Task not found' }, { status: 404 })
      }

      if (task.assignedTo !== user.userId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      const body = await request.json()
      const validated = createTimeLogSchema.parse(body)

      const timeLog = await createTimeLog(
        params.id,
        user.userId,
        validated.startedAt,
        validated.endedAt,
        validated.description
      )

      return NextResponse.json({ data: timeLog }, { status: 201 })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
      }
      console.error('Create time log error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  })
}
