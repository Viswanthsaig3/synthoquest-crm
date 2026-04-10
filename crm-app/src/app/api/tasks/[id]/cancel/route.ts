import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/middleware'
import { getTaskById, cancelTask } from '@/lib/db/queries/tasks'
import { createAdminClient } from '@/lib/db/server-client'
import { hasAnyPermission, hasPermission } from '@/lib/auth/authorization'

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

      const canEdit = await hasPermission(user, 'tasks.edit')
      const canAssign = await hasPermission(user, 'tasks.assign')
      
      if (!canEdit && !canAssign) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      if ((await hasAnyPermission(user, ['tasks.assign'])) && task.assignedTo && task.assignedBy !== user.userId) {
        const supabase = await createAdminClient()
        const { data: managedMember } = await supabase
          .from('users')
          .select('id')
          .eq('id', task.assignedTo)
          .eq('managed_by', user.userId)
          .is('deleted_at', null)
          .single()

        if (!managedMember) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }
      }

      if (task.status === 'completed' || task.status === 'cancelled') {
        return NextResponse.json(
          { error: 'Cannot cancel completed or already cancelled tasks' },
          { status: 400 }
        )
      }

      const updated = await cancelTask(params.id, user.userId)

      return NextResponse.json({ data: updated })
    } catch (error) {
      console.error('Cancel task error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  })
}
