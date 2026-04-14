import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/db/server-client'

export async function GET() {
  const timestamp = new Date().toISOString()
  
  try {
    const supabase = await createAdminClient()
    
    const { error } = await supabase
      .from('users')
      .select('id')
      .limit(1)
    
    if (error) {
      console.error('Health check database error:', error)
      return NextResponse.json(
        {
          status: 'degraded',
          timestamp,
          database: 'error',
          error: 'Database connectivity issue',
        },
        { status: 503 }
      )
    }
    
    return NextResponse.json({
      status: 'healthy',
      timestamp,
      database: 'connected',
      version: process.env.npm_package_version || '1.0.0',
    })
  } catch (error) {
    console.error('Health check error:', error)
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp,
        database: 'disconnected',
        error: 'Application error',
      },
      { status: 503 }
    )
  }
}