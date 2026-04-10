import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/middleware'
import { getTimeEntryById, updateTimeEntry, deleteTimeEntry } from '@/lib/db/queries/time-entries'
import { z } from 'zod'

const updateSchema = z.object({
  startTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  endTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  description: z.string().min(10).optional()
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async (user) => {
    try {
      const entry = await getTimeEntryById(params.id)

      if (!entry) {
        return NextResponse.json({ error: 'Time entry not found' }, { status: 404 })
      }

      return NextResponse.json({ data: entry })
    } catch (error) {
      console.error('Get time entry error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  })
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async (user) => {
    try {
      const body = await request.json()
      const validated = updateSchema.parse(body)

      const updates: Partial<{ startTime: string; endTime: string; description: string }> = {}
      if (validated.startTime) updates.startTime = validated.startTime + ':00'
      if (validated.endTime) updates.endTime = validated.endTime + ':00'
      if (validated.description) updates.description = validated.description

      const updated = await updateTimeEntry(params.id, user.userId, updates)

      return NextResponse.json({ data: updated })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Validation error', details: error.errors },
          { status: 400 }
        )
      }
      console.error('Update time entry error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async (user) => {
    try {
      await deleteTimeEntry(params.id, user.userId)
      return NextResponse.json({ message: 'Time entry deleted' })
    } catch (error) {
      console.error('Delete time entry error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  })
}