import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/middleware'
import { adjustAttendanceRecord, getAttendanceRecordById } from '@/lib/db/queries/attendance'
import { hasPermission } from '@/lib/auth/authorization'
import { z } from 'zod'

const adjustSchema = z.object({
  fieldName: z.enum(['check_in_time', 'check_out_time', 'total_hours', 'status']),
  newValue: z.string().min(1, 'New value is required'),
  adjustmentReason: z.string().min(5, 'Reason must be at least 5 characters'),
  adjustmentType: z.enum(['manual_correction', 'auto_checkout_reversal', 'time_added', 'time_removed', 'status_change']),
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

      // SECURITY: Prevent self-adjustment of own attendance records
      if (record.userId === user.userId) {
        return NextResponse.json(
          { error: 'Cannot adjust your own attendance records' },
          { status: 403 }
        )
      }

      const body = await request.json()
      const validated = adjustSchema.parse(body)

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
      return NextResponse.json(
        { error: 'Failed to adjust attendance record' },
        { status: 500 }
      )
    }
  })
}