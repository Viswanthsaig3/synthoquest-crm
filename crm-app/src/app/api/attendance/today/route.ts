import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/middleware'
import { checkIn, checkOut, getTodayAttendanceSummary, getOfficeLocationSettings } from '@/lib/db/queries/attendance'
import { hasPermission } from '@/lib/auth/authorization'
import { getIPLocation, haversineDistanceKm, isNonPublicIP } from '@/lib/auth/ip-geolocation'
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

      const orgSettings = await getOfficeLocationSettings()

      console.log('[attendance] Check-in request:', {
        ip: metadata.ipAddress,
        gpsLat: validated.latitude,
        gpsLng: validated.longitude,
        requireGeolocation: orgSettings.requireGeolocation,
        blockOnVerificationFailure: orgSettings.blockOnVerificationFailure,
      })

      const enforcementPolicy = {
        blockOnVerificationFailure: orgSettings.blockOnVerificationFailure ?? false,
        maxIpGpsDistanceKm: 500,
        minGpsPrecisionMeters: 5,
      }

      let ipDerivedLat: number | null = null
      let ipDerivedLng: number | null = null
      let ipGpsDistanceKm: number | null = null
      let ipVerificationFailed = false
      let ipVerificationError: string | null = null

      if (orgSettings.requireGeolocation) {
        try {
          const ipLocation = await getIPLocation(metadata.ipAddress)
          console.log('[attendance] IP geolocation result:', {
            ip: metadata.ipAddress,
            ipLat: ipLocation.latitude,
            ipLng: ipLocation.longitude,
            ipCity: ipLocation.city,
            ipCountry: ipLocation.country,
          })
          if (ipLocation.latitude != null && ipLocation.longitude != null) {
            ipDerivedLat = ipLocation.latitude
            ipDerivedLng = ipLocation.longitude
            ipGpsDistanceKm = haversineDistanceKm(
              validated.latitude,
              validated.longitude,
              ipLocation.latitude,
              ipLocation.longitude
            )
            console.log('[attendance] IP-GPS distance:', ipGpsDistanceKm, 'km')
          } else {
            ipVerificationFailed = true
            ipVerificationError = 'IP geolocation returned null coordinates. This may indicate rate limiting, VPN, or private IP.'
            console.warn('[Attendance] IP geolocation returned null:', { ip: metadata.ipAddress, result: ipLocation })
          }
        } catch (err) {
          ipVerificationFailed = true
          ipVerificationError = err instanceof Error ? err.message : 'IP geolocation service unavailable'
          console.warn('[Attendance] IP geolocation failed:', err)
        }
      }

      // Only block if explicitly enabled AND the IP is a verified public IP (not rate-limited)
      // Don't block for legitimate failures like VPN, rate limiting, or service issues
      const shouldBlockOnVerificationFailure = 
        orgSettings.blockOnVerificationFailure === true && 
        ipVerificationFailed && 
        !isNonPublicIP(metadata.ipAddress) &&
        ipVerificationError?.includes('GPS spoofing')

      if (shouldBlockOnVerificationFailure) {
        return NextResponse.json({
          error: 'Location verification failed. GPS spoofing detected.',
          details: {
            reason: 'Your GPS location does not match expected patterns.',
            suggestion: 'Please ensure your GPS is accurate and not being spoofed.',
          },
          code: 'SPOOFING_DETECTED',
        }, { status: 400 })
      }

      if (enforcementPolicy.blockOnVerificationFailure && ipGpsDistanceKm !== null && ipGpsDistanceKm > enforcementPolicy.maxIpGpsDistanceKm) {
        return NextResponse.json({
          error: 'Location mismatch detected. Your GPS location differs significantly from your verified IP location.',
          details: {
            ipGpsDistance: `${ipGpsDistanceKm.toFixed(1)}km`,
            maxAllowed: `${enforcementPolicy.maxIpGpsDistanceKm}km`,
            suggestion: 'This may indicate GPS spoofing or incorrect location settings. Please ensure your device GPS is accurate.',
            contactAdmin: 'If you believe this is an error, contact your administrator.',
          },
          code: 'IMPOSSIBLE_TRAVEL',
        }, { status: 400 })
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
        },
        enforcementPolicy
      )

      const response: Record<string, unknown> = {
        data: record,
        message: 'Checked in successfully',
      }

      if (record.checkInInRadius === false) {
        response.warning = 'You checked in outside the allowed radius. This has been flagged for admin review.'
      }

      if (ipGpsDistanceKm !== null && ipGpsDistanceKm > 10) {
        response.warning = `Your GPS location is ${ipGpsDistanceKm.toFixed(1)}km from your IP location. This has been logged.`
      }

      return NextResponse.json(response, { status: 201 })
    } catch (error) {
      if (error instanceof z.ZodError) {
        const msg = error.errors[0]?.message || 'Location is required for check-in'
        return NextResponse.json({ error: msg }, { status: 400 })
      }
      console.error('Check-in error:', error)
      const message = error instanceof Error ? error.message : ''
      if (message.includes('Check out of your current session')) {
        return NextResponse.json({ error: message }, { status: 400 })
      }
      if (message.includes('Location verification failed') || message.includes('Location mismatch')) {
        return NextResponse.json({ error: message }, { status: 400 })
      }
      return NextResponse.json({ error: 'An unexpected error occurred. Please try again.' }, { status: 500 })
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
      const message = error instanceof Error ? error.message : ''
      if (message === 'No check-in record found for today') {
        return NextResponse.json({ error: message }, { status: 400 })
      }
      console.error('Check-out error:', error)
      return NextResponse.json({ error: 'An unexpected error occurred. Please try again.' }, { status: 500 })
    }
  })
}