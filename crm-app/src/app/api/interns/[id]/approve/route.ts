import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/middleware'
import { hasPermission, isAdmin } from '@/lib/auth/authorization'
import { approveIntern, getInternById } from '@/lib/db/queries/interns'
import { createAdminClient } from '@/lib/db/server-client'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  return withAuth(request, async (user) => {
    try {
      const canApprove =
        (await hasPermission(user, 'interns.approve')) ||
        (await hasPermission(user, 'interns.manage_all')) ||
        (await hasPermission(user, 'employees.manage'))

      if (!canApprove) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      const existing = await getInternById(params.id)
      if (!existing) {
        return NextResponse.json({ error: 'Intern not found' }, { status: 404 })
      }

      // SECURITY: Ownership check - only admins or assigned managers can approve
      if (!isAdmin(user)) {
        const supabase = await createAdminClient()
        const { data: internUser } = await supabase
          .from('users')
          .select('managed_by')
          .eq('id', params.id)
          .is('deleted_at', null)
          .single()

        const canManageAll = await hasPermission(user, 'interns.manage_all')
        if (!canManageAll && internUser?.managed_by !== user.userId) {
          return NextResponse.json({ 
            error: 'Forbidden - You can only approve interns assigned to you' 
          }, { status: 403 })
        }
      }

      const updated = await approveIntern(params.id, user.userId)

      return NextResponse.json({ data: updated, message: 'Intern approved successfully' })
    } catch (error) {
      console.error('Approve intern error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  })
}
