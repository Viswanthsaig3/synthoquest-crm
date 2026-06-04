import { NextRequest, NextResponse } from 'next/server'
import { withAuth, type AuthenticatedUser } from '@/lib/auth/middleware'
import { hasPermission } from '@/lib/auth/authorization'
import { getStudentEnrollments, createEnrollment } from '@/lib/db/queries/students'
import { z } from 'zod'

const createEnrollmentSchema = z.object({
  courseId: z.string().uuid('Invalid course ID'),
  batchId: z.string().uuid().optional(),
  enrollmentFee: z.coerce.number().min(0).default(0),
  courseFee: z.coerce.number().min(0),
  discount: z.coerce.number().min(0).default(0),
  totalFee: z.coerce.number().min(0),
  paymentPlan: z.enum(['full', 'installment']).default('full'),
  startDate: z.string().optional(),
  expectedEndDate: z.string().optional(),
  instructorId: z.string().uuid().optional(),
  notes: z.string().optional(),
})

async function canEnrollStudent(user: AuthenticatedUser): Promise<boolean> {
  return hasPermission(user, 'students.enroll')
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(request, async () => {
    try {
      const { id } = await params
      const data = await getStudentEnrollments(id)
      return NextResponse.json({ data })
    } catch (error) {
      console.error('GET /api/students/[id]/enrollments error:', error)
      return NextResponse.json({ error: 'Internal error' }, { status: 500 })
    }
  })
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(request, async (user) => {
    if (!(await canEnrollStudent(user))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    try {
      const { id } = await params
      const body = await request.json()
      const validated = createEnrollmentSchema.parse(body)
      const data = await createEnrollment({
        studentId: id,
        courseId: validated.courseId,
        batchId: validated.batchId,
        enrollmentFee: validated.enrollmentFee,
        courseFee: validated.courseFee,
        discount: validated.discount,
        totalFee: validated.totalFee,
        paymentPlan: validated.paymentPlan,
        startDate: validated.startDate,
        expectedEndDate: validated.expectedEndDate,
        instructorId: validated.instructorId,
        notes: validated.notes,
      })
      return NextResponse.json({ data }, { status: 201 })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
      }
      console.error('POST /api/students/[id]/enrollments error:', error)
      return NextResponse.json({ error: 'Internal error' }, { status: 500 })
    }
  })
}