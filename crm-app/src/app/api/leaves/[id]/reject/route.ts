import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/middleware'
import { rejectLeave, getLeaveById } from '@/lib/db/queries/leaves'
import { hasPermission, isAdmin } from '@/lib/auth/authorization'
import { createAdminClient } from '@/lib/db/server-client'
import { z } from 'zod'

const rejectSchema = z.object({
  reason: z.string().min(10, 'Rejection reason must be at least 10 characters'),
})

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
          { error: 'Only pending leaves can be rejected' },
          { status: 400 }
        )
      }
      
      // SECURITY: Prevent self-rejection of own leave requests
      if (leave.employeeId === user.userId) {
        return NextResponse.json(
          { error: 'Cannot reject your own leave requests' },
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
      
      const body = await request.json()
      const validated = rejectSchema.parse(body)
      
      const rejected = await rejectLeave(params.id, user.userId, validated.reason)
      
      return NextResponse.json({ data: rejected })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Validation error', details: error.errors },
          { status: 400 }
        )
      }
      console.error('Reject leave error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  })
}