import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/middleware'
import { getOfficeLocationSettings } from '@/lib/db/queries/attendance'

export async function GET(request: NextRequest) {
  return withAuth(request, async () => {
    try {
      const data = await getOfficeLocationSettings()
      return NextResponse.json({ data })
    } catch (error) {
      console.error('Get office location error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  })
}