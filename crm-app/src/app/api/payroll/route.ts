import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/middleware'
import { hasPermission } from '@/lib/auth/authorization'
import { getPayrollRecords, getPayrollSummary } from '@/lib/db/queries/payroll'

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
      const status = searchParams.get('status') || undefined
      const page = parseInt(searchParams.get('page') || '1', 10)
      const limit = parseInt(searchParams.get('limit') || '20', 10)

      const filters: Record<string, unknown> = { month, year, status, page, limit }

      if (!canViewAll) {
        filters.userId = user.userId
      } else {
        const userIdParam = searchParams.get('userId')
        if (userIdParam) filters.userId = userIdParam
      }

      const result = await getPayrollRecords(filters as Parameters<typeof getPayrollRecords>[0])

      return NextResponse.json({
        data: result.data,
        pagination: result.pagination,
      })
    } catch (error) {
      console.error('GET /api/payroll error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  })
}
