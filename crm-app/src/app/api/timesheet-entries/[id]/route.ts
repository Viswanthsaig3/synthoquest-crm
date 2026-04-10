import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/middleware'
import { updateEntry, deleteEntry } from '@/lib/db/queries/timesheets'
import { createAdminClient } from '@/lib/db/server-client'
import { z } from 'zod'
import { assertEntryDateIsToday, minutesFromTimeKey, validateTodayTimeRange } from '@/lib/date-utils'

const updateEntrySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  taskId: z.string().uuid().optional().nullable(),
  description: z.string().optional().nullable(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/).optional().nullable(),
  endTime: z.string().regex(/^\d{2}:\d{2}$/).optional().nullable(),
  breakMinutes: z.number().min(0).optional(),
  billable: z.boolean().optional(),
  location: z.string().optional().nullable(),
})

async function getEntryWithTimesheet(entryId: string) {
  const supabase = await createAdminClient()
  
  const { data, error } = await supabase
    .from('timesheet_entries')
    .select('*, timesheets!inner(employee_id)')
    .eq('id', entryId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }

  return data
}

function hasOverlap(
  entries: Array<{ startTime?: string | null; endTime?: string | null }>,
  startTime?: string,
  endTime?: string
): boolean {
  if (!startTime || !endTime) return false
  const nextStart = minutesFromTimeKey(startTime)
  const nextEnd = minutesFromTimeKey(endTime)
  if (Number.isNaN(nextStart) || Number.isNaN(nextEnd)) return false

  return entries.some((entry) => {
    if (!entry.startTime || !entry.endTime) return false
    const start = minutesFromTimeKey(entry.startTime)
    const end = minutesFromTimeKey(entry.endTime)
    if (Number.isNaN(start) || Number.isNaN(end)) return false
    return nextStart < end && start < nextEnd
  })
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async (user) => {
    try {
      const entryWithTimesheet = await getEntryWithTimesheet(params.id)

      if (!entryWithTimesheet) {
        return NextResponse.json({ error: 'Entry not found' }, { status: 404 })
      }

      if (entryWithTimesheet.timesheets.employee_id !== user.userId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      const approvalStatus =
        entryWithTimesheet.approval_status ?? entryWithTimesheet.approvalStatus
      if (approvalStatus !== 'pending') {
        return NextResponse.json(
          { error: 'Can only edit entries that are still pending approval' },
          { status: 400 }
        )
      }

      const body = await request.json()
      const validated = updateEntrySchema.parse(body)

      if (validated.date !== undefined) {
        const dateCheck = assertEntryDateIsToday(validated.date)
        if (!dateCheck.ok) {
          return NextResponse.json({ error: dateCheck.error }, { status: 400 })
        }
      }

      const effectiveDate =
        validated.date ?? entryWithTimesheet.date ?? entryWithTimesheet.entry_date
      if (effectiveDate) {
        const dateCheck = assertEntryDateIsToday(effectiveDate)
        if (!dateCheck.ok) {
          return NextResponse.json({ error: dateCheck.error }, { status: 400 })
        }
      }

      const effectiveStart =
        (validated.startTime === null ? undefined : validated.startTime) ??
        entryWithTimesheet.start_time ??
        entryWithTimesheet.startTime
      const effectiveEnd =
        (validated.endTime === null ? undefined : validated.endTime) ??
        entryWithTimesheet.end_time ??
        entryWithTimesheet.endTime

      const timeCheck = validateTodayTimeRange(effectiveStart, effectiveEnd)
      if (!timeCheck.ok) {
        return NextResponse.json({ error: timeCheck.error }, { status: 400 })
      }

      if (effectiveStart && effectiveEnd) {
        const supabase = await createAdminClient()
        const timesheetId = entryWithTimesheet.timesheet_id ?? entryWithTimesheet.timesheetId
        const { data: siblingEntries, error: siblingError } = await supabase
          .from('timesheet_entries')
          .select('id,start_time,end_time')
          .eq('timesheet_id', timesheetId)
          .neq('id', params.id)

        if (siblingError) {
          throw siblingError
        }

        const overlaps = hasOverlap(
          (siblingEntries || []).map((entry: { start_time?: string | null; end_time?: string | null }) => ({
            startTime: entry.start_time ?? undefined,
            endTime: entry.end_time ?? undefined,
          })),
          effectiveStart,
          effectiveEnd,
        )
        if (overlaps) {
          return NextResponse.json(
            { error: 'Time block overlaps with an existing entry.' },
            { status: 400 }
          )
        }
      }

      const entry = await updateEntry(params.id, {
        date: validated.date,
        taskId: validated.taskId === null ? undefined : validated.taskId,
        description: validated.description === null ? undefined : validated.description,
        startTime: validated.startTime === null ? undefined : validated.startTime,
        endTime: validated.endTime === null ? undefined : validated.endTime,
        breakMinutes: validated.breakMinutes,
        billable: validated.billable,
        location: validated.location === null ? undefined : validated.location,
      })

      return NextResponse.json({ data: entry })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
      }
      console.error('Update timesheet entry error:', error)
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
      const entryWithTimesheet = await getEntryWithTimesheet(params.id)

      if (!entryWithTimesheet) {
        return NextResponse.json({ error: 'Entry not found' }, { status: 404 })
      }

      if (entryWithTimesheet.timesheets.employee_id !== user.userId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      const approvalStatus =
        entryWithTimesheet.approval_status ?? entryWithTimesheet.approvalStatus
      if (approvalStatus !== 'pending') {
        return NextResponse.json(
          { error: 'Can only delete entries that are still pending approval' },
          { status: 400 }
        )
      }

      await deleteEntry(params.id)

      return NextResponse.json({ success: true })
    } catch (error) {
      console.error('Delete timesheet entry error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  })
}
