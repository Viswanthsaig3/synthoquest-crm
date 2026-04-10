import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/middleware'
import { getLeadById, updateLead, deleteLead } from '@/lib/db/queries/leads'
import { hasPermission } from '@/lib/auth/authorization'
import { z } from 'zod'

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().min(1).optional(),
  alternatePhone: z.string().optional(),
  typeId: z.string().uuid().optional(),
  customFields: z.record(z.string(), z.unknown()).optional(),
  courseInterested: z.string().optional(),
  source: z.enum(['ads', 'referral', 'organic']).optional(),
  status: z.enum(['new', 'contacted', 'follow_up', 'qualified', 'converted', 'lost']).optional(),
  priority: z.enum(['hot', 'warm', 'cold']).optional(),
  assignedTo: z.string().uuid().optional().nullable(),
  notes: z.string().optional(),
  nextFollowUpAt: z.string().optional(),
  lossReason: z.string().optional(),
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

      return NextResponse.json({ data: lead })
    } catch (error) {
      console.error('Get lead error:', error)
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
      const lead = await getLeadById(params.id)

      if (!lead) {
        return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
      }

      const canEditAll = await hasPermission(user, 'leads.edit')
      
      if (!canEditAll && lead.assignedTo !== user.userId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      const body = await request.json()
      const validated = updateSchema.parse(body)

      const updated = await updateLead(params.id, {
        ...validated,
        assignedTo: validated.assignedTo === null ? undefined : validated.assignedTo
      })

      return NextResponse.json({ data: updated })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
      }
      console.error('Update lead error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async (user) => {
    try {
      const lead = await getLeadById(params.id)

      if (!lead) {
        return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
      }

      if (!(await hasPermission(user, 'leads.delete'))) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      await deleteLead(params.id)

      return NextResponse.json({ success: true })
    } catch (error) {
      console.error('Delete lead error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  })
}