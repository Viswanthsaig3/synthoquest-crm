import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/middleware'
import { getLeaveBalance, updateLeaveBalanceAllocation, initializeLeaveBalance } from '@/lib/db/queries/leaves'
import { hasPermission, isAdmin } from '@/lib/auth/authorization'
import { z } from 'zod'

const updateSchema = z.object({
  employeeId: z.string().uuid(),
  year: z.number().int().min(2020).max(2050),
  month: z.number().int().min(1).max(12),
  sickTotal: z.number().int().min(0).optional(),
  casualTotal: z.number().int().min(0).optional(),
  paidTotal: z.number().int().min(0).optional(),
})

const initializeSchema = z.object({
  employeeId: z.string().uuid(),
  year: z.number().int().min(2020).max(2050),
  month: z.number().int().min(1).max(12),
  sickTotal: z.number().int().min(0),
  casualTotal: z.number().int().min(0),
  paidTotal: z.number().int().min(0),
})

export async function GET(request: NextRequest) {
  return withAuth(request, async (user) => {
    try {
      const { searchParams } = new URL(request.url)
      const employeeId = searchParams.get('employeeId') || user.userId
      const year = parseInt(searchParams.get('year') || '') || new Date().getFullYear()
      const month = parseInt(searchParams.get('month') || '') || new Date().getMonth() + 1
      
      if (employeeId !== user.userId && !(await hasPermission(user, 'leaves.view_all'))) {
        if (await hasPermission(user, 'leaves.approve')) {
          const { createAdminClient } = await import('@/lib/db/server-client')
          const supabase = await createAdminClient()
          const { data: employee } = await supabase
            .from('users')
            .select('managed_by')
            .eq('id', employeeId)
            .single()
          
          if (!employee || employee.managed_by !== user.userId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
          }
        } else {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }
      }
      
      const balance = await getLeaveBalance(employeeId, year, month)
      
      if (!balance) {
        return NextResponse.json({
          data: {
            sick: 0,
            casual: 0,
            paid: 0,
          }
        })
      }
      
      return NextResponse.json({ data: balance })
    } catch (error) {
      console.error('Get leave balance error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  })
}

export async function POST(request: NextRequest) {
  return withAuth(request, async (user) => {
    try {
      if (!(await hasPermission(user, 'leaves.manage_balances')) && !isAdmin(user)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
      
      const body = await request.json()
      const validated = initializeSchema.parse(body)
      
      const balance = await initializeLeaveBalance({
        employeeId: validated.employeeId,
        year: validated.year,
        month: validated.month,
        sickTotal: validated.sickTotal,
        casualTotal: validated.casualTotal,
        paidTotal: validated.paidTotal,
        createdBy: user.userId,
      })
      
      return NextResponse.json({ data: balance }, { status: 201 })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Validation error', details: error.errors },
          { status: 400 }
        )
      }
      console.error('Initialize leave balance error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  })
}

export async function PUT(request: NextRequest) {
  return withAuth(request, async (user) => {
    try {
      if (!(await hasPermission(user, 'leaves.manage_balances')) && !isAdmin(user)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
      
      const body = await request.json()
      const validated = updateSchema.parse(body)
      
      const balance = await updateLeaveBalanceAllocation(
        validated.employeeId,
        validated.year,
        validated.month,
        {
          sickTotal: validated.sickTotal,
          casualTotal: validated.casualTotal,
          paidTotal: validated.paidTotal,
        },
        user.userId
      )
      
      return NextResponse.json({ data: balance })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Validation error', details: error.errors },
          { status: 400 }
        )
      }
      console.error('Update leave balance error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  })
}