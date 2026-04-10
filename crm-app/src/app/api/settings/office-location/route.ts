import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withAuth } from '@/lib/auth/middleware'
import { hasPermission } from '@/lib/auth/authorization'
import {
  getOfficeLocationSettings,
  updateOfficeLocationSettings,
} from '@/lib/db/queries/attendance'

const officeLocationSchema = z.object({
  officeLat: z.number().min(-90).max(90).nullable(),
  officeLng: z.number().min(-180).max(180).nullable(),
  allowedRadiusMeters: z.number().int().min(50).max(10000),
  requireGeolocation: z.boolean().default(false),
})

export async function GET(request: NextRequest) {
  return withAuth(request, async (user) => {
    try {
      const canView =
        (await hasPermission(user, 'attendance.manage_office_location')) ||
        (await hasPermission(user, 'attendance.view_warnings'))

      if (!canView) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      const data = await getOfficeLocationSettings()
      return NextResponse.json({ data })
    } catch (error) {
      console.error('Get office location error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  })
}

export async function PATCH(request: NextRequest) {
  return withAuth(request, async (user) => {
    try {
      const canManage = await hasPermission(user, 'attendance.manage_office_location')
      if (!canManage) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      const body = await request.json()
      const validated = officeLocationSchema.parse(body)
      if ((validated.officeLat === null) !== (validated.officeLng === null)) {
        return NextResponse.json(
          { error: 'officeLat and officeLng must both be set or both be null.' },
          { status: 400 }
        )
      }

      const data = await updateOfficeLocationSettings({
        officeLat: validated.officeLat,
        officeLng: validated.officeLng,
        allowedRadiusMeters: validated.allowedRadiusMeters,
        requireGeolocation: validated.requireGeolocation,
        updatedBy: user.userId,
      })
      return NextResponse.json({ data })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Validation error', details: error.errors },
          { status: 400 }
        )
      }
      console.error('Update office location error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  })
}
