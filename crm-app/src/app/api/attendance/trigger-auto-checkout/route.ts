import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/middleware'
import { hasPermission } from '@/lib/auth/authorization'
import { triggerAutoCheckout } from '@/lib/db/queries/attendance'

export async function POST(request: NextRequest) {
  return withAuth(request, async (user) => {
    try {
      const canManage = await hasPermission(user, 'attendance.manage_office_location') ||
        await hasPermission(user, 'employees.manage')
      
      if (!canManage) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      const result = await triggerAutoCheckout()
      
      return NextResponse.json({
        success: true,
        message: `Auto-checkout processed. ${result.processed} sessions evaluated.`,
        processed: result.processed,
      })
    } catch (error) {
      console.error('Trigger auto-checkout error:', error)
      return NextResponse.json({ error: 'Failed to trigger auto-checkout' }, { status: 500 })
    }
  })
}

export async function GET(request: NextRequest) {
  return withAuth(request, async (user) => {
    try {
      const canManage = await hasPermission(user, 'attendance.manage_office_location') ||
        await hasPermission(user, 'employees.manage')
      
      if (!canManage) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      const result = await triggerAutoCheckout()
      
      return NextResponse.json({
        success: true,
        message: `Auto-checkout processed. ${result.processed} sessions evaluated.`,
        processed: result.processed,
      })
    } catch (error) {
      console.error('Trigger auto-checkout error:', error)
      return NextResponse.json({ error: 'Failed to trigger auto-checkout' }, { status: 500 })
    }
  })
}