import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/middleware'
import { getAttendanceRecords } from '@/lib/db/queries/attendance'
import { hasPermission } from '@/lib/auth/authorization'
import { getManagerScopedUserIds, listActiveUserIds } from '@/lib/db/queries/users'

/**
 * Attendance history:
 * - employees.view_all + attendance.view_team: optional userId, else all active users (optional ?department=)
 * - timesheets.approve OR (attendance.view_team && !view_all): userId must be self or direct report; if omitted → self only
 * - else: own rows only; userId if set must equal self
 */
export async function GET(request: NextRequest) {
  return withAuth(request, async (user) => {
    try {
      const searchParams = request.nextUrl.searchParams

      const requestedUserId = searchParams.get('userId') || undefined
      const department = searchParams.get('department') || undefined
      const filters: {
        userId?: string
        userIds?: string[]
        fromDate?: string
        toDate?: string
      } = {
        fromDate: searchParams.get('fromDate') || undefined,
        toDate: searchParams.get('toDate') || undefined,
      }

      const viewAll = await hasPermission(user, 'employees.view_all')
      const viewTeam = await hasPermission(user, 'attendance.view_team')
      const canApprove = await hasPermission(user, 'timesheets.approve')

      if (viewTeam && viewAll) {
        if (requestedUserId) {
          filters.userId = requestedUserId
        } else {
          filters.userIds = await listActiveUserIds({ department: department || undefined })
        }
      } else if (canApprove || (viewTeam && !viewAll)) {
        const allowedIds = await getManagerScopedUserIds(user.userId)
        if (requestedUserId) {
          if (!allowedIds.includes(requestedUserId)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
          }
          filters.userId = requestedUserId
        } else {
          filters.userId = user.userId
        }
      } else {
        if (requestedUserId && requestedUserId !== user.userId) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }
        filters.userId = user.userId
      }

      const data = await getAttendanceRecords(filters)

      return NextResponse.json({ data })
    } catch (error) {
      console.error('Get attendance history error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  })
}
