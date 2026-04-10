import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/middleware'
import { getAutoCheckoutSettings, updateAutoCheckoutSettings } from '@/lib/db/queries/attendance'
import { hasPermission } from '@/lib/auth/authorization'
import { z } from 'zod'

const settingsSchema = z.object({
  inactivityTimeoutMinutes: z.number().min(5).max(120),
  autoCheckoutEnabled: z.boolean(),
  heartbeatIntervalMinutes: z.number().min(1).max(30),
  autoCheckoutOnLogout: z.boolean(),
})

export async function GET(request: NextRequest) {
  return withAuth(request, async (user) => {
    try {
      if (!(await hasPermission(user, 'attendance.manage_office_location'))) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      const settings = await getAutoCheckoutSettings()
      
      return NextResponse.json({ data: settings })
    } catch (error) {
      console.error('Get auto-checkout settings error:', error)
      return NextResponse.json(
        { error: 'Failed to get settings' },
        { status: 500 }
      )
    }
  })
}

export async function PUT(request: NextRequest) {
  return withAuth(request, async (user) => {
    try {
      if (!(await hasPermission(user, 'attendance.manage_office_location'))) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      const body = await request.json()
      const validated = settingsSchema.parse(body)

      const settings = await updateAutoCheckoutSettings({
        inactivityTimeoutMinutes: validated.inactivityTimeoutMinutes,
        autoCheckoutEnabled: validated.autoCheckoutEnabled,
        heartbeatIntervalMinutes: validated.heartbeatIntervalMinutes,
        autoCheckoutOnLogout: validated.autoCheckoutOnLogout,
      })

      return NextResponse.json({
        data: settings,
        message: 'Auto-checkout settings updated successfully'
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Validation error', details: error.errors },
          { status: 400 }
        )
      }
      console.error('Update auto-checkout settings error:', error)
      return NextResponse.json(
        { error: 'Failed to update settings' },
        { status: 500 }
      )
    }
  })
}