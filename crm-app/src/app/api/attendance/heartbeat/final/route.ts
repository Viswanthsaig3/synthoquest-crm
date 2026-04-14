import { NextRequest, NextResponse } from 'next/server'
import { recordHeartbeat } from '@/lib/db/queries/attendance'
import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'

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
  try {
    const body = await request.json().catch(() => ({ token: null, sessionId: null, timestamp: null, event: 'page_unload' }))
    
    const token = body.token || request.headers.get('authorization')?.replace('Bearer ', '')
    
    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 })
    }
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })
    
    const { data: userData, error: userError } = await supabase.auth.getUser(token)
    
    if (userError || !userData?.user?.id) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }
    
    const userId = userData.user.id
    const metadata = getClientMetadata(request)
    
    const result = await recordHeartbeat(userId, metadata)
    
    return NextResponse.json({ 
      success: true, 
      message: 'Final heartbeat recorded',
      timestamp: result.timestamp,
    })
  } catch (error) {
    console.error('Final heartbeat error:', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}