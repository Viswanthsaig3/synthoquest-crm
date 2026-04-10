import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/middleware'
import { getTeamTodayPresence } from '@/lib/db/queries/attendance'
import { resolveTeamTodayUserIds } from '@/lib/auth/attendance-scope'
import type { AttendanceRecord } from '@/types/time-entry'

function computeStats(
  rows: { record: AttendanceRecord | null; sessionsToday?: AttendanceRecord[] }[],
  totalPeople: number
) {
  let checkedInNoCheckout = 0
  let notCheckedIn = 0
  /** Had at least one session today, all sessions closed (can check in again). */
  let betweenSessions = 0
  let late = 0
  let outOfRadius = 0

  for (const row of rows) {
    const sessions = row.sessionsToday ?? (row.record?.checkInTime ? [row.record] : [])
    if (sessions.length === 0) {
      notCheckedIn += 1
      continue
    }
    const open = sessions.find((s) => s.checkInTime && !s.checkOutTime)
    if (open) {
      checkedInNoCheckout += 1
    } else {
      betweenSessions += 1
    }
    if (sessions.some((s) => s.isLate)) late += 1
    if (
      sessions.some(
        (s) => s.checkInInRadius === false || s.checkOutInRadius === false
      )
    ) {
      outOfRadius += 1
    }
  }

  return {
    total: totalPeople,
    checkedInNoCheckout,
    notCheckedIn,
    betweenSessions,
    late,
    outOfRadius,
  }
}

/**
 * Today’s workforce presence for HR / managers.
 * Query: ?date=YYYY-MM-DD (optional, default today UTC), ?department= (only with org-wide scope)
 */
export async function GET(request: NextRequest) {
  return withAuth(request, async (user) => {
    try {
      const searchParams = request.nextUrl.searchParams
      const dateParam = searchParams.get('date') || undefined
      const department = searchParams.get('department') || undefined

      const workDate = dateParam || new Date().toISOString().split('T')[0]

      const scope = await resolveTeamTodayUserIds(user, department || null)
      if (!scope.ok) {
        return NextResponse.json({ error: scope.message }, { status: scope.status })
      }

      const rows = await getTeamTodayPresence(scope.userIds, workDate)
      const stats = computeStats(rows, rows.length)

      return NextResponse.json({ data: rows, stats, date: workDate })
    } catch (error) {
      console.error('Team today attendance error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  })
}
