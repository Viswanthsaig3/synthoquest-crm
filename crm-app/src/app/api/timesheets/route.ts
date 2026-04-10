import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/middleware'
import { getTimesheets, createTimesheet } from '@/lib/db/queries/timesheets'
import { createAdminClient } from '@/lib/db/server-client'
import { hasPermission } from '@/lib/auth/authorization'
import { z } from 'zod'
import { getTodayDateKeyForApi } from '@/lib/date-utils'

const createSchema = z.object({
  employeeId: z.string().uuid(),
  workDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  notes: z.string().optional(),
})

export async function GET(request: NextRequest) {
  return withAuth(request, async (user) => {
    try {
      const { searchParams } = new URL(request.url)
      const requestedEmployeeId =
        searchParams.get('employeeId') ||
        searchParams.get('employee_id') ||
        undefined

      const rawPage = parseInt(searchParams.get('page') || '1', 10)
      const rawLimit = parseInt(searchParams.get('limit') || '20', 10)
      const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1
      const limit = Number.isFinite(rawLimit) && rawLimit > 0 ? Math.min(100, rawLimit) : 20

      const filters: {
        employeeId?: string
        employeeIds?: string[]
        workDate?: string
        fromDate?: string
        toDate?: string
        page: number
        limit: number
      } = {
        workDate: searchParams.get('workDate') || searchParams.get('work_date') || undefined,
        fromDate: searchParams.get('fromDate') || searchParams.get('from_date') || undefined,
        toDate: searchParams.get('toDate') || searchParams.get('to_date') || undefined,
        page,
        limit,
      }

      if (await hasPermission(user, 'timesheets.view_all')) {
        filters.employeeId = requestedEmployeeId
      } else if (await hasPermission(user, 'timesheets.approve')) {
        const supabase = await createAdminClient()
        const { data: teamMembers } = await supabase
          .from('users')
          .select('id')
          .eq('managed_by', user.userId)
          .is('deleted_at', null)

        const allowedIds = new Set([user.userId, ...(teamMembers || []).map((m: { id: string }) => m.id)])

        if (requestedEmployeeId) {
          if (!allowedIds.has(requestedEmployeeId)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
          }
          filters.employeeId = requestedEmployeeId
        } else {
          filters.employeeIds = Array.from(allowedIds)
        }
      } else {
        filters.employeeId = user.userId
      }

      const result = await getTimesheets(filters)

      return NextResponse.json({
        data: result.data,
        pagination: {
          page: filters.page,
          limit: filters.limit,
          total: result.total,
          totalPages: Math.ceil(result.total / filters.limit),
        },
      })
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error)
      console.error('Get timesheets error:', message, error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  })
}

export async function POST(request: NextRequest) {
  return withAuth(request, async (user) => {
    try {
      if (!(await hasPermission(user, 'timesheets.submit'))) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      const body = await request.json()
      const validated = createSchema.parse(body)

      if (validated.employeeId !== user.userId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      const today = getTodayDateKeyForApi()
      if (validated.workDate !== today) {
        return NextResponse.json(
          { error: `Timesheet date must be today (${today}).` },
          { status: 400 }
        )
      }

      const timesheet = await createTimesheet(validated)

      return NextResponse.json({ data: timesheet }, { status: 201 })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
      }
      console.error('Create timesheet error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  })
}
