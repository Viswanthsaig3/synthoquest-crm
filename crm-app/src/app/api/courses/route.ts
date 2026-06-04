import { NextRequest, NextResponse } from 'next/server'
import { withAuth, type AuthenticatedUser } from '@/lib/auth/middleware'
import { hasPermission } from '@/lib/auth/authorization'
import { getCourses, createCourse } from '@/lib/db/queries/courses'
import { z } from 'zod'

const createCourseSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  code: z.string().min(1, 'Code is required').max(50),
  description: z.string().max(1000).optional(),
  durationWeeks: z.coerce.number().min(1).max(52).default(12),
  defaultFee: z.coerce.number().min(0).default(0),
  category: z.enum(['cyber_security', 'ai_ml', 'certification', 'cloud', 'network', 'other']).default('cyber_security'),
  syllabus: z.array(z.string()).optional(),
  prerequisites: z.array(z.string()).optional(),
})

async function canViewCourses(user: AuthenticatedUser): Promise<boolean> {
  return hasPermission(user, 'courses.view') ||
         hasPermission(user, 'courses.create') ||
         hasPermission(user, 'courses.edit')
}

async function canCreateCourse(user: AuthenticatedUser): Promise<boolean> {
  return hasPermission(user, 'courses.create')
}

export async function GET(request: NextRequest) {
  return withAuth(request, async (user) => {
    if (!(await canViewCourses(user))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    try {
      const { searchParams } = new URL(request.url)
      const filters = {
        status: searchParams.get('status') || undefined,
        category: searchParams.get('category') || undefined,
      }
      const data = await getCourses(filters)
      return NextResponse.json({ data })
    } catch (error) {
      console.error('GET /api/courses error:', error)
      return NextResponse.json({ error: 'Internal error' }, { status: 500 })
    }
  })
}

export async function POST(request: NextRequest) {
  return withAuth(request, async (user) => {
    if (!(await canCreateCourse(user))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    try {
      const body = await request.json()
      const validated = createCourseSchema.parse(body)
      const data = await createCourse(validated, user.userId)
      return NextResponse.json({ data }, { status: 201 })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
      }
      console.error('POST /api/courses error:', error)
      return NextResponse.json({ error: 'Internal error' }, { status: 500 })
    }
  })
}