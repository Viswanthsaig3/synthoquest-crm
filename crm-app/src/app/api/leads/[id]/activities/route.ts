import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/middleware'
import { getLeadById, getActivities, createActivity } from '@/lib/db/queries/leads'
import { hasPermission } from '@/lib/auth/authorization'
import { z } from 'zod'

const createSchema = z.object({
  type: z.string(),
  description: z.string().min(1),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async (user) => {
    try {
      const lead = await getLeadById(params.id)

      if (!lead) {
        return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
      }

      const canViewAll = await hasPermission(user, 'leads.view_all')
      
      if (!canViewAll && lead.assignedTo !== user.userId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      const activities = await getActivities(params.id)

      return NextResponse.json({ data: activities })
    } catch (error) {
      console.error('Get activities error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  })
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async (user) => {
    try {
      const lead = await getLeadById(params.id)

      if (!lead) {
        return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
      }

      const canEditAll = await hasPermission(user, 'leads.edit')
      
      if (!canEditAll && lead.assignedTo !== user.userId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      const body = await request.json()
      const validated = createSchema.parse(body)

      const activity = await createActivity(
        params.id,
        user.userId,
        validated.type,
        validated.description,
        validated.metadata
      )

      return NextResponse.json({ data: activity }, { status: 201 })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
      }
      console.error('Create activity error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  })
}