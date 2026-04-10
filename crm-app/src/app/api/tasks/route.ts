import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/middleware'
import { getTasks, createTask } from '@/lib/db/queries/tasks'
import { createAdminClient } from '@/lib/db/server-client'
import { getUserPermissions } from '@/lib/db/queries/permissions'
import { canListTasksOrgWide, hasPermission, canAssignTaskToTarget } from '@/lib/auth/authorization'
import { z } from 'zod'
import {
  parseOptionalTaskPriority,
  parseOptionalTaskStatus,
  parseOptionalTaskType,
} from '@/lib/query-params'

const createSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  type: z.enum(['task', 'bug', 'feature', 'maintenance', 'training', 'meeting']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  assignedTo: z.string().uuid().optional(),
  dueDate: z.string().optional(),
  estimatedHours: z.number().min(0).max(999.99).optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
  parentTaskId: z.string().uuid().optional(),
})

export async function GET(request: NextRequest) {
  return withAuth(request, async (user) => {
    try {
      const { searchParams } = new URL(request.url)
      const requestedAssignedTo = searchParams.get('assignedTo') || undefined
      const filters: Parameters<typeof getTasks>[0] = {
        assignedBy: searchParams.get('assignedBy') || undefined,
        status: parseOptionalTaskStatus(searchParams.get('status')),
        priority: parseOptionalTaskPriority(searchParams.get('priority')),
        type: parseOptionalTaskType(searchParams.get('type')),
        search: searchParams.get('search') || undefined,
        page: parseInt(searchParams.get('page') || '1', 10),
        limit: parseInt(searchParams.get('limit') || '20', 10),
      }

      const listOrgWide = await canListTasksOrgWide(user)
      const hasAssignPerm = await hasPermission(user, 'tasks.assign')

      if (listOrgWide) {
        filters.assignedTo = requestedAssignedTo
      } else if (hasAssignPerm) {
        const supabase = await createAdminClient()
        const { data: teamMembers } = await supabase
          .from('users')
          .select('id')
          .eq('managed_by', user.userId)
          .is('deleted_at', null)

        const allowedIds = [user.userId, ...(teamMembers || []).map((member: { id: string }) => member.id)]
        if (requestedAssignedTo) {
          if (!allowedIds.includes(requestedAssignedTo)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
          }
          filters.assignedTo = requestedAssignedTo
        } else {
          filters.assignedToIds = allowedIds
        }
      } else {
        filters.assignedTo = user.userId
      }

      const result = await getTasks(filters)
      const limit = filters.limit ?? 20

      return NextResponse.json({
        data: result.data,
        pagination: {
          page: filters.page,
          limit,
          total: result.total,
          totalPages: Math.ceil(result.total / limit),
        },
      })
    } catch (error) {
      console.error('Get tasks error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  })
}

export async function POST(request: NextRequest) {
  return withAuth(request, async (user) => {
    try {
      const canCreate = await hasPermission(user, 'tasks.create')
      if (!canCreate) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      const body = await request.json()
      const validated = createSchema.parse(body)

      if (validated.assignedTo) {
        if (!(await hasPermission(user, 'tasks.assign'))) {
          return NextResponse.json(
            { error: 'Missing tasks.assign permission' },
            { status: 403 }
          )
        }

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
      }

      const task = await createTask({
        title: validated.title,
        description: validated.description,
        type: validated.type,
        priority: validated.priority,
        assignedTo: validated.assignedTo,
        assignedBy: user.userId,
        dueDate: validated.dueDate,
        estimatedHours: validated.estimatedHours,
        tags: validated.tags,
        notes: validated.notes,
        parentTaskId: validated.parentTaskId,
      })

      return NextResponse.json({ data: task }, { status: 201 })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
      }
      console.error('Create task error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  })
}
