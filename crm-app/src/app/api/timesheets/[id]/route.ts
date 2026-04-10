import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/middleware'
import {
  deleteTimesheet,
  getTimesheetApprovals,
  getTimesheetById,
  updateTimesheet,
} from '@/lib/db/queries/timesheets'
import { createAdminClient } from '@/lib/db/server-client'
import { hasPermission } from '@/lib/auth/authorization'
import { z } from 'zod'

const updateSchema = z.object({
  notes: z.string().nullable().optional(),
})

async function canTeamLeadAccessTimesheet(teamLeadId: string, employeeId: string): Promise<boolean> {
  const supabase = await createAdminClient()
  const { data, error } = await supabase
    .from('users')
    .select('id')
    .eq('id', employeeId)
    .eq('managed_by', teamLeadId)
    .is('deleted_at', null)
    .single()

  if (error || !data) return false
  return true
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async (user) => {
    try {
      const timesheet = await getTimesheetById(params.id)

      if (!timesheet) {
        return NextResponse.json({ error: 'Timesheet not found' }, { status: 404 })
      }

      const canViewOwn = timesheet.employeeId === user.userId
      const canViewAll = await hasPermission(user, 'timesheets.view_all')
      let canView = canViewAll || canViewOwn

      if ((await hasPermission(user, 'timesheets.approve')) && !canView) {
        canView = await canTeamLeadAccessTimesheet(user.userId, timesheet.employeeId)
      }

      if (!canView) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      const approvals = await getTimesheetApprovals(params.id)

      return NextResponse.json({ data: timesheet, approvals })
    } catch (error) {
      console.error('Get timesheet error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  })
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async (user) => {
    try {
      const timesheet = await getTimesheetById(params.id)

      if (!timesheet) {
        return NextResponse.json({ error: 'Timesheet not found' }, { status: 404 })
      }

      if (timesheet.employeeId !== user.userId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      const body = await request.json()
      const validated = updateSchema.parse(body)

      const updated = await updateTimesheet(params.id, {
        notes: validated.notes ?? null,
      })

      return NextResponse.json({ data: updated })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
      }
      console.error('Update timesheet error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async (user) => {
    try {
      const timesheet = await getTimesheetById(params.id)

      if (!timesheet) {
        return NextResponse.json({ error: 'Timesheet not found' }, { status: 404 })
      }

      if (timesheet.employeeId !== user.userId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      await deleteTimesheet(params.id)

      return NextResponse.json({ message: 'Timesheet deleted successfully' })
    } catch (error) {
      console.error('Delete timesheet error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  })
}
