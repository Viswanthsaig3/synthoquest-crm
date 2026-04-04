import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/middleware'
import { getUserById, updateUser } from '@/lib/db/queries/users'
import { getLoginLogsByUserId } from '@/lib/db/queries/login-logs'
import { hasPermission } from '@/lib/permissions'
import { z } from 'zod'

const updateEmployeeSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().optional(),
  department: z.string().optional(),
  role: z.enum(['admin', 'hr', 'team_lead', 'sales_rep', 'employee']).optional(),
  status: z.enum(['active', 'inactive', 'suspended']).optional(),
  salary: z.number().optional(),
  managedBy: z.string().optional().nullable(),
  avatar: z.string().optional().nullable(),
})

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  return withAuth(request, async (user) => {
    try {
      const employee = await getUserById(params.id)

      if (!employee) {
        return NextResponse.json(
          { error: 'Employee not found' },
          { status: 404 }
        )
      }

      const isOwnProfile = employee.id === user.userId
      const canViewAll = hasPermission({ role: user.role } as any, 'employees.view_all')

      if (!isOwnProfile && !canViewAll) {
        return NextResponse.json(
          { error: 'Forbidden' },
          { status: 403 }
        )
      }

      const loginLogs = isOwnProfile || canViewAll
        ? await getLoginLogsByUserId(params.id, 10)
        : []

      const { password_hash, ...employeeResponse } = employee

      return NextResponse.json({
        data: {
          ...employeeResponse,
          recentLogins: loginLogs,
        },
      })
    } catch (error) {
      console.error('Get employee error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  })
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  return withAuth(request, async (user) => {
    try {
      const employee = await getUserById(params.id)

      if (!employee) {
        return NextResponse.json(
          { error: 'Employee not found' },
          { status: 404 }
        )
      }

      const isOwnProfile = employee.id === user.userId
      const canManage = hasPermission({ role: user.role } as any, 'employees.manage')

      if (!isOwnProfile && !canManage) {
        return NextResponse.json(
          { error: 'Forbidden' },
          { status: 403 }
        )
      }

      const body = await request.json()
      const validated = updateEmployeeSchema.parse(body)

      if (isOwnProfile && !canManage) {
        delete validated.role
        delete validated.status
        delete validated.department
        delete validated.salary
        delete validated.managedBy
      }

      const updatedEmployee = await updateUser(params.id, validated)

      const { password_hash, ...employeeResponse } = updatedEmployee

      return NextResponse.json({
        data: employeeResponse,
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Validation error', details: error.errors },
          { status: 400 }
        )
      }

      console.error('Update employee error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  })
}
