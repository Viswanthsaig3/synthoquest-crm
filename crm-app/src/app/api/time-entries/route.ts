import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/middleware'
import { createTimeEntry, getTimeEntries } from '@/lib/db/queries/time-entries'
import { createAdminClient } from '@/lib/db/server-client'
import { hasPermission } from '@/lib/auth/authorization'
import { z } from 'zod'
import type { TimeEntryFilters } from '@/types/time-entry'
import { parseOptionalTimeEntryStatus } from '@/lib/query-params'

const createSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  taskId: z.string().uuid().optional(),
  projectId: z.string().uuid().optional()
})

export async function GET(request: NextRequest) {
  return withAuth(request, async (user) => {
    try {
      const searchParams = request.nextUrl.searchParams
      const requestedUserId = searchParams.get('userId') || undefined

      const filters: TimeEntryFilters = {
        date: searchParams.get('date') || undefined,
        fromDate: searchParams.get('fromDate') || undefined,
        toDate: searchParams.get('toDate') || undefined,
        status: parseOptionalTimeEntryStatus(searchParams.get('status')),
        page: parseInt(searchParams.get('page') || '1', 10),
        limit: parseInt(searchParams.get('limit') || '50', 10),
      }

      if (await hasPermission(user, 'timesheets.view_all')) {
        filters.userId = requestedUserId
      } else if (await hasPermission(user, 'timesheets.approve')) {
        const supabase = await createAdminClient()
        const { data: teamMembers } = await supabase
          .from('users')
          .select('id')
          .eq('managed_by', user.userId)
          .is('deleted_at', null)

        const allowedIds = [user.userId, ...(teamMembers || []).map((m: { id: string }) => m.id)]

        if (requestedUserId) {
          if (!allowedIds.includes(requestedUserId)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
          }
          filters.userId = requestedUserId
        } else {
          filters.userIds = allowedIds
        }
      } else {
        filters.userId = user.userId
      }

      const result = await getTimeEntries(filters)

      return NextResponse.json({
        data: result.data,
        pagination: result.pagination
      })
    } catch (error) {
      console.error('Get time entries error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  })
}

export async function POST(request: NextRequest) {
  return withAuth(request, async (user) => {
    try {
      // SECURITY: Require timesheets.submit permission to create time entries
      if (!(await hasPermission(user, 'timesheets.submit'))) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      const body = await request.json()
      const validated = createSchema.parse(body)

      // SECURITY: Entries can only be logged for today — prevent historical fraud
      const { assertEntryDateIsToday } = await import('@/lib/date-utils')
      const dateCheck = assertEntryDateIsToday(validated.date)
      if (!dateCheck.ok) {
        return NextResponse.json({ error: dateCheck.error }, { status: 400 })
      }

      const [startH, startM] = validated.startTime.split(':').map(Number)
      const [endH, endM] = validated.endTime.split(':').map(Number)
      
      if (startH * 60 + startM >= endH * 60 + endM) {
        return NextResponse.json(
          { error: 'End time must be after start time' },
          { status: 400 }
        )
      }

      const entry = await createTimeEntry(user.userId, {
        date: validated.date,
        startTime: validated.startTime + ':00',
        endTime: validated.endTime + ':00',
        description: validated.description,
        taskId: validated.taskId,
        projectId: validated.projectId
      })

      return NextResponse.json({ data: entry }, { status: 201 })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Validation error', details: error.errors },
          { status: 400 }
        )
      }
      console.error('Create time entry error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  })
}
