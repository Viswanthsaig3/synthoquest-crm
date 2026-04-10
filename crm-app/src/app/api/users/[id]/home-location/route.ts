import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withAuth } from '@/lib/auth/middleware'
import type { AuthenticatedUser } from '@/lib/auth/middleware'
import { hasPermission } from '@/lib/auth/authorization'
import {
  getUserHomeLocation,
  upsertUserHomeLocation,
} from '@/lib/db/queries/attendance'

const homeLocationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  radiusMeters: z.number().int().min(50).max(10000).default(300),
  label: z.string().max(120).optional(),
})

async function canAccessTargetUser(authUser: AuthenticatedUser, targetUserId: string) {
  const isSelf = authUser.userId === targetUserId
  const canManageAll = await hasPermission(authUser, 'attendance.manage_home_location_all')
  const canManageSelf = await hasPermission(authUser, 'attendance.manage_home_location_self')
  return isSelf ? canManageSelf || canManageAll : canManageAll
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async (user) => {
    try {
      const allowed = await canAccessTargetUser(user, params.id)
      if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

      const data = await getUserHomeLocation(params.id)
      return NextResponse.json({ data })
    } catch (error) {
      console.error('Get home location error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async (user) => {
    try {
      const allowed = await canAccessTargetUser(user, params.id)
      if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

      const body = await request.json()
      const validated = homeLocationSchema.parse(body)

      const data = await upsertUserHomeLocation({
        userId: params.id,
        latitude: validated.latitude,
        longitude: validated.longitude,
        radiusMeters: validated.radiusMeters,
        label: validated.label,
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
      console.error('Update home location error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  })
}
