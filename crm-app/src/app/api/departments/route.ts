import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/middleware'
import { hasPermission } from '@/lib/auth/authorization'
import { createDepartment, listDepartments } from '@/lib/db/queries/departments'
import { z } from 'zod'

const createDepartmentSchema = z.object({
  key: z.string().min(2).max(64).regex(/^[a-z_]+$/),
  name: z.string().min(1).max(255),
  sortOrder: z.number().int().optional(),
})

export async function GET(request: NextRequest) {
  return withAuth(request, async () => {
    try {
      const { searchParams } = new URL(request.url)
      const includeArchived = searchParams.get('includeArchived') === 'true'
      const departments = await listDepartments({ includeArchived })
      return NextResponse.json({ data: departments })
    } catch (error) {
      console.error('Get departments error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  })
}

export async function POST(request: NextRequest) {
  return withAuth(request, async (user) => {
    try {
      const canManage = await hasPermission(user, 'employees.manage')
      if (!canManage) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      const body = await request.json()
      const validated = createDepartmentSchema.parse(body)
      const department = await createDepartment({
        key: validated.key,
        name: validated.name,
        sortOrder: validated.sortOrder,
      })
      return NextResponse.json({ data: department }, { status: 201 })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
      }
      console.error('Create department error:', error)
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Internal server error' },
        { status: 500 }
      )
    }
  })
}
