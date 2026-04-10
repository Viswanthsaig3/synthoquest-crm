import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/middleware'
import { getPendingEntries } from '@/lib/db/queries/timesheets'
import { createAdminClient } from '@/lib/db/server-client'
import { hasPermission } from '@/lib/auth/authorization'

export async function GET(request: NextRequest) {
  return withAuth(request, async (user) => {
    try {
      const { searchParams } = new URL(request.url)
      
      const canViewAll = await hasPermission(user, 'timesheets.view_all')
      const canApprove = await hasPermission(user, 'timesheets.approve')

      if (!canApprove) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      const filters: {
        employeeId?: string
        employeeIds?: string[]
        fromDate?: string
        toDate?: string
        page: number
        limit: number
      } = {
        fromDate: searchParams.get('fromDate') || searchParams.get('from_date') || undefined,
        toDate: searchParams.get('toDate') || searchParams.get('to_date') || undefined,
        page: parseInt(searchParams.get('page') || '1'),
        limit: parseInt(searchParams.get('limit') || '100'),
      }

      if (canViewAll) {
        const requestedEmployeeId = searchParams.get('employeeId') || searchParams.get('employee_id')
        if (requestedEmployeeId) {
          filters.employeeId = requestedEmployeeId
        }
      } else {
        const supabase = await createAdminClient()
        const { data: teamMembers } = await supabase
          .from('users')
          .select('id')
          .eq('managed_by', user.userId)
          .is('deleted_at', null)

        const allowedIds = [user.userId, ...(teamMembers || []).map((m: { id: string }) => m.id)]
        filters.employeeIds = allowedIds
      }

      const result = await getPendingEntries(filters)

      return NextResponse.json({
        data: result.data,
        pagination: {
          page: filters.page,
          limit: filters.limit,
          total: result.total,
          totalPages: Math.ceil(result.total / filters.limit),
        },
      })
    } catch (error) {
      console.error('Get pending entries error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  })
}
