import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/middleware'
import { getTaskById, assignTask } from '@/lib/db/queries/tasks'
import { createAdminClient } from '@/lib/db/server-client'
import { getUserPermissions } from '@/lib/db/queries/permissions'
import { hasPermission, canAssignTaskToTarget } from '@/lib/auth/authorization'
import { z } from 'zod'

const assignSchema = z.object({
  assignedTo: z.string().uuid(),
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

      if (!(await hasPermission(user, 'tasks.assign'))) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      const body = await request.json()
      const validated = assignSchema.parse(body)

      const supabase = await createAdminClient()
      const { data: assignee, error: assigneeError } = await supabase
        .from('users')
        .select('id')
        .eq('id', validated.assignedTo)
        .is('deleted_at', null)
        .single()

      if (assigneeError || !assignee) {
        return NextResponse.json({ error: 'Assignee not found' }, { status: 404 })
      }

      const assigneePermissions = await getUserPermissions(assignee.id)
      if (!assigneePermissions.includes('tasks.complete')) {
        return NextResponse.json(
          { error: 'Assignee must have tasks.complete permission' },
          { status: 400 }
        )
      }

      const canAssign = await canAssignTaskToTarget(user, validated.assignedTo)
      if (!canAssign) {
        return NextResponse.json(
          { error: 'You can only assign tasks to users in your hierarchy and department' },
          { status: 403 }
        )
      }

      const updated = await assignTask(params.id, validated.assignedTo, user.userId)

      return NextResponse.json({ data: updated })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
      }
      console.error('Assign task error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  })
}
