import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/middleware'
import { getBugById, assignBug } from '@/lib/db/queries/bugs'
import { hasPermission } from '@/lib/auth/authorization'
import { z } from 'zod'
import { getUserById } from '@/lib/db/queries/users'

const assignSchema = z.object({
  assignedTo: z.string().uuid(),
})

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(request, async (user) => {
    try {
      if (!(await hasPermission(user, 'bugs.manage'))) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      const { id } = await params
      const bug = await getBugById(id)

      if (!bug) {
        return NextResponse.json({ error: 'Bug not found' }, { status: 404 })
      }

      const body = await request.json()
      const validated = assignSchema.parse(body)

      // Get assignee info
      const assignee = await getUserById(validated.assignedTo)
      if (!assignee) {
        return NextResponse.json({ error: 'Assignee not found' }, { status: 404 })
      }

      const updated = await assignBug(
        id,
        validated.assignedTo,
        assignee.name || assignee.email,
        user.userId,
        user.email
      )

      return NextResponse.json({ data: updated })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Validation error', details: error.errors },
          { status: 400 }
        )
      }
      console.error('Assign bug error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  })
}