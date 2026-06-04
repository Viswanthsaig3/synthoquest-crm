import { NextRequest, NextResponse } from 'next/server'
import { withAuth, type AuthenticatedUser } from '@/lib/auth/middleware'
import { hasPermission } from '@/lib/auth/authorization'
import { getCourseById, updateCourse, deleteCourse } from '@/lib/db/queries/courses'
import { z } from 'zod'

const updateCourseSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  code: z.string().min(1).max(50).optional(),
  description: z.string().max(1000).optional(),
  durationWeeks: z.coerce.number().min(1).max(52).optional(),
  defaultFee: z.coerce.number().min(0).optional(),
  category: z.enum(['cyber_security', 'ai_ml', 'certification', 'cloud', 'network', 'other']).optional(),
  syllabus: z.array(z.string()).optional(),
  prerequisites: z.array(z.string()).optional(),
  status: z.enum(['active', 'inactive', 'archived']).optional(),
})

async function canViewCourses(user: AuthenticatedUser): Promise<boolean> {
  return hasPermission(user, 'courses.view') ||
         hasPermission(user, 'courses.create') ||
         hasPermission(user, 'courses.edit')
}

async function canEditCourse(user: AuthenticatedUser): Promise<boolean> {
  return hasPermission(user, 'courses.edit')
}

async function canDeleteCourse(user: AuthenticatedUser): Promise<boolean> {
  return hasPermission(user, 'courses.delete')
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(request, async (user) => {
    if (!(await canViewCourses(user))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    try {
      const { id } = await params
      const data = await getCourseById(id)
      if (!data) {
        return NextResponse.json({ error: 'Course not found' }, { status: 404 })
      }
      return NextResponse.json({ data })
    } catch (error) {
      console.error('GET /api/courses/[id] error:', error)
      return NextResponse.json({ error: 'Internal error' }, { status: 500 })
    }
  })
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(request, async (user) => {
    if (!(await canEditCourse(user))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    try {
      const { id } = await params
      const body = await request.json()
      const validated = updateCourseSchema.parse(body)
      const data = await updateCourse(id, validated)
      return NextResponse.json({ data })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
      }
      if (error instanceof Error && error.message === 'Course not found') {
        return NextResponse.json({ error: 'Course not found' }, { status: 404 })
      }
      console.error('PUT /api/courses/[id] error:', error)
      return NextResponse.json({ error: 'Internal error' }, { status: 500 })
    }
  })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(request, async (user) => {
    if (!(await canDeleteCourse(user))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    try {
      const { id } = await params
      await deleteCourse(id)
      return NextResponse.json({ message: 'Course deleted' })
    } catch (error) {
      console.error('DELETE /api/courses/[id] error:', error)
      return NextResponse.json({ error: 'Internal error' }, { status: 500 })
    }
  })
}