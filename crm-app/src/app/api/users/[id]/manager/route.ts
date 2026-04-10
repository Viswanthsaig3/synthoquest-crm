import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/middleware'
import { hasPermission } from '@/lib/auth/authorization'
import { updateUserManager } from '@/lib/db/queries/users'
import { z } from 'zod'

const schema = z.object({
  managerId: z.string().uuid().nullable(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(request, async (user) => {
    try {
      const canManage = 
        (await hasPermission(user, 'employees.manage')) ||
        (await hasPermission(user, 'employees.manage_assigned'))

      if (!canManage) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      const { id } = await params
      const body = await request.json()
      const validated = schema.parse(body)

      const updated = await updateUserManager(id, validated.managerId)

      return NextResponse.json({ data: updated })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Validation error', details: error.errors },
          { status: 400 }
        )
      }
      
      if (error instanceof Error) {
        if (error.message.includes('cycle')) {
          return NextResponse.json({ error: error.message }, { status: 400 })
        }
        if (error.message.includes('own manager')) {
          return NextResponse.json({ error: error.message }, { status: 400 })
        }
      }
      
      console.error('Update manager error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  })
}