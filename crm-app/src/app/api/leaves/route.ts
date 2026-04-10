import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/middleware'
import { getLeaves, createLeave, checkLeaveBalance, GetLeavesFilters } from '@/lib/db/queries/leaves'
import { hasPermission, isAdmin } from '@/lib/auth/authorization'
import { createAdminClient } from '@/lib/db/server-client'
import { z } from 'zod'
import type { LeaveType, LeaveStatus } from '@/types/leave'

const createSchema = z.object({
  type: z.enum(['sick', 'casual', 'paid']),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  reason: z.string().min(10, 'Reason must be at least 10 characters'),
})

export async function GET(request: NextRequest) {
  return withAuth(request, async (user) => {
    try {
      const { searchParams } = new URL(request.url)
      
      const filters: GetLeavesFilters = {
        status: (searchParams.get('status') || undefined) as LeaveStatus | undefined,
        type: (searchParams.get('type') || undefined) as LeaveType | undefined,
        year: parseInt(searchParams.get('year') || '') || undefined,
        month: parseInt(searchParams.get('month') || '') || undefined,
        startDate: searchParams.get('startDate') || undefined,
        endDate: searchParams.get('endDate') || undefined,
        page: parseInt(searchParams.get('page') || '1', 10),
        limit: parseInt(searchParams.get('limit') || '20', 10),
      }
      
      if (await hasPermission(user, 'leaves.view_all') || isAdmin(user)) {
        filters.employeeId = searchParams.get('employeeId') || undefined
      } else if (await hasPermission(user, 'leaves.approve')) {
        const supabase = await createAdminClient()
        const { data: teamMembers } = await supabase
          .from('users')
          .select('id')
          .eq('managed_by', user.userId)
          .is('deleted_at', null)
        
        const teamIds = [user.userId, ...(teamMembers || []).map((m: { id: string }) => m.id)]
        const requestedEmployeeId = searchParams.get('employeeId')
        
        if (requestedEmployeeId) {
          if (!teamIds.includes(requestedEmployeeId)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
          }
          filters.employeeId = requestedEmployeeId
        } else {
          filters.employeeIds = teamIds
        }
      } else if (await hasPermission(user, 'leaves.apply')) {
        filters.employeeId = user.userId
      } else {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
      
      const result = await getLeaves(filters)
      
      const limit = filters.limit ?? 20
      
      return NextResponse.json({
        data: result.data,
        pagination: {
          page: filters.page,
          limit,
          total: result.total,
          totalPages: Math.ceil(result.total / limit),
        },
      })
    } catch (error) {
      console.error('Get leaves error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  })
}

export async function POST(request: NextRequest) {
  return withAuth(request, async (user) => {
    try {
      if (!(await hasPermission(user, 'leaves.apply'))) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
      
      const body = await request.json()
      const validated = createSchema.parse(body)
      
      const today = new Date().toISOString().split('T')[0]
      if (validated.startDate < today) {
        return NextResponse.json(
          { error: 'Start date must be today or future' },
          { status: 400 }
        )
      }
      
      if (validated.endDate < validated.startDate) {
        return NextResponse.json(
          { error: 'End date must be after start date' },
          { status: 400 }
        )
      }
      
      // SECURITY: Calculate actual leave days and validate against remaining balance
      const { calculateDays } = await import('@/lib/db/queries/leaves')
      const requestedDays = calculateDays(validated.startDate, validated.endDate)

      const hasBalance = await checkLeaveBalance(
        user.userId,
        validated.type,
        requestedDays,
        validated.startDate
      )
      
      if (!hasBalance) {
        return NextResponse.json(
          { error: `Insufficient leave balance. You requested ${requestedDays} day(s) but do not have enough ${validated.type} leave remaining.` },
          { status: 400 }
        )
      }
      
      const leave = await createLeave({
        employeeId: user.userId,
        type: validated.type,
        startDate: validated.startDate,
        endDate: validated.endDate,
        reason: validated.reason,
      })
      
      return NextResponse.json({ data: leave }, { status: 201 })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Validation error', details: error.errors },
          { status: 400 }
        )
      }
      console.error('Create leave error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  })
}