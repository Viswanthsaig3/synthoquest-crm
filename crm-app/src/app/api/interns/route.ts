import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/middleware'
import { hasPermission } from '@/lib/auth/authorization'
import { createIntern, getInterns } from '@/lib/db/queries/interns'
import { hashPassword } from '@/lib/auth/password'
import { z } from 'zod'

const createInternSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
  phone: z.string().optional(),
  department: z.string().min(1),
  managedBy: z.string().uuid().optional().nullable(),
  compensationType: z.enum(['paid', 'unpaid']).optional(),
  compensationAmount: z.number().min(0).optional().nullable(),
  profile: z.object({
    alternatePhone: z.string().optional(),
    internshipType: z.enum(['paid', 'unpaid']),
    duration: z.enum(['1_month', '2_months', '3_months']),
    college: z.string().min(1),
    degree: z.string().min(1),
    year: z.string().min(1),
    skills: z.array(z.string()).optional(),
    resumeUrl: z.string().url().optional(),
    linkedinUrl: z.string().url().optional(),
    portfolioUrl: z.string().url().optional(),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    expectedEndDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    actualEndDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    status: z
      .enum(['applied', 'shortlisted', 'offered', 'active', 'completed', 'dropped', 'rejected'])
      .optional(),
    source: z.string().optional(),
    leadId: z.string().uuid().optional(),
    convertedFrom: z.string().optional(),
    convertedAt: z.string().datetime().optional(),
    convertedBy: z.string().uuid().optional(),
    supervisorId: z.string().uuid().optional(),
    performanceRating: z.number().min(1).max(5).optional(),
    feedback: z.string().optional(),
    stipend: z.number().min(0).optional(),
    notes: z.string().optional(),
    approvalStatus: z.enum(['pending', 'approved', 'rejected']).optional(),
    approvedBy: z.string().uuid().optional(),
    approvedAt: z.string().datetime().optional(),
    rejectionReason: z.string().optional(),
  }),
})

export async function GET(request: NextRequest) {
  return withAuth(request, async (user) => {
    try {
      const canViewAll =
        (await hasPermission(user, 'interns.view_all')) ||
        (await hasPermission(user, 'interns.manage_all')) ||
        (await hasPermission(user, 'employees.manage'))

      const canViewAssigned =
        (await hasPermission(user, 'interns.view_assigned')) ||
        (await hasPermission(user, 'interns.manage_assigned')) ||
        (await hasPermission(user, 'employees.manage_assigned'))

      if (!canViewAll && !canViewAssigned) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      const searchParams = request.nextUrl.searchParams
      const page = parseInt(searchParams.get('page') || '1')
      const limit = parseInt(searchParams.get('limit') || '20')

      const result = await getInterns({
        search: searchParams.get('search') || undefined,
        department: searchParams.get('department') || undefined,
        status:
          (searchParams.get('status') as
            | 'applied'
            | 'shortlisted'
            | 'offered'
            | 'active'
            | 'completed'
            | 'dropped'
            | 'rejected'
            | null) || undefined,
        internshipType:
          (searchParams.get('internshipType') as 'paid' | 'unpaid' | null) || undefined,
        managedBy: canViewAll ? searchParams.get('managedBy') || undefined : user.userId,
        page,
        limit,
      })

      return NextResponse.json({
        data: result.data,
        pagination: {
          page,
          limit,
          total: result.total,
          totalPages: Math.ceil(result.total / limit),
        },
      })
    } catch (error) {
      console.error('Get interns error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  })
}

export async function POST(request: NextRequest) {
  return withAuth(request, async (user) => {
    try {
      const canManageAll =
        (await hasPermission(user, 'interns.manage_all')) ||
        (await hasPermission(user, 'employees.manage'))

      if (!canManageAll) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      const body = await request.json()
      const validated = createInternSchema.parse(body)

      const passwordHash = await hashPassword(validated.password)

      const intern = await createIntern({
        email: validated.email,
        passwordHash,
        name: validated.name,
        phone: validated.phone,
        department: validated.department,
        managedBy: validated.managedBy,
        compensationType: validated.compensationType,
        compensationAmount: validated.compensationAmount,
        profile: validated.profile,
      })

      return NextResponse.json({ data: intern }, { status: 201 })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Validation error', details: error.errors },
          { status: 400 }
        )
      }

      console.error('Create intern error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  })
}
