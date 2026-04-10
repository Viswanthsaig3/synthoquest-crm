import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/middleware'
import { hasPermission } from '@/lib/auth/authorization'
import { getAttendanceGeofenceWarnings } from '@/lib/db/queries/attendance'

export async function GET(request: NextRequest) {
  return withAuth(request, async (user) => {
    try {
      const canViewWarnings = await hasPermission(user, 'attendance.view_warnings')
      if (!canViewWarnings) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      const searchParams = request.nextUrl.searchParams
      const statusParam = searchParams.get('status')
      const status = statusParam === 'open' || statusParam === 'reviewed' ? statusParam : undefined
      const limit = Number(searchParams.get('limit') || 100)

      const data = await getAttendanceGeofenceWarnings({
        userId: searchParams.get('userId') || undefined,
        fromDate: searchParams.get('fromDate') || undefined,
        toDate: searchParams.get('toDate') || undefined,
        status,
        limit: Number.isFinite(limit) ? limit : 100,
      })

      return NextResponse.json({ data })
    } catch (error) {
      console.error('Get attendance warnings error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  })
}
