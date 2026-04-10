import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/middleware'
import { hasPermission } from '@/lib/auth/authorization'
import { getDepartmentByKey, updateDepartment } from '@/lib/db/queries/departments'
import { z } from 'zod'

const patchSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  sortOrder: z.number().int().optional(),
  archived: z.boolean().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: { key: string } }
) {
  return withAuth(request, async () => {
    try {
      const department = await getDepartmentByKey(decodeURIComponent(params.key))
      if (!department) {
        return NextResponse.json({ error: 'Department not found' }, { status: 404 })
      }
      return NextResponse.json({ data: department })
    } catch (error) {
      console.error('Get department error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { key: string } }
) {
  return withAuth(request, async (user) => {
    try {
      const canManage = await hasPermission(user, 'employees.manage')
      if (!canManage) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      const key = decodeURIComponent(params.key)
      const body = await request.json()
      const validated = patchSchema.parse(body)
      const department = await updateDepartment(key, validated)
      return NextResponse.json({ data: department })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
      }
      console.error('Update department error:', error)
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Internal server error' },
        { status: 500 }
      )
    }
  })
}
