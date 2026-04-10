import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/middleware'
import { hasPermission } from '@/lib/auth/authorization'
import { deleteIntern, getInternById, updateIntern } from '@/lib/db/queries/interns'
import { getUserById, updateUserCompensation } from '@/lib/db/queries/users'
import { z } from 'zod'

const updateInternSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().optional(),
  department: z.string().min(1).optional(),
  managedBy: z.string().uuid().nullable().optional(),
  compensationType: z.enum(['paid', 'unpaid']).optional(),
  compensationAmount: z.number().min(0).nullable().optional(),
  compensationReason: z.string().max(500).optional(),
  profile: z
    .object({
      alternatePhone: z.string().optional(),
      internshipType: z.enum(['paid', 'unpaid']).optional(),
      duration: z.enum(['1_month', '2_months', '3_months']).optional(),
      college: z.string().min(1).optional(),
      degree: z.string().min(1).optional(),
      year: z.string().min(1).optional(),
      skills: z.array(z.string()).optional(),
      resumeUrl: z.string().url().optional().or(z.literal('')),
      linkedinUrl: z.string().url().optional().or(z.literal('')),
      portfolioUrl: z.string().url().optional().or(z.literal('')),
      startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal('')),
      expectedEndDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal('')),
      actualEndDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal('')),
      status: z
        .enum(['applied', 'shortlisted', 'offered', 'active', 'completed', 'dropped', 'rejected'])
        .optional(),
      source: z.string().optional(),
      supervisorId: z.string().uuid().optional().or(z.literal('')),
      performanceRating: z.number().min(1).max(5).optional(),
      feedback: z.string().optional(),
      stipend: z.number().min(0).optional(),
      notes: z.string().optional(),
      approvalStatus: z.enum(['pending', 'approved', 'rejected']).optional(),
      approvedBy: z.string().uuid().optional().or(z.literal('')),
      approvedAt: z.string().datetime().optional().or(z.literal('')),
      rejectionReason: z.string().optional(),
    })
    .optional(),
})

function normalizeOptional(value?: string): string | undefined {
  if (value === undefined || value === '') return undefined
  return value
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  return withAuth(request, async (user) => {
    try {
      const target = await getUserById(params.id)
      if (!target || target.role !== 'intern') {
        return NextResponse.json({ error: 'Intern not found' }, { status: 404 })
      }

      const canViewAll =
        (await hasPermission(user, 'interns.view_all')) ||
        (await hasPermission(user, 'interns.manage_all')) ||
        (await hasPermission(user, 'employees.manage'))

      const canViewAssigned =
        (await hasPermission(user, 'interns.view_assigned')) ||
        (await hasPermission(user, 'interns.manage_assigned')) ||
        (await hasPermission(user, 'employees.manage_assigned'))

      const isSelf = target.id === user.userId
      const isAssigned = target.managedBy === user.userId

      if (!isSelf && !canViewAll && !(canViewAssigned && isAssigned)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      const intern = await getInternById(params.id)
      if (!intern) {
        return NextResponse.json({ error: 'Intern not found' }, { status: 404 })
      }

      return NextResponse.json({ data: intern })
    } catch (error) {
      console.error('Get intern detail error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  })
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  return withAuth(request, async (user) => {
    try {
      const target = await getUserById(params.id)
      if (!target || target.role !== 'intern') {
        return NextResponse.json({ error: 'Intern not found' }, { status: 404 })
      }

      const canManageAll =
        (await hasPermission(user, 'interns.manage_all')) ||
        (await hasPermission(user, 'employees.manage'))
      const canManageAssigned =
        (await hasPermission(user, 'interns.manage_assigned')) ||
        (await hasPermission(user, 'employees.manage_assigned'))

      if (!canManageAll && !(canManageAssigned && target.managedBy === user.userId)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      const body = await request.json()
      const validated = updateInternSchema.parse(body)

      const requestedCompUpdate =
        validated.compensationType !== undefined || validated.compensationAmount !== undefined

      if (requestedCompUpdate) {
        const canManageCompensation = await hasPermission(user, 'compensation.manage')
        if (!canManageCompensation) {
          return NextResponse.json({ error: 'Forbidden: compensation update not allowed' }, { status: 403 })
        }

        if (!validated.compensationType) {
          return NextResponse.json(
            { error: 'compensationType is required when updating compensation' },
            { status: 400 }
          )
        }

        await updateUserCompensation({
          userId: params.id,
          compensationType: validated.compensationType,
          compensationAmount: validated.compensationAmount,
          reason: validated.compensationReason,
          changedBy: user.userId,
        })
      }

      if (!canManageAll && (validated.department !== undefined || validated.managedBy !== undefined)) {
        return NextResponse.json(
          { error: 'Only admin/HR can change department or manager assignment' },
          { status: 403 }
        )
      }

      const updated = await updateIntern(params.id, {
        name: validated.name,
        phone: validated.phone,
        department: validated.department,
        managedBy: validated.managedBy,
        profile: validated.profile
          ? {
              ...validated.profile,
              resumeUrl: normalizeOptional(validated.profile.resumeUrl),
              linkedinUrl: normalizeOptional(validated.profile.linkedinUrl),
              portfolioUrl: normalizeOptional(validated.profile.portfolioUrl),
              startDate: normalizeOptional(validated.profile.startDate),
              expectedEndDate: normalizeOptional(validated.profile.expectedEndDate),
              actualEndDate: normalizeOptional(validated.profile.actualEndDate),
              supervisorId: normalizeOptional(validated.profile.supervisorId),
              approvedBy: normalizeOptional(validated.profile.approvedBy),
              approvedAt: normalizeOptional(validated.profile.approvedAt),
            }
          : undefined,
      })

      return NextResponse.json({ data: updated })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Validation error', details: error.errors },
          { status: 400 }
        )
      }

      console.error('Update intern error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  })
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  return withAuth(request, async (user) => {
    try {
      const canManageAll =
        (await hasPermission(user, 'interns.manage_all')) ||
        (await hasPermission(user, 'employees.manage'))

      if (!canManageAll) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      const target = await getUserById(params.id)
      if (!target || target.role !== 'intern') {
        return NextResponse.json({ error: 'Intern not found' }, { status: 404 })
      }

      await deleteIntern(params.id)
      return NextResponse.json({ message: 'Intern archived successfully' })
    } catch (error) {
      console.error('Delete intern error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  })
}
