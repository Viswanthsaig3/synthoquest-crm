import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/middleware'
import { adjustAttendanceRecord, getAttendanceRecordById } from '@/lib/db/queries/attendance'
import { hasPermission } from '@/lib/auth/authorization'
import { getManagerScopedUserIds } from '@/lib/db/queries/users'
import { z } from 'zod'

const MAX_ADJUSTMENT_DAYS_BACK = 90
const MAX_ADJUSTMENT_DAYS_FUTURE = 1

function isValidTimestamp(value: string): boolean {
  const ts = new Date(value)
  return !isNaN(ts.getTime())
}

function isTimestampWithinBounds(value: string): boolean {
  const ts = new Date(value)
  const now = new Date()
  const minDate = new Date(now.getTime() - MAX_ADJUSTMENT_DAYS_BACK * 24 * 60 * 60 * 1000)
  const maxDate = new Date(now.getTime() + MAX_ADJUSTMENT_DAYS_FUTURE * 24 * 60 * 60 * 1000)
  return ts >= minDate && ts <= maxDate
}

const adjustSchema = z.object({
  fieldName: z.enum(['check_in_time', 'check_out_time', 'total_hours', 'status']),
  newValue: z.string().min(1, 'New value is required'),
  adjustmentReason: z.string().min(5, 'Reason must be at least 5 characters'),
  adjustmentType: z.enum(['manual_correction', 'auto_checkout_reversal', 'time_added', 'time_removed', 'status_change']),
}).superRefine((data, ctx) => {
  if (data.fieldName === 'check_in_time' || data.fieldName === 'check_out_time') {
    if (!isValidTimestamp(data.newValue)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Invalid timestamp format',
        path: ['newValue'],
      })
      return
    }
    if (!isTimestampWithinBounds(data.newValue)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Timestamp must be within ${MAX_ADJUSTMENT_DAYS_BACK} days past and ${MAX_ADJUSTMENT_DAYS_FUTURE} day(s) future`,
        path: ['newValue'],
      })
    }
  }
  if (data.fieldName === 'total_hours') {
    const hours = parseFloat(data.newValue)
    if (isNaN(hours) || hours < 0 || hours > 24) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Total hours must be between 0 and 24',
        path: ['newValue'],
      })
    }
  }
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(request, async (user) => {
    try {
      if (!(await hasPermission(user, 'attendance.adjust_records'))) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      const { id } = await params
      
      const record = await getAttendanceRecordById(id)
      if (!record) {
        return NextResponse.json({ error: 'Attendance record not found' }, { status: 404 })
      }

      if (record.userId === user.userId) {
        return NextResponse.json(
          { error: 'Cannot adjust your own attendance records' },
          { status: 403 }
        )
      }

      const viewAll = await hasPermission(user, 'employees.view_all')
      if (!viewAll) {
        const allowedIds = await getManagerScopedUserIds(user.userId)
        if (!allowedIds.includes(record.userId)) {
          return NextResponse.json(
            { error: 'Cannot adjust attendance for employees outside your team' },
            { status: 403 }
          )
        }
      }

      const body = await request.json()
      const validated = adjustSchema.parse(body)

      if (validated.fieldName === 'check_out_time' && record.checkInTime) {
        const checkOut = new Date(validated.newValue)
        const checkIn = new Date(record.checkInTime)
        if (checkOut <= checkIn) {
          return NextResponse.json(
            { error: 'Check-out time must be after check-in time' },
            { status: 400 }
          )
        }
      }

      if (validated.fieldName === 'check_in_time' && record.checkOutTime) {
        const checkIn = new Date(validated.newValue)
        const checkOut = new Date(record.checkOutTime)
        if (checkIn >= checkOut) {
          return NextResponse.json(
            { error: 'Check-in time must be before check-out time' },
            { status: 400 }
          )
        }
      }

      let oldValue: string | null = null
      if (validated.fieldName === 'check_in_time') {
        oldValue = record.checkInTime
      } else if (validated.fieldName === 'check_out_time') {
        oldValue = record.checkOutTime
      } else if (validated.fieldName === 'total_hours') {
        oldValue = String(record.totalHours)
      } else if (validated.fieldName === 'status') {
        oldValue = record.status
      }

      const adjustment = await adjustAttendanceRecord({
        attendanceRecordId: id,
        adjustedBy: user.userId,
        fieldName: validated.fieldName,
        oldValue,
        newValue: validated.newValue,
        adjustmentReason: validated.adjustmentReason,
        adjustmentType: validated.adjustmentType,
      })

      return NextResponse.json({
        data: adjustment,
        message: 'Attendance record adjusted successfully'
      }, { status: 201 })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Validation error', details: error.errors },
          { status: 400 }
        )
      }
      console.error('Adjust attendance error:', error)
      const message = error instanceof Error ? error.message : 'Failed to adjust attendance record'
      return NextResponse.json(
        { error: message },
        { status: 500 }
      )
    }
  })
}