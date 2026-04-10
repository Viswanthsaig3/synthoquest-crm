import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/middleware'
import { approveLeave, getLeaveById } from '@/lib/db/queries/leaves'
import { hasPermission, isAdmin } from '@/lib/auth/authorization'
import { createAdminClient } from '@/lib/db/server-client'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async (user) => {
    try {
      if (!(await hasPermission(user, 'leaves.approve'))) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
      
      const leave = await getLeaveById(params.id)
      
      if (!leave) {
        return NextResponse.json({ error: 'Leave not found' }, { status: 404 })
      }
      
      if (leave.status !== 'pending') {
        return NextResponse.json(
          { error: 'Only pending leaves can be approved' },
          { status: 400 }
        )
      }
      
      // SECURITY: Prevent self-approval of own leave requests
      if (leave.employeeId === user.userId) {
        return NextResponse.json(
          { error: 'Cannot approve your own leave requests' },
          { status: 403 }
        )
      }
      
      if (!isAdmin(user)) {
        const supabase = await createAdminClient()
        const { data: employee } = await supabase
          .from('users')
          .select('managed_by')
          .eq('id', leave.employeeId)
          .is('deleted_at', null)
          .single()
        
        if (!employee || employee.managed_by !== user.userId) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }
      }
      
      const approved = await approveLeave(params.id, user.userId)
      
      return NextResponse.json({ data: approved })
    } catch (error) {
      console.error('Approve leave error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  })
}