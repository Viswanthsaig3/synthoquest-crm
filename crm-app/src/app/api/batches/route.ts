import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/middleware'
import { hasAnyPermission } from '@/lib/auth/authorization'
import { listBatchesForCourse } from '@/lib/db/queries/batches'

export async function GET(request: NextRequest) {
  return withAuth(request, async (user) => {
    try {
      if (
        !(await hasAnyPermission(user, [
          'batches.view',
          'leads.edit',
          'leads.view_all',
          'leads.view_assigned',
        ]))
      ) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      const courseName = request.nextUrl.searchParams.get('courseName') || ''
      if (!courseName.trim()) {
        return NextResponse.json(
          { error: 'courseName query parameter is required' },
          { status: 400 }
        )
      }

      const rows = await listBatchesForCourse(courseName.trim())
      const data = rows.map((b) => ({
        id: b.id,
        name: b.name,
        courseName: b.course_name,
        instructorName: b.instructor_name || '',
        mode: b.mode,
        status: b.status,
        startDate: b.start_date,
        endDate: b.end_date,
        maxCapacity: b.max_capacity,
        enrolledCount: b.enrolled_count,
        availableSeats: Math.max(0, b.max_capacity - b.enrolled_count),
        fee: Number(b.fee),
        discount: Number(b.discount),
        description: b.description || '',
      }))

      return NextResponse.json({ data })
    } catch (error) {
      console.error('GET /api/batches error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  })
}
