import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/middleware'
import { getNowTimeKeyForApi, getTimeZoneForApi, getTodayDateKeyForApi } from '@/lib/date-utils'

export async function GET(request: NextRequest) {
  return withAuth(request, async () => {
    return NextResponse.json({
      data: {
        timezone: getTimeZoneForApi(),
        todayKey: getTodayDateKeyForApi(),
        nowTime: getNowTimeKeyForApi(),
      },
    })
  })
}
