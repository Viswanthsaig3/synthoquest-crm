import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/middleware'
import { hasPermission } from '@/lib/auth/authorization'
import { runPayroll } from '@/lib/services/payroll-runner'
import { checkPayrollRateLimit } from '@/lib/auth/rate-limit'
import { z } from 'zod'

const runSchema = z.object({
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2020).max(2100),
  selectedUserIds: z.array(z.string().uuid()).min(1),
  notes: z.string().optional(),
})

export async function POST(request: NextRequest) {
  return withAuth(request, async (user) => {
    try {
      if (!(await hasPermission(user, 'payroll.process'))) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      const rateLimit = await checkPayrollRateLimit(user.userId)
      if (!rateLimit.allowed) {
        return NextResponse.json(
          { 
            error: 'Too many payroll requests. Please wait before trying again.', 
            retryAfter: rateLimit.resetAt 
          },
          { status: 429 }
        )
      }

      const body = await request.json()
      const validated = runSchema.parse(body)

      const result = await runPayroll({
        month: validated.month,
        year: validated.year,
        selectedUserIds: validated.selectedUserIds,
        processedBy: user.userId,
        notes: validated.notes,
      })

      return NextResponse.json({
        run: result.run,
        records: result.records,
        skipped: result.skipped,
      }, { status: 201 })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Validation error', details: error.errors },
          { status: 400 },
        )
      }
      
      if (error instanceof Error) {
        if (error.message === 'Payroll settings not configured') {
          return NextResponse.json({ error: error.message }, { status: 400 })
        }
        if (error.message === 'No eligible employees to process') {
          return NextResponse.json({ error: error.message }, { status: 400 })
        }
      }
      
      console.error('POST /api/payroll/run error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  })
}