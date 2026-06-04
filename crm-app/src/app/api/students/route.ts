import { NextRequest, NextResponse } from 'next/server'
import { withAuth, type AuthenticatedUser } from '@/lib/auth/middleware'
import { hasPermission, hasAnyPermission } from '@/lib/auth/authorization'
import { getStudents, createStudent } from '@/lib/db/queries/students'
import { z } from 'zod'

const createStudentSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  phone: z.string().min(10, 'Phone must be at least 10 digits'),
  alternatePhone: z.string().optional(),
  qualification: z.string().optional(),
  occupation: z.string().optional(),
  company: z.string().optional(),
  experience: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
  source: z.string().default('organic'),
  notes: z.string().optional(),
  leadId: z.string().uuid().optional(),
})

async function canViewAllStudents(user: AuthenticatedUser): Promise<boolean> {
  return hasPermission(user, 'students.view_all')
}

async function canViewAssignedStudents(user: AuthenticatedUser): Promise<boolean> {
  return hasPermission(user, 'students.view_assigned')
}

async function canCreateStudent(user: AuthenticatedUser): Promise<boolean> {
  return hasPermission(user, 'students.create')
}

export async function GET(request: NextRequest) {
  return withAuth(request, async (user) => {
    const canViewAll = await canViewAllStudents(user)
    const canViewAssigned = await canViewAssignedStudents(user)

    if (!canViewAll && !canViewAssigned) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    try {
      const { searchParams } = new URL(request.url)
      const filters = {
        search: searchParams.get('search') || undefined,
        status: searchParams.get('status') || undefined,
        course: searchParams.get('course') || undefined,
      }

      const result = await getStudents(filters)
      
      if (!canViewAll && canViewAssigned) {
        result.data = result.data.filter(s => s.convertedBy === user.userId)
        result.total = result.data.length
      }

      return NextResponse.json({ data: result.data, pagination: { total: result.total } })
    } catch (error) {
      console.error('GET /api/students error:', error)
      return NextResponse.json({ error: 'Internal error' }, { status: 500 })
    }
  })
}

export async function POST(request: NextRequest) {
  return withAuth(request, async (user) => {
    if (!(await canCreateStudent(user))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    try {
      const body = await request.json()
      const validated = createStudentSchema.parse(body)
      const data = await createStudent(validated, user.userId)
      return NextResponse.json({ data }, { status: 201 })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
      }
      console.error('POST /api/students error:', error)
      return NextResponse.json({ error: 'Internal error' }, { status: 500 })
    }
  })
}