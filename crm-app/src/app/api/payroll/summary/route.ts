import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/middleware'
import { hasPermission } from '@/lib/auth/authorization'
import { getPayrollSummary } from '@/lib/db/queries/payroll'

export async function GET(request: NextRequest) {
  return withAuth(request, async (user) => {
    try {
      const canViewAll = await hasPermission(user, 'payroll.view_all')
      const canViewOwn = await hasPermission(user, 'payroll.view_own')

      if (!canViewAll && !canViewOwn) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      const { searchParams } = new URL(request.url)
      const month = parseInt(searchParams.get('month') || '') || undefined
      const year = parseInt(searchParams.get('year') || '') || undefined

      const summary = await getPayrollSummary(canViewAll ? month : undefined, canViewAll ? year : undefined)

      return NextResponse.json({ data: summary })
    } catch (error) {
      console.error('GET /api/payroll/summary error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  })
}
