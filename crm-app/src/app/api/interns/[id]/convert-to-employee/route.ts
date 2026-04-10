import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/middleware'
import { hasPermission } from '@/lib/auth/authorization'
import { getInternById, updateIntern } from '@/lib/db/queries/interns'
import { getUserById, updateUserCompensation } from '@/lib/db/queries/users'
import { createAdminClient } from '@/lib/db/server-client'
import { z } from 'zod'

const conversionSchema = z.object({
  position: z.string().min(1, 'Position is required'),
  department: z.string().min(1, 'Department is required'),
  salary: z.number().min(0, 'Salary must be non-negative').optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  notes: z.string().max(500).optional(),
})

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  return withAuth(request, async (user) => {
    try {
      const canManageInterns = await hasPermission(user, 'interns.manage_all')
      const canManageEmployees = await hasPermission(user, 'employees.manage')
      const canConvert = await hasPermission(user, 'interns.convert_to_employee')

      if (!canManageInterns || !canManageEmployees || !canConvert) {
        return NextResponse.json(
          { error: 'Forbidden - Insufficient permissions to convert intern to employee' },
          { status: 403 }
        )
      }

      const intern = await getInternById(params.id)
      if (!intern) {
        return NextResponse.json({ error: 'Intern not found' }, { status: 404 })
      }

      if (!['active', 'completed'].includes(intern.status)) {
        return NextResponse.json(
          { error: 'Only active or completed interns can be converted to employees' },
          { status: 400 }
        )
      }

      const body = await request.json()
      const validated = conversionSchema.parse(body)

      const supabase = await createAdminClient()
      const nowIso = new Date().toISOString()

      const { error: roleUpdateError } = await supabase
        .from('users')
        .update({
          role: 'employee',
          department: validated.department,
          updated_at: nowIso,
        })
        .eq('id', params.id)

      if (roleUpdateError) throw roleUpdateError

      if (validated.salary && validated.salary > 0) {
        await updateUserCompensation({
          userId: params.id,
          compensationType: 'paid',
          compensationAmount: validated.salary,
          reason: `Converted from intern to employee - Position: ${validated.position}`,
          changedBy: user.userId,
        })
      }

      const { error: profileUpdateError } = await supabase
        .from('intern_profiles')
        .update({
          intern_status: 'converted',
          converted_to_employee_at: nowIso,
          notes: [
            intern.notes,
            `Converted to Employee - Position: ${validated.position}`,
            validated.startDate ? `Start Date: ${validated.startDate}` : '',
            validated.notes || '',
          ]
            .filter(Boolean)
            .join('\n'),
          updated_at: nowIso,
        })
        .eq('user_id', params.id)

      if (profileUpdateError) throw profileUpdateError

      const employee = await getUserById(params.id)
      if (!employee) {
        throw new Error('Failed to retrieve employee record after conversion')
      }

      return NextResponse.json({
        data: employee,
        message: `Successfully converted ${intern.name} from intern to employee`,
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Validation error', details: error.errors },
          { status: 400 }
        )
      }

      console.error('Convert intern to employee error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  })
}