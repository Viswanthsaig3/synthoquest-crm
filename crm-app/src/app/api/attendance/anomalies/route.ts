import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/middleware'
import { hasPermission } from '@/lib/auth/authorization'
import { getAttendanceAnomalies } from '@/lib/db/queries/attendance'

export async function GET(request: NextRequest) {
  return withAuth(request, async (user) => {
    try {
      const canViewWarnings = await hasPermission(user, 'attendance.view_warnings')
      if (!canViewWarnings) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      const searchParams = request.nextUrl.searchParams
      const fromDate = searchParams.get('fromDate')
      const toDate = searchParams.get('toDate')
      const userId = searchParams.get('userId')
      const limit = Number(searchParams.get('limit') || 100)

      const result = await getAttendanceAnomalies({
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
        userId: userId || undefined,
        limit: Number.isFinite(limit) ? limit : 100,
      })

      const summary = {
        spoofingCount: result.anomalies.spoofing.length,
        impossibleTravelCount: result.anomalies.impossibleTravel.length,
        verificationFailedCount: result.anomalies.verificationFailed.length,
        selfUpdatedLocationsCount: result.anomalies.selfUpdatedLocations.length,
        totalAnomalies:
          result.anomalies.spoofing.length +
          result.anomalies.impossibleTravel.length +
          result.anomalies.verificationFailed.length +
          result.anomalies.selfUpdatedLocations.length,
      }

      return NextResponse.json({
        data: result.anomalies,
        summary,
        meta: {
          fromDate: fromDate || new Date(Date.now() - 7 * 24 * 3600000).toISOString().split('T')[0],
          toDate: toDate || new Date().toISOString().split('T')[0],
          limit,
        },
      })
    } catch (error) {
      console.error('Get attendance anomalies error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  })
}