import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/middleware'
import { cancelLeave, getLeaveById } from '@/lib/db/queries/leaves'
import { hasPermission, isAdmin } from '@/lib/auth/authorization'
import { createAdminClient } from '@/lib/db/server-client'
import { z } from 'zod'

const cancelSchema = z.object({
  reason: z.string().min(10, 'Cancellation reason must be at least 10 characters'),
})

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async (user) => {
    try {
      const canCancel = await hasPermission(user, 'leaves.cancel') || 
                        await hasPermission(user, 'leaves.approve')
      
      if (!canCancel && !isAdmin(user)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
      
      const leave = await getLeaveById(params.id)
      
      if (!leave) {
        return NextResponse.json({ error: 'Leave not found' }, { status: 404 })
      }
      
      if (leave.status !== 'approved') {
        return NextResponse.json(
          { error: 'Only approved leaves can be cancelled' },
          { status: 400 }
        )
      }
      
      const body = await request.json()
      const validated = cancelSchema.parse(body)
      
      if (leave.employeeId !== user.userId && !isAdmin(user)) {
        if (await hasPermission(user, 'leaves.approve')) {
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
        } else {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }
      }
      
      const cancelled = await cancelLeave(params.id, user.userId)
      
      return NextResponse.json({ data: cancelled })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Validation error', details: error.errors },
          { status: 400 }
        )
      }
      console.error('Cancel leave error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  })
}