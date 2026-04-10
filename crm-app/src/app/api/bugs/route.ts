import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/middleware'
import { getBugs, createBug } from '@/lib/db/queries/bugs'
import { hasPermission } from '@/lib/auth/authorization'
import { z } from 'zod'

const createSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().min(1),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  pageUrl: z.string().min(1),
  errorContext: z.string().optional(),
  userAgent: z.string().optional(),
  screenshotUrl: z.string().optional(),
  screenshotFilename: z.string().optional(),
  screenshotSize: z.number().optional(),
})

export async function GET(request: NextRequest) {
  return withAuth(request, async (user) => {
    try {
      // Only developers and admins can view bugs
      if (!(await hasPermission(user, 'bugs.view_all'))) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      const { searchParams } = new URL(request.url)

      const filters = {
        status: searchParams.get('status') as 'open' | 'in_progress' | 'closed' | undefined,
        severity: searchParams.get('severity') as 'low' | 'medium' | 'high' | 'critical' | undefined,
        assignedTo: searchParams.get('assignedTo') || undefined,
        search: searchParams.get('search') || undefined,
        page: parseInt(searchParams.get('page') || '1', 10),
        limit: parseInt(searchParams.get('limit') || '20', 10),
      }

      const result = await getBugs(filters)
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
      console.error('Get bugs error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  })
}

export async function POST(request: NextRequest) {
  return withAuth(request, async (user) => {
    try {
      // All authenticated users can report bugs
      if (!(await hasPermission(user, 'bugs.create'))) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      const body = await request.json()
      const validated = createSchema.parse(body)

      const bug = await createBug({
        ...validated,
        reportedBy: user.userId,
        reporterName: user.email,
        reporterEmail: user.email,
        reporterRole: user.role,
      })

      return NextResponse.json({ data: bug }, { status: 201 })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Validation error', details: error.errors },
          { status: 400 }
        )
      }
      console.error('Create bug error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  })
}