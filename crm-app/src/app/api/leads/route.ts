import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/middleware'
import { getLeads, createLead } from '@/lib/db/queries/leads'
import {
  canAccessLeadsList,
  canListLeadsOrgWide,
  hasPermission,
} from '@/lib/auth/authorization'
import { z } from 'zod'
import { parseOptionalLeadPriority, parseOptionalLeadStatus } from '@/lib/query-params'

const createSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(1),
  alternatePhone: z.string().optional(),
  typeId: z.string().uuid().optional(),
  customFields: z.record(z.string(), z.unknown()).optional(),
  courseInterested: z.string().optional(),
  source: z.enum(['ads', 'referral', 'organic']).optional(),
  priority: z.enum(['hot', 'warm', 'cold']).optional(),
  notes: z.string().optional(),
  assignedTo: z.string().uuid().optional(),
})

export async function GET(request: NextRequest) {
  return withAuth(request, async (user) => {
    try {
      if (!(await canAccessLeadsList(user))) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      const { searchParams } = new URL(request.url)
      const canViewAllUnscoped = await canListLeadsOrgWide(user)

      const filters: Parameters<typeof getLeads>[0] = {
        assignedTo: canViewAllUnscoped ? searchParams.get('assignedTo') || undefined : user.userId,
        status: parseOptionalLeadStatus(searchParams.get('status')),
        priority: parseOptionalLeadPriority(searchParams.get('priority')),
        typeId: searchParams.get('typeId') || undefined,
        search: searchParams.get('search') || undefined,
        page: parseInt(searchParams.get('page') || '1', 10),
        limit: parseInt(searchParams.get('limit') || '20', 10),
      }

      const result = await getLeads(filters)
      const limit = filters.limit ?? 20

      return NextResponse.json({
        data: result.data,
        pagination: {
          page: filters.page,
          limit,
          total: result.total,
          totalPages: Math.ceil(result.total / limit),
        },
      })
    } catch (error) {
      console.error('Get leads error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  })
}

export async function POST(request: NextRequest) {
  return withAuth(request, async (user) => {
    try {
      if (!(await hasPermission(user, 'leads.create'))) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      const body = await request.json()
      const validated = createSchema.parse(body)

      const lead = await createLead(validated)

      return NextResponse.json({ data: lead }, { status: 201 })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
      }
      console.error('Create lead error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  })
}