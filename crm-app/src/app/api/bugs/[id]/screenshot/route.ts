import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/middleware'
import { getBugById, deleteBugScreenshot } from '@/lib/db/queries/bugs'
import { hasPermission } from '@/lib/auth/authorization'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(request, async (user) => {
    try {
      if (!(await hasPermission(user, 'bugs.delete_screenshot'))) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      const { id } = await params
      const bug = await getBugById(id)

      if (!bug) {
        return NextResponse.json({ error: 'Bug not found' }, { status: 404 })
      }

      if (!bug.screenshotUrl) {
        return NextResponse.json({ error: 'No screenshot to delete' }, { status: 400 })
      }

      const updated = await deleteBugScreenshot(id, user.userId, user.email)
      return NextResponse.json({ data: updated })
    } catch (error) {
      console.error('Delete screenshot error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  })
}