import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/middleware'
import { hasPermission } from '@/lib/auth/authorization'
import { createAdminClient } from '@/lib/db/server-client'
import { z } from 'zod'

const homeLocationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  radiusMeters: z.number().int().min(50).max(500).default(300),
  label: z.string().max(100).optional(),
  isLocked: z.boolean().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(request, async (user) => {
    const isAdmin = await hasPermission(user, 'attendance.manage_home_location_all')
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    try {
      const { id } = await params
      const supabase = await createAdminClient()
      const { data, error } = await supabase
        .from('user_home_locations')
        .select('*')
        .eq('user_id', id)
        .is('deleted_at', null)
        .single()

      if (error && error.code !== 'PGRST116') throw error

      if (!data) {
        return NextResponse.json({ data: null, isLocked: false })
      }

      return NextResponse.json({
        data: {
          userId: data.user_id,
          latitude: data.latitude,
          longitude: data.longitude,
          radiusMeters: data.radius_meters,
          label: data.label,
          updatedAt: data.updated_at,
          updatedBy: data.updated_by,
        },
        isLocked: data.is_locked,
      })
    } catch (error) {
      console.error('Get user home location error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  })
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(request, async (user) => {
    const isAdmin = await hasPermission(user, 'attendance.manage_home_location_all')
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    try {
      const { id } = await params
      const body = await request.json()
      const validated = homeLocationSchema.parse(body)

      const supabase = await createAdminClient()
      const { data, error } = await supabase
        .from('user_home_locations')
        .upsert({
          user_id: id,
          latitude: validated.latitude,
          longitude: validated.longitude,
          radius_meters: validated.radiusMeters,
          label: validated.label || null,
          updated_by: user.userId,
          is_locked: validated.isLocked ?? true,
          deleted_at: null,
        }, { onConflict: 'user_id' })
        .select('*')
        .single()

      if (error) throw error

      return NextResponse.json({
        data: {
          userId: data.user_id,
          latitude: data.latitude,
          longitude: data.longitude,
          radiusMeters: data.radius_meters,
          label: data.label,
          updatedAt: data.updated_at,
          isLocked: data.is_locked,
        },
        message: 'User home location updated by admin',
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Validation error', details: error.errors },
          { status: 400 }
        )
      }
      console.error('Update user home location error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(request, async (user) => {
    const isAdmin = await hasPermission(user, 'attendance.manage_home_location_all')
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    try {
      const { id } = await params
      const supabase = await createAdminClient()
      const { error } = await supabase
        .from('user_home_locations')
        .update({ 
          deleted_at: new Date().toISOString(),
          is_locked: false,
        })
        .eq('user_id', id)

      if (error) throw error

      return NextResponse.json({ message: 'User home location removed and unlocked' })
    } catch (error) {
      console.error('Delete user home location error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  })
}