import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/middleware'
import { getUsers, createUser, updateUser } from '@/lib/db/queries/users'
import { hasPermission } from '@/lib/permissions'
import { z } from 'zod'

const createEmployeeSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  password: z.string().min(8),
  phone: z.string().optional(),
  department: z.string(),
  role: z.enum(['admin', 'hr', 'team_lead', 'sales_rep', 'employee']),
  salary: z.number().optional(),
  managedBy: z.string().optional().nullable(),
})

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

export async function GET(request: NextRequest) {
  return withAuth(request, async (user) => {
    try {
      const canView = hasPermission({ role: user.role } as any, 'employees.view_all')
      
      if (!canView) {
        return NextResponse.json(
          { error: 'Forbidden' },
          { status: 403 }
        )
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
      const canManage = hasPermission({ role: user.role } as any, 'employees.manage')
      
      if (!canManage) {
        return NextResponse.json(
          { error: 'Forbidden' },
          { status: 403 }
        )
      }

      const body = await request.json()
      const validated = createEmployeeSchema.parse(body)

      const { password, ...userData } = validated

      const newUser = await createUser({
        ...userData,
        passwordHash: password,
        phone: userData.phone || '',
        managedBy: userData.managedBy || null,
        status: 'active',
        avatar: null,
      })

      const { password_hash, ...userResponse } = newUser

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
