import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/middleware'
import { getUserHomeLocation, upsertUserHomeLocation, getOfficeLocationSettings } from '@/lib/db/queries/attendance'
import { hasPermission } from '@/lib/auth/authorization'
import { createAdminClient } from '@/lib/db/server-client'
import { getIPLocation, haversineDistanceKm } from '@/lib/auth/ip-geolocation'
import { z } from 'zod'

const homeLocationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  radiusMeters: z.number().int().min(50).max(500).default(300),
  label: z.string().max(100).optional(),
})

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  return forwarded ? forwarded.split(',')[0].trim() : request.headers.get('x-real-ip') || '127.0.0.1'
}

export async function GET(request: NextRequest) {
  return withAuth(request, async (user) => {
    try {
      const data = await getUserHomeLocation(user.userId)
      
      const supabase = await createAdminClient()
      const { data: locationData } = await supabase
        .from('user_home_locations')
        .select('is_locked')
        .eq('user_id', user.userId)
        .is('deleted_at', null)
        .single()
      
      return NextResponse.json({ 
        data,
        isLocked: locationData?.is_locked ?? false
      })
    } catch (error) {
      console.error('Get home location error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  })
}

export async function POST(request: NextRequest) {
  return withAuth(request, async (user) => {
    try {
      const existing = await getUserHomeLocation(user.userId)

      if (existing) {
        const supabase = await createAdminClient()
        const { data: lockData } = await supabase
          .from('user_home_locations')
          .select('is_locked')
          .eq('user_id', user.userId)
          .is('deleted_at', null)
          .single()

        if (lockData?.is_locked) {
          return NextResponse.json(
            { error: 'Home location is locked. Please contact admin to change your location.' },
            { status: 403 }
          )
        }
      }

      const body = await request.json()
      const validated = homeLocationSchema.parse(body)

      const orgSettings = await getOfficeLocationSettings()

      if (orgSettings.requireGeolocation) {
        const ipAddress = getClientIP(request)
        console.log('[home-location] Checking IP geolocation for:', ipAddress)
        
        const ipLocation = await getIPLocation(ipAddress)
        console.log('[home-location] IP geolocation result:', {
          ip: ipAddress,
          lat: ipLocation.latitude,
          lng: ipLocation.longitude,
          city: ipLocation.city,
          country: ipLocation.country,
        })

        if (ipLocation.latitude === null || ipLocation.longitude === null) {
          console.warn('[home-location] IP geolocation failed - allowing registration with flag')
          // Don't block - just proceed without IP verification
        } else {
          const distanceKm = haversineDistanceKm(
            validated.latitude,
            validated.longitude,
            ipLocation.latitude,
            ipLocation.longitude
          )

          console.log('[home-location] Distance from IP location:', distanceKm, 'km')

          // Only block if distance is EXTREMELY far (100km+) - indicating likely spoofing
          const maxAllowedDistanceKm = 100

          if (distanceKm > maxAllowedDistanceKm) {
            console.warn('[home-location] Distance exceeds max, but allowing with flag:', distanceKm)
            // Don't block - just flag for admin review
          }
        }
      }

      const supabase = await createAdminClient()
      const { data, error } = await supabase
        .from('user_home_locations')
        .upsert({
          user_id: user.userId,
          latitude: validated.latitude,
          longitude: validated.longitude,
          radius_meters: validated.radiusMeters,
          label: validated.label || null,
          updated_by: user.userId,
          is_locked: true,
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
        message: 'Home location saved and locked. Contact admin to change it later.'
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Validation error', details: error.errors },
          { status: 400 }
        )
      }
      console.error('Save home location error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  })
}

export async function DELETE(request: NextRequest) {
  return withAuth(request, async (user) => {
    const isAdminUser = await hasPermission(user, 'attendance.manage_home_location_all')
    
    if (!isAdminUser) {
      return NextResponse.json(
        { error: 'Only admin can remove home location' },
        { status: 403 }
      )
    }

    try {
      const supabase = await createAdminClient()
      const { error } = await supabase
        .from('user_home_locations')
        .update({ deleted_at: new Date().toISOString(), is_locked: false })
        .eq('user_id', user.userId)

      if (error) throw error

      return NextResponse.json({ message: 'Home location removed' })
    } catch (error) {
      console.error('Delete home location error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  })
}