import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/middleware'
import { rejectEntry } from '@/lib/db/queries/timesheets'
import { createAdminClient } from '@/lib/db/server-client'
import { hasPermission } from '@/lib/auth/authorization'
import { z } from 'zod'

const rejectSchema = z.object({
  reason: z.string().min(1, 'Rejection reason is required'),
})

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async (user) => {
    try {
      const body = await request.json()
      const validated = rejectSchema.parse(body)

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

      // SECURITY: Prevent self-approval/rejection of own timesheet entries
      if (employeeId === user.userId) {
        return NextResponse.json(
          { error: 'Cannot reject your own timesheet entries' },
          { status: 403 }
        )
      }

      if (!canViewAll && !isManager) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      if (!canApprove) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      const rejectedEntry = await rejectEntry(params.id, user.userId, validated.reason)

      return NextResponse.json({ data: rejectedEntry })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
      }
      console.error('Reject entry error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  })
}
