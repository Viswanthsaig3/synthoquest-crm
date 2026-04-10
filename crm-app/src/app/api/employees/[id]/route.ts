import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/middleware'
import {
  getUserById,
  updateUser,
  deleteUser,
  updateUserCompensation,
} from '@/lib/db/queries/users'
import { getLoginLogsByUserId } from '@/lib/db/queries/login-logs'
import { hasPermission } from '@/lib/auth/authorization'
import { getRoleByKey } from '@/lib/db/queries/roles'
import { z } from 'zod'

const updateEmployeeSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().optional(),
  department: z.string().optional(),
  role: z.string().min(2).max(64).regex(/^[a-z][a-z0-9_]*$/).optional(),
  status: z.enum(['active', 'inactive', 'suspended']).optional(),
  salary: z.number().optional(),
  compensationType: z.enum(['paid', 'unpaid']).optional(),
  compensationAmount: z.number().min(0).nullable().optional(),
  compensationReason: z.string().max(500).optional(),
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
      const canViewAll = await hasPermission(user, 'employees.view_all')
      const canViewAssigned = await hasPermission(user, 'employees.manage_assigned')
      const isAssignedToManager = employee.managedBy === user.userId

      if (!isOwnProfile && !canViewAll && !(canViewAssigned && isAssignedToManager)) {
        return NextResponse.json(
          { error: 'Forbidden' },
          { status: 403 }
        )
      }

      const loginLogs = isOwnProfile || canViewAll || (canViewAssigned && isAssignedToManager)
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
      const canManageAll = await hasPermission(user, 'employees.manage')
      const canManageAssigned = await hasPermission(user, 'employees.manage_assigned')
      const canManageCompensation = await hasPermission(user, 'compensation.manage')
      const isAssignedToManager = employee.managedBy === user.userId

      if (!isOwnProfile && !canManageAll && !(canManageAssigned && isAssignedToManager)) {
        return NextResponse.json(
          { error: 'Forbidden' },
          { status: 403 }
        )
      }

      const body = await request.json()
      const validated = updateEmployeeSchema.parse(body)

      if (isOwnProfile && !canManageAll) {
        delete validated.role
        delete validated.status
        delete validated.department
        delete validated.salary
        delete validated.compensationType
        delete validated.compensationAmount
        delete validated.managedBy
      } else if (!canManageAll) {
        // Assigned manager scope: profile updates only, no role reassignment or manager transfer.
        delete validated.role
        delete validated.managedBy
      }

      const requestedCompensationUpdate =
        validated.salary !== undefined ||
        validated.compensationType !== undefined ||
        validated.compensationAmount !== undefined

      if (requestedCompensationUpdate && !canManageCompensation) {
        return NextResponse.json(
          { error: 'Forbidden: compensation update not allowed' },
          { status: 403 }
        )
      }

      if (requestedCompensationUpdate && canManageCompensation) {
        const compensationType =
          validated.compensationType ??
          (validated.salary !== undefined
            ? validated.salary > 0
              ? 'paid'
              : 'unpaid'
            : employee.compensationType || (employee.salary && employee.salary > 0 ? 'paid' : 'unpaid'))
        const compensationAmount =
          validated.compensationAmount !== undefined
            ? validated.compensationAmount
            : validated.salary !== undefined
            ? validated.salary
            : employee.compensationAmount

        await updateUserCompensation({
          userId: params.id,
          compensationType,
          compensationAmount,
          reason: validated.compensationReason,
          changedBy: user.userId,
        })

        delete validated.salary
        delete validated.compensationType
        delete validated.compensationAmount
      }

      delete validated.compensationReason

      if (validated.role) {
        if (!canManageAll) {
          return NextResponse.json({ error: 'Only admin/HR can update role' }, { status: 403 })
        }

        const role = await getRoleByKey(validated.role)
        if (!role) {
          return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
        }
      }

      const updatedEmployee = await updateUser(params.id, validated)

      const { password_hash, ...employeeResponse } = updatedEmployee as typeof updatedEmployee & {
        password_hash?: string
      }

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

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  return withAuth(request, async (user) => {
    try {
      const canManage = await hasPermission(user, 'employees.manage')
      
      if (!canManage) {
        return NextResponse.json(
          { error: 'Forbidden' },
          { status: 403 }
        )
      }

      const employee = await getUserById(params.id)

      if (!employee) {
        return NextResponse.json(
          { error: 'Employee not found' },
          { status: 404 }
        )
      }

      if (params.id === user.userId) {
        return NextResponse.json(
          { error: 'Cannot delete your own account' },
          { status: 400 }
        )
      }

      await deleteUser(params.id)

      return NextResponse.json({
        message: 'Employee deleted successfully',
      })
    } catch (error) {
      console.error('Delete employee error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  })
}
