import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/middleware'
import { approveEntry } from '@/lib/db/queries/timesheets'
import { createAdminClient } from '@/lib/db/server-client'
import { hasPermission } from '@/lib/auth/authorization'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async (user) => {
    try {
      const supabase = await createAdminClient()
      
      const { data: entry } = await supabase
        .from('timesheet_entries')
        .select(
          '*, timesheet:timesheets!timesheet_entries_timesheet_id_fkey(employee_id, user:users!timesheets_employee_id_fkey(managed_by))'
        )
        .eq('id', params.id)
        .single()

      if (!entry) {
        return NextResponse.json({ error: 'Entry not found' }, { status: 404 })
      }

      const canApprove = await hasPermission(user, 'timesheets.approve')
      const canViewAll = await hasPermission(user, 'timesheets.view_all')

      const employeeId = entry.timesheet?.employee_id
      const managedBy = entry.timesheet?.user?.managed_by
      const isManager = managedBy === user.userId

      // SECURITY: Prevent self-approval of own timesheet entries
      if (employeeId === user.userId) {
        return NextResponse.json(
          { error: 'Cannot approve your own timesheet entries' },
          { status: 403 }
        )
      }

      if (!canViewAll && !isManager) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      if (!canApprove) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      const approvedEntry = await approveEntry(params.id, user.userId)

      return NextResponse.json({ data: approvedEntry })
    } catch (error) {
      console.error('Approve entry error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  })
}
