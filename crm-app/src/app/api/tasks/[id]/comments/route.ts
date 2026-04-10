import { NextRequest, NextResponse } from 'next/server'
import { withAuth, type AuthenticatedUser } from '@/lib/auth/middleware'
import { getTaskById, getComments, createComment } from '@/lib/db/queries/tasks'
import { createAdminClient } from '@/lib/db/server-client'
import { hasPermission } from '@/lib/auth/authorization'
import { z } from 'zod'

const createCommentSchema = z.object({
  comment: z.string().min(1),
  mentions: z.array(z.string().uuid()).optional(),
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

      const comments = await getComments(params.id)

      return NextResponse.json({ data: comments })
    } catch (error) {
      console.error('Get comments error:', error)
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

      const canView = await canAccessTask(user, task)

      if (!canView) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      const body = await request.json()
      const validated = createCommentSchema.parse(body)

      const comment = await createComment(
        params.id,
        user.userId,
        validated.comment,
        validated.mentions
      )

      return NextResponse.json({ data: comment }, { status: 201 })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
      }
      console.error('Create comment error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  })
}
