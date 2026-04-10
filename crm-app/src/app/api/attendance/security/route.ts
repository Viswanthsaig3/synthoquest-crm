import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/middleware'
import { hasPermission } from '@/lib/auth/authorization'
import { createAdminClient } from '@/lib/db/server-client'

export async function GET(request: NextRequest) {
  return withAuth(request, async (user) => {
    try {
      if (!(await hasPermission(user, 'attendance.view_adjustments'))) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      const { searchParams } = new URL(request.url)
      const fromDate = searchParams.get('fromDate')
      const toDate = searchParams.get('toDate')
      const severity = searchParams.get('severity')
      const eventType = searchParams.get('eventType')
      const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200)

      const supabase = await createAdminClient()

      let query = supabase
        .from('attendance_security_events')
        .select(`
          id,
          user_id,
          attendance_record_id,
          event_type,
          severity,
          details,
          ip_address,
          user_agent,
          detected_at,
          reviewed_at,
          review_notes,
          users!attendance_security_events_user_id_fkey (
            id,
            name,
            email
          )
        `)
        .order('detected_at', { ascending: false })
        .limit(limit)

      if (fromDate) {
        query = query.gte('detected_at', `${fromDate}T00:00:00.000Z`)
      }
      if (toDate) {
        query = query.lte('detected_at', `${toDate}T23:59:59.999Z`)
      }
      if (severity) {
        query = query.eq('severity', severity)
      }
      if (eventType) {
        query = query.eq('event_type', eventType)
      }

      const { data, error } = await query

      if (error) throw error

      const transformedData = (data || []).map((row) => {
        const userData = row.users as { id: string; name: string; email: string } | null | { id: string; name: string; email: string }[]
        const user = Array.isArray(userData) ? userData[0] : userData
        
        return {
          id: row.id,
          userId: row.user_id,
          attendanceRecordId: row.attendance_record_id,
          eventType: row.event_type,
          severity: row.severity,
          details: row.details,
          ipAddress: row.ip_address,
          userAgent: row.user_agent,
          detectedAt: row.detected_at,
          reviewedAt: row.reviewed_at,
          reviewNotes: row.review_notes,
          user: user ? {
            id: user.id,
            name: user.name,
            email: user.email,
          } : null,
        }
      })

      return NextResponse.json({ data: transformedData })
    } catch (error) {
      console.error('Get security events error:', error)
      return NextResponse.json(
        { error: 'Failed to get security events' },
        { status: 500 }
      )
    }
  })
}

export async function PATCH(request: NextRequest) {
  return withAuth(request, async (user) => {
    try {
      if (!(await hasPermission(user, 'attendance.adjust_records'))) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      const body = await request.json()
      const { eventId, reviewNotes } = body

      if (!eventId) {
        return NextResponse.json({ error: 'Event ID required' }, { status: 400 })
      }

      const supabase = await createAdminClient()

      const { error } = await supabase
        .from('attendance_security_events')
        .update({
          reviewed_at: new Date().toISOString(),
          reviewed_by: user.userId,
          review_notes: reviewNotes || null,
        })
        .eq('id', eventId)

      if (error) throw error

      return NextResponse.json({ success: true })
    } catch (error) {
      console.error('Review security event error:', error)
      return NextResponse.json(
        { error: 'Failed to review event' },
        { status: 500 }
      )
    }
  })
}