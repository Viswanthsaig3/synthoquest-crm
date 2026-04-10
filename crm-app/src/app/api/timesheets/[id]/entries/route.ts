import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/middleware'
import { getTimesheetById, getEntries, createEntry } from '@/lib/db/queries/timesheets'
import { createAdminClient } from '@/lib/db/server-client'
import { hasPermission } from '@/lib/auth/authorization'
import { z } from 'zod'
import { assertEntryDateIsToday, minutesFromTimeKey, validateTodayTimeRange } from '@/lib/date-utils'

const createEntrySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  taskId: z.string().uuid().optional(),
  description: z.string().optional(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  endTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  breakMinutes: z.number().min(0).optional(),
  billable: z.boolean().optional(),
  location: z.string().optional(),
})

function hasOverlapWithExisting(
  existingEntries: Array<{ startTime?: string | null; endTime?: string | null }>,
  startTime?: string,
  endTime?: string
): boolean {
  if (!startTime || !endTime) return false
  const nextStart = minutesFromTimeKey(startTime)
  const nextEnd = minutesFromTimeKey(endTime)
  if (Number.isNaN(nextStart) || Number.isNaN(nextEnd)) return false

  return existingEntries.some((entry) => {
    if (!entry.startTime || !entry.endTime) return false
    const start = minutesFromTimeKey(entry.startTime)
    const end = minutesFromTimeKey(entry.endTime)
    if (Number.isNaN(start) || Number.isNaN(end)) return false
    return nextStart < end && start < nextEnd
  })
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async (user) => {
    try {
      const timesheet = await getTimesheetById(params.id)

      if (!timesheet) {
        return NextResponse.json({ error: 'Timesheet not found' }, { status: 404 })
      }

      const isOwner = timesheet.employeeId === user.userId
      const canViewAll = await hasPermission(user, 'timesheets.view_all')

      let canView = isOwner || canViewAll

      if (!canView && (await hasPermission(user, 'timesheets.approve'))) {
        const supabase = await createAdminClient()
        const { data: managedEmployee } = await supabase
          .from('users')
          .select('id')
          .eq('id', timesheet.employeeId)
          .eq('managed_by', user.userId)
          .is('deleted_at', null)
          .single()

        canView = !!managedEmployee
      }

      if (!canView) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      const entries = await getEntries(params.id)

      return NextResponse.json({ data: entries })
    } catch (error) {
      console.error('Get timesheet entries error:', error)
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
      const timesheet = await getTimesheetById(params.id)

      if (!timesheet) {
        return NextResponse.json({ error: 'Timesheet not found' }, { status: 404 })
      }

      if (timesheet.employeeId !== user.userId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      const body = await request.json()
      const validated = createEntrySchema.parse(body)

      const dateCheck = assertEntryDateIsToday(validated.date)
      if (!dateCheck.ok) {
        return NextResponse.json({ error: dateCheck.error }, { status: 400 })
      }
      const timeCheck = validateTodayTimeRange(validated.startTime, validated.endTime)
      if (!timeCheck.ok) {
        return NextResponse.json({ error: timeCheck.error }, { status: 400 })
      }

      const existingEntries = await getEntries(params.id)
      if (
        hasOverlapWithExisting(
          (existingEntries || []).map((entry: { startTime: string | null; endTime: string | null }) => ({
            startTime: entry.startTime,
            endTime: entry.endTime,
          })),
          validated.startTime,
          validated.endTime,
        )
      ) {
        return NextResponse.json(
          { error: 'Time block overlaps with an existing entry.' },
          { status: 400 }
        )
      }

      // SECURITY: CRIT-02 — Enforce max daily hours cap
      const MAX_HOURS_PER_DAY = 16
      const sameDateEntries = (existingEntries || []).filter(
        (e: { date: string }) => e.date === validated.date
      )
      const existingHoursToday = sameDateEntries.reduce(
        (sum: number, e: { totalHours?: number }) => sum + (e.totalHours || 0), 0
      )
      let newEntryHours = 0
      if (validated.startTime && validated.endTime) {
        const startMin = minutesFromTimeKey(validated.startTime)
        const endMin = minutesFromTimeKey(validated.endTime)
        const breakMin = validated.breakMinutes || 0
        newEntryHours = Math.max(0, (endMin - startMin - breakMin) / 60)
      }
      if (existingHoursToday + newEntryHours > MAX_HOURS_PER_DAY) {
        return NextResponse.json(
          { error: `Cannot exceed ${MAX_HOURS_PER_DAY} hours per day. You already have ${existingHoursToday.toFixed(1)} hours logged for this date.` },
          { status: 400 }
        )
      }

      const entry = await createEntry(params.id, {
        date: validated.date,
        taskId: validated.taskId,
        description: validated.description,
        startTime: validated.startTime,
        endTime: validated.endTime,
        breakMinutes: validated.breakMinutes,
        billable: validated.billable,
        location: validated.location,
      })

      return NextResponse.json({ data: entry }, { status: 201 })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
      }
      console.error('Create timesheet entry error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  })
}
