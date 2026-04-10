import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/middleware'
import { getTaskById, updateTask, deleteTask } from '@/lib/db/queries/tasks'
import { createAdminClient } from '@/lib/db/server-client'
import { canListTasksOrgWide, hasPermission, canAssignTaskToTarget, canReassignTaskToTarget } from '@/lib/auth/authorization'
import { z } from 'zod'

const updateSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  type: z.enum(['task', 'bug', 'feature', 'maintenance', 'training', 'meeting']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  status: z.enum(['pending', 'in_progress', 'review', 'completed', 'cancelled', 'on_hold']).optional(),
  assignedTo: z.string().uuid().optional().nullable(),
  dueDate: z.string().optional(),
  estimatedHours: z.number().min(0).max(999.99).optional(),
  actualHours: z.number().min(0).max(999.99).optional(),
  progressPercentage: z.number().min(0).max(100).optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
})

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

      const canViewOrgWide = await canListTasksOrgWide(user)
      let canView = canViewOrgWide

      if (!canView && (await hasPermission(user, 'tasks.assign')) && task.assignedTo) {
        const supabase = await createAdminClient()
        const { data: managedMember } = await supabase
          .from('users')
          .select('id')
          .eq('id', task.assignedTo)
          .eq('managed_by', user.userId)
          .is('deleted_at', null)
          .single()

        canView = !!managedMember
      }

      if (!canView && task.assignedTo !== user.userId && task.assignedBy !== user.userId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      return NextResponse.json({ data: task })
    } catch (error) {
      console.error('Get task error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  })
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async (user) => {
    try {
      const task = await getTaskById(params.id)

      if (!task) {
        return NextResponse.json({ error: 'Task not found' }, { status: 404 })
      }

      const canEditAll = await hasPermission(user, 'tasks.edit')
      
      if (!canEditAll) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      if ((await hasPermission(user, 'tasks.assign')) && task.assignedTo && task.assignedBy !== user.userId) {
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

      const body = await request.json()
      const validated = updateSchema.parse(body)

      if (validated.assignedTo !== undefined && validated.assignedTo !== null) {
        const canReassign = await canReassignTaskToTarget(user, task.assignedTo || null, validated.assignedTo)
        if (!canReassign) {
          return NextResponse.json(
            { error: 'You can only reassign tasks to users in your hierarchy and department' },
            { status: 403 }
          )
        }
      }

      const updated = await updateTask(params.id, {
        ...validated,
        assignedTo: validated.assignedTo === null ? undefined : validated.assignedTo
      })

      return NextResponse.json({ data: updated })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
      }
      console.error('Update task error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async (user) => {
    try {
      const task = await getTaskById(params.id)

      if (!task) {
        return NextResponse.json({ error: 'Task not found' }, { status: 404 })
      }

      if (!(await hasPermission(user, 'tasks.delete'))) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      await deleteTask(params.id)

      return NextResponse.json({ success: true })
    } catch (error) {
      console.error('Delete task error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  })
}
