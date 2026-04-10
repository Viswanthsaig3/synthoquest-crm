import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/middleware'
import { rejectTimeEntry } from '@/lib/db/queries/time-entries'
import { createAdminClient } from '@/lib/db/server-client'
import { hasPermission, isAdmin } from '@/lib/auth/authorization'
import { z } from 'zod'

const rejectSchema = z.object({
  reason: z.string().min(5, 'Rejection reason must be at least 5 characters')
})

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async (user) => {
    try {
      const canApprove = await hasPermission(user, 'timesheets.approve')
      
      if (!canApprove) {
        return NextResponse.json(
          { error: 'Forbidden - You do not have permission to reject time entries' },
          { status: 403 }
        )
      }

      const supabase = await createAdminClient()
      const { data: entryRow, error: entryError } = await supabase
        .from('time_entries')
        .select('id, user_id, status, user:users!time_entries_user_id_fkey(managed_by)')
        .eq('id', params.id)
        .is('deleted_at', null)
        .single()

      if (entryError || !entryRow) {
        return NextResponse.json({ error: 'Time entry not found' }, { status: 404 })
      }

      const userRelation = Array.isArray(entryRow.user)
        ? entryRow.user[0]
        : (entryRow.user as { managed_by?: string | null } | null)
      const managedBy = userRelation?.managed_by

      const canManageEntry = isAdmin(user) || managedBy === user.userId

      if (!canManageEntry) {
        return NextResponse.json(
          { error: 'Forbidden - You can only reject your team entries' },
          { status: 403 }
        )
      }

      if (entryRow.status !== 'pending') {
        return NextResponse.json(
          { error: 'Only pending time entries can be rejected' },
          { status: 400 }
        )
      }

      const body = await request.json()
      const validated = rejectSchema.parse(body)

      const entry = await rejectTimeEntry(params.id, user.userId, validated.reason)

      return NextResponse.json({ 
        data: entry,
        message: 'Time entry rejected' 
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Validation error', details: error.errors },
          { status: 400 }
        )
      }
      console.error('Reject time entry error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  })
}
