import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/middleware'
import { getBugById, updateBugStatus, deleteBug } from '@/lib/db/queries/bugs'
import { hasPermission } from '@/lib/auth/authorization'
import { z } from 'zod'

const updateSchema = z.object({
  status: z.enum(['open', 'in_progress', 'closed']).optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(request, async (user) => {
    try {
      if (!(await hasPermission(user, 'bugs.view_all'))) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      const { id } = await params
      const bug = await getBugById(id)

      if (!bug) {
        return NextResponse.json({ error: 'Bug not found' }, { status: 404 })
      }

      return NextResponse.json({ data: bug })
    } catch (error) {
      console.error('Get bug error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  })
}

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
      const validated = updateSchema.parse(body)

      if (validated.status) {
        const updated = await updateBugStatus(id, validated.status, user.userId, user.email)
        return NextResponse.json({ data: updated })
      }

      return NextResponse.json({ data: bug })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Validation error', details: error.errors },
          { status: 400 }
        )
      }
      console.error('Update bug error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  })
}

export async function DELETE(
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

      await deleteBug(id)
      return NextResponse.json({ success: true })
    } catch (error) {
      console.error('Delete bug error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  })
}