import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/middleware'
import { approveTimeEntry } from '@/lib/db/queries/time-entries'
import { createAdminClient } from '@/lib/db/server-client'
import { hasPermission, isAdmin } from '@/lib/auth/authorization'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async (user) => {
    try {
      const canApprove = await hasPermission(user, 'timesheets.approve')
      
      if (!canApprove) {
        return NextResponse.json(
          { error: 'Forbidden - You do not have permission to approve time entries' },
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
          { error: 'Forbidden - You can only approve your team entries' },
          { status: 403 }
        )
      }

      if (entryRow.status !== 'pending') {
        return NextResponse.json(
          { error: 'Only pending time entries can be approved' },
          { status: 400 }
        )
      }

      const entry = await approveTimeEntry(params.id, user.userId)

      return NextResponse.json({ 
        data: entry,
        message: 'Time entry approved successfully' 
      })
    } catch (error) {
      console.error('Approve time entry error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  })
}
