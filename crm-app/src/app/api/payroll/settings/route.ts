import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/middleware'
import { hasPermission } from '@/lib/auth/authorization'
import { getPayrollSettings, updatePayrollSettings } from '@/lib/db/queries/payroll'
import { z } from 'zod'

const updateSchema = z.object({
  basicPercentage: z.number().min(0).max(100).optional(),
  hraPercentage: z.number().min(0).max(100).optional(),
  conveyanceAllowance: z.number().min(0).optional(),
  medicalAllowance: z.number().min(0).optional(),
  pfEmployeeRate: z.number().min(0).max(100).optional(),
  pfEmployerRate: z.number().min(0).max(100).optional(),
  esiEmployeeRate: z.number().min(0).max(100).optional(),
  esiEmployerRate: z.number().min(0).max(100).optional(),
  esiThreshold: z.number().min(0).optional(),
  professionalTax: z.number().min(0).optional(),
  payrollDay: z.number().int().min(1).max(28).optional(),
  overtimeRateMultiplier: z.number().min(1).optional(),
  standardWorkingHours: z.number().min(1).max(24).optional(),
})

export async function GET(request: NextRequest) {
  return withAuth(request, async (user) => {
    try {
      if (!(await hasAnyPayrollPerm(user))) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      const settings = await getPayrollSettings()
      if (!settings) {
        return NextResponse.json({ error: 'Settings not found' }, { status: 404 })
      }

      return NextResponse.json({ data: settings })
    } catch (error) {
      console.error('GET /api/payroll/settings error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  })
}

export async function PUT(request: NextRequest) {
  return withAuth(request, async (user) => {
    try {
      if (!(await hasPermission(user, 'payroll.process'))) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      const settings = await getPayrollSettings()
      if (!settings) {
        return NextResponse.json({ error: 'Settings not found' }, { status: 404 })
      }

      const body = await request.json()
      const validated = updateSchema.parse(body)

      const updated = await updatePayrollSettings(settings.id, validated, user.userId)

      return NextResponse.json({ data: updated })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Validation error', details: error.errors },
          { status: 400 },
        )
      }
      console.error('PUT /api/payroll/settings error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  })
}

async function hasAnyPayrollPerm(user: { userId: string; email: string; role: string; updatedAt: string }): Promise<boolean> {
  return (
    (await hasPermission(user, 'payroll.view_all')) ||
    (await hasPermission(user, 'payroll.view_own')) ||
    (await hasPermission(user, 'payroll.process'))
  )
}
