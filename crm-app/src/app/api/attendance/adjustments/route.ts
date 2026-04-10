import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/middleware'
import { getAttendanceAdjustments } from '@/lib/db/queries/attendance'
import { hasPermission } from '@/lib/auth/authorization'

export async function GET(request: NextRequest) {
  return withAuth(request, async (user) => {
    try {
      if (!(await hasPermission(user, 'attendance.view_adjustments'))) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      const { searchParams } = new URL(request.url)
      const attendanceRecordId = searchParams.get('attendanceRecordId')
      const adjustedBy = searchParams.get('adjustedBy')
      const fromDate = searchParams.get('fromDate')
      const toDate = searchParams.get('toDate')
      const limit = searchParams.get('limit')

      const adjustments = await getAttendanceAdjustments({
        attendanceRecordId: attendanceRecordId || undefined,
        adjustedBy: adjustedBy || undefined,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
        limit: limit ? parseInt(limit, 10) : 50,
      })

      return NextResponse.json({ data: adjustments })
    } catch (error) {
      console.error('Get adjustments error:', error)
      return NextResponse.json(
        { error: 'Failed to get adjustments' },
        { status: 500 }
      )
    }
  })
}