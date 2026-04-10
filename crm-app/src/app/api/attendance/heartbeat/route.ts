import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/middleware'
import { recordHeartbeat, getAutoCheckoutSettings } from '@/lib/db/queries/attendance'
import crypto from 'crypto'

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

export async function POST(request: NextRequest) {
  return withAuth(request, async (user) => {
    try {
      const metadata = getClientMetadata(request)
      const result = await recordHeartbeat(user.userId, metadata)
      
      if (!result.success) {
        return NextResponse.json(
          { error: 'No active check-in session', timestamp: result.timestamp },
          { status: 400 }
        )
      }

      const response: {
        success: boolean
        timestamp: string
        message: string
        warnings?: string[]
      } = {
        success: true,
        timestamp: result.timestamp,
        message: 'Heartbeat recorded',
      }

      if (result.warnings && result.warnings.length > 0) {
        response.warnings = result.warnings
      }

      return NextResponse.json(response)
    } catch (error) {
      console.error('Heartbeat error:', error)
      return NextResponse.json(
        { error: 'Failed to record heartbeat' },
        { status: 500 }
      )
    }
  })
}

export async function GET(request: NextRequest) {
  return withAuth(request, async (user) => {
    try {
      const settings = await getAutoCheckoutSettings()
      
      return NextResponse.json({
        data: {
          heartbeatIntervalMinutes: settings.heartbeatIntervalMinutes,
          inactivityTimeoutMinutes: settings.inactivityTimeoutMinutes,
          autoCheckoutEnabled: settings.autoCheckoutEnabled,
        }
      })
    } catch (error) {
      console.error('Get heartbeat settings error:', error)
      return NextResponse.json(
        { error: 'Failed to get settings' },
        { status: 500 }
      )
    }
  })
}