import { NextRequest, NextResponse } from 'next/server'
import { withAuth, type AuthenticatedUser } from '@/lib/auth/middleware'
import { getTaskById, getHistory } from '@/lib/db/queries/tasks'
import { createAdminClient } from '@/lib/db/server-client'
import { hasPermission } from '@/lib/auth/authorization'

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

      const history = await getHistory(params.id)

      return NextResponse.json({ data: history })
    } catch (error) {
      console.error('Get history error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  })
}
