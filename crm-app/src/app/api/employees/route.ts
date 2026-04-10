import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/middleware'
import { getUsers, createUser } from '@/lib/db/queries/users'
import { hasPermission } from '@/lib/auth/authorization'
import { getRoleByKey } from '@/lib/db/queries/roles'
import { hashPassword } from '@/lib/auth/password'
import { z } from 'zod'

const createEmployeeSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  password: z.string().min(8),
  phone: z.string().optional(),
  department: z.string(),
  role: z.string().min(2).max(64).regex(/^[a-z][a-z0-9_]*$/),
  salary: z.number().optional(),
  compensationType: z.enum(['paid', 'unpaid']).optional(),
  compensationAmount: z.number().min(0).nullable().optional(),
  managedBy: z.string().optional().nullable(),
})

const updateEmployeeSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().optional(),
  department: z.string().optional(),
  role: z.string().min(2).max(64).regex(/^[a-z][a-z0-9_]*$/).optional(),
  status: z.enum(['active', 'inactive', 'suspended']).optional(),
  salary: z.number().optional(),
  compensationType: z.enum(['paid', 'unpaid']).optional(),
  compensationAmount: z.number().min(0).nullable().optional(),
  managedBy: z.string().optional().nullable(),
  avatar: z.string().optional().nullable(),
})

export async function GET(request: NextRequest) {
  return withAuth(request, async (user) => {
    try {
      const canViewAll = await hasPermission(user, 'employees.view_all')
      const canViewAssigned = await hasPermission(user, 'employees.manage_assigned')

      if (!canViewAll && !canViewAssigned) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      const page = parseInt(request.nextUrl.searchParams.get('page') || '1')
      const limit = parseInt(request.nextUrl.searchParams.get('limit') || '20')
      const department = request.nextUrl.searchParams.get('department') || undefined
      const role = request.nextUrl.searchParams.get('role') || undefined
      const status = request.nextUrl.searchParams.get('status') || undefined
      const search = request.nextUrl.searchParams.get('search') || undefined

      const result = await getUsers({
        page,
        limit,
        department,
        role,
        status,
        search,
        managedBy: canViewAssigned && !canViewAll ? user.userId : undefined,
      })

      return NextResponse.json({
        data: result.data,
        pagination: {
          page,
          limit,
          total: result.pagination.total,
          totalPages: Math.ceil(result.pagination.total / limit),
        },
      })
    } catch (error) {
      console.error('Get employees error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  })
}

export async function POST(request: NextRequest) {
  return withAuth(request, async (user) => {
    try {
      const canManage = await hasPermission(user, 'employees.manage')
      
      if (!canManage) {
        return NextResponse.json(
          { error: 'Forbidden' },
          { status: 403 }
        )
      }

      const body = await request.json()
      const validated = createEmployeeSchema.parse(body)
      const canManageCompensation = await hasPermission(user, 'compensation.manage')

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

      const role = await getRoleByKey(validated.role)
      if (!role) {
        return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
      }

      const { password, ...userData } = validated

      const passwordHash = await hashPassword(password)

      const newUser = await createUser({
        ...userData,
        passwordHash,
        phone: userData.phone || '',
        managedBy: userData.managedBy || null,
        compensationType:
          userData.compensationType ??
          (userData.salary !== undefined && userData.salary > 0 ? 'paid' : 'unpaid'),
        compensationAmount:
          userData.compensationAmount !== undefined
            ? userData.compensationAmount
            : userData.salary !== undefined && userData.salary > 0
            ? userData.salary
            : null,
        status: 'active',
        avatar: null,
      })
      const { password_hash, ...userResponse } = newUser as typeof newUser & {
        password_hash?: string
      }

      return NextResponse.json({
        data: userResponse,
      }, { status: 201 })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Validation error', details: error.errors },
          { status: 400 }
        )
      }

      console.error('Create employee error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  })
}
