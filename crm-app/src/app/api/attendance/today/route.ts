import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/middleware'
import { checkIn, checkOut, getTodayAttendanceSummary } from '@/lib/db/queries/attendance'
import { hasPermission } from '@/lib/auth/authorization'
import { z } from 'zod'
import crypto from 'crypto'

const locationRequired =
  'Location is required — enable GPS and allow browser location access for this site.'

const attendanceActionSchema = z.object({
  latitude: z
    .number({ required_error: locationRequired, invalid_type_error: locationRequired })
    .min(-90)
    .max(90),
  longitude: z
    .number({ required_error: locationRequired, invalid_type_error: locationRequired })
    .min(-180)
    .max(180),
  notes: z.string().optional(),
})

function getClientMetadata(request: NextRequest): {
  ipAddress: string
  userAgent: string
  deviceFingerprint: string
} {
  const forwarded = request.headers.get('x-forwarded-for')
  const ipAddress = forwarded ? forwarded.split(',')[0].trim() : 
    request.headers.get('x-real-ip') || 
    'unknown'
  
  const userAgent = request.headers.get('user-agent') || 'unknown'
  
  const fingerprintData = [
    userAgent.substring(0, 100),
    ipAddress,
  ].join('|')
  
  const deviceFingerprint = crypto
    .createHash('sha256')
    .update(fingerprintData)
    .digest('hex')
    .substring(0, 32)
  
  return {
    ipAddress: ipAddress.substring(0, 45),
    userAgent: userAgent.substring(0, 500),
    deviceFingerprint,
  }
}

export async function GET(request: NextRequest) {
  return withAuth(request, async (user) => {
    try {
      const summary = await getTodayAttendanceSummary(user.userId)
      return NextResponse.json({ data: summary })
    } catch (error) {
      console.error('Get today attendance error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  })
}

async function parseCheckInBody(request: NextRequest) {
  try {
    const text = await request.text()
    if (!text || !text.trim()) return {}
    return JSON.parse(text) as unknown
  } catch {
    return {}
  }
}

export async function POST(request: NextRequest) {
  return withAuth(request, async (user) => {
    try {
      if (!(await hasPermission(user, 'attendance.checkin'))) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      const body = await parseCheckInBody(request)
      const validated = attendanceActionSchema.parse(body)
      const metadata = getClientMetadata(request)

      // SECURITY: CRIT-01 — Cross-reference client GPS with IP-derived location
      let ipDerivedLat: number | null = null
      let ipDerivedLng: number | null = null
      let ipGpsDistanceKm: number | null = null
      try {
        const { getIPLocation } = await import('@/lib/auth/ip-geolocation')
        const ipLocation = await getIPLocation(metadata.ipAddress)
        if (ipLocation.latitude != null && ipLocation.longitude != null) {
          ipDerivedLat = ipLocation.latitude
          ipDerivedLng = ipLocation.longitude
          // Haversine distance between IP location and client-claimed GPS
          const R = 6371 // Earth radius in km
          const dLat = (validated.latitude - ipLocation.latitude) * Math.PI / 180
          const dLng = (validated.longitude - ipLocation.longitude) * Math.PI / 180
          const a = Math.sin(dLat/2)**2 +
            Math.cos(ipLocation.latitude * Math.PI / 180) * Math.cos(validated.latitude * Math.PI / 180) *
            Math.sin(dLng/2)**2
          ipGpsDistanceKm = Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)) * 100) / 100
        }
      } catch (err) {
        console.error('IP geolocation for GPS cross-reference failed:', err)
      }

      const record = await checkIn(
        user.userId,
        validated.latitude,
        validated.longitude,
        validated.notes,
        {
          ...metadata,
          ipDerivedLat,
          ipDerivedLng,
          ipGpsDistanceKm,
        }
      )

      return NextResponse.json({ 
        data: record,
        message: 'Checked in successfully' 
      }, { status: 201 })
    } catch (error) {
      if (error instanceof z.ZodError) {
        const msg = error.errors[0]?.message || 'Location is required for check-in'
        return NextResponse.json({ error: msg }, { status: 400 })
      }
      console.error('Check-in error:', error)
      const message = error instanceof Error ? error.message : 'Internal server error'
      if (message.includes('Check out of your current session')) {
        return NextResponse.json({ error: message }, { status: 400 })
      }
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  })
}

export async function PUT(request: NextRequest) {
  return withAuth(request, async (user) => {
    try {
      if (!(await hasPermission(user, 'attendance.checkout'))) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      const body = await parseCheckInBody(request)
      const validated = attendanceActionSchema.parse(body)

      const record = await checkOut(
        user.userId,
        validated.latitude,
        validated.longitude,
        validated.notes
      )

      return NextResponse.json({ 
        data: record,
        message: 'Checked out successfully' 
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        const msg = error.errors[0]?.message || 'Location is required for check-out'
        return NextResponse.json({ error: msg }, { status: 400 })
      }
      const message = error instanceof Error ? error.message : 'Internal server error'
      if (message === 'No check-in record found for today') {
        return NextResponse.json({ error: message }, { status: 400 })
      }
      console.error('Check-out error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  })
}