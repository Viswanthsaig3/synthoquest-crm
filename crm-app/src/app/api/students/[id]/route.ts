import { NextRequest, NextResponse } from 'next/server'
import { withAuth, type AuthenticatedUser } from '@/lib/auth/middleware'
import { hasPermission } from '@/lib/auth/authorization'
import { getStudentById, updateStudent, deleteStudent, getStudentEnrollments } from '@/lib/db/queries/students'
import { z } from 'zod'

const updateStudentSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().min(10).optional(),
  alternatePhone: z.string().optional(),
  qualification: z.string().optional(),
  occupation: z.string().optional(),
  company: z.string().optional(),
  experience: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
  notes: z.string().optional(),
})

async function canViewAllStudents(user: AuthenticatedUser): Promise<boolean> {
  return hasPermission(user, 'students.view_all')
}

async function canViewAssignedStudents(user: AuthenticatedUser): Promise<boolean> {
  return hasPermission(user, 'students.view_assigned')
}

async function canEditStudent(user: AuthenticatedUser): Promise<boolean> {
  return hasPermission(user, 'students.edit')
}

async function canDeleteStudent(user: AuthenticatedUser): Promise<boolean> {
  return hasPermission(user, 'students.delete')
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(request, async (user) => {
    const canViewAll = await canViewAllStudents(user)
    const canViewAssigned = await canViewAssignedStudents(user)

    if (!canViewAll && !canViewAssigned) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    try {
      const { id } = await params
      const student = await getStudentById(id)
      
      if (!student) {
        return NextResponse.json({ error: 'Student not found' }, { status: 404 })
      }

      if (!canViewAll && student.convertedBy !== user.userId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      const enrollments = await getStudentEnrollments(id)
      
      return NextResponse.json({ data: { ...student, enrollments } })
    } catch (error) {
      console.error('GET /api/students/[id] error:', error)
      return NextResponse.json({ error: 'Internal error' }, { status: 500 })
    }
  })
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(request, async (user) => {
    if (!(await canEditStudent(user))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    try {
      const { id } = await params
      const body = await request.json()
      const validated = updateStudentSchema.parse(body)
      const data = await updateStudent(id, validated)
      return NextResponse.json({ data })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
      }
      console.error('PUT /api/students/[id] error:', error)
      return NextResponse.json({ error: 'Internal error' }, { status: 500 })
    }
  })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(request, async (user) => {
    if (!(await canDeleteStudent(user))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    try {
      const { id } = await params
      await deleteStudent(id)
      return NextResponse.json({ message: 'Student deleted' })
    } catch (error) {
      console.error('DELETE /api/students/[id] error:', error)
      return NextResponse.json({ error: 'Internal error' }, { status: 500 })
    }
  })
}