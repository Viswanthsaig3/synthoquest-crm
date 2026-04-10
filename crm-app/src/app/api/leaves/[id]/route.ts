import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/middleware'
import { getLeaveById, updateLeave, deleteLeave } from '@/lib/db/queries/leaves'
import { hasPermission } from '@/lib/auth/authorization'
import { z } from 'zod'

const updateSchema = z.object({
  type: z.enum(['sick', 'casual', 'paid']).optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  reason: z.string().min(10).optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async (user) => {
    try {
      const leave = await getLeaveById(params.id)
      
      if (!leave) {
        return NextResponse.json({ error: 'Leave not found' }, { status: 404 })
      }
      
      if (leave.employeeId !== user.userId && !(await hasPermission(user, 'leaves.view_all'))) {
        if (await hasPermission(user, 'leaves.approve')) {
          const { createAdminClient } = await import('@/lib/db/server-client')
          const supabase = await createAdminClient()
          const { data: employee } = await supabase
            .from('users')
            .select('managed_by')
            .eq('id', leave.employeeId)
            .single()
          
          if (!employee || employee.managed_by !== user.userId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
          }
        } else {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }
      }
      
      return NextResponse.json({ data: leave })
    } catch (error) {
      console.error('Get leave error:', error)
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
      const leave = await getLeaveById(params.id)
      
      if (!leave) {
        return NextResponse.json({ error: 'Leave not found' }, { status: 404 })
      }
      
      if (leave.status !== 'pending') {
        return NextResponse.json(
          { error: 'Only pending leaves can be updated' },
          { status: 400 }
        )
      }
      
      if (leave.employeeId !== user.userId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
      
      const body = await request.json()
      const validated = updateSchema.parse(body)
      
      const updated = await updateLeave(params.id, validated)
      
      return NextResponse.json({ data: updated })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Validation error', details: error.errors },
          { status: 400 }
        )
      }
      console.error('Update leave error:', error)
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
      const leave = await getLeaveById(params.id)
      
      if (!leave) {
        return NextResponse.json({ error: 'Leave not found' }, { status: 404 })
      }
      
      if (leave.status !== 'pending') {
        return NextResponse.json(
          { error: 'Only pending leaves can be deleted' },
          { status: 400 }
        )
      }
      
      if (leave.employeeId !== user.userId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
      
      await deleteLeave(params.id)
      
      return NextResponse.json({ success: true })
    } catch (error) {
      console.error('Delete leave error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  })
}