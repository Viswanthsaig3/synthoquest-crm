import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/middleware'
import { getTimesheetEntryApprovalCountsForEmployee } from '@/lib/db/queries/timesheets'

/** Own entry-level approval counts (replaces legacy timesheet.status for employee dashboard). */
export async function GET(request: NextRequest) {
  return withAuth(request, async (user) => {
    try {
      const counts = await getTimesheetEntryApprovalCountsForEmployee(user.userId)
      return NextResponse.json({ data: counts })
    } catch (error) {
      console.error('GET /api/timesheet-entries/my-stats error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  })
}
