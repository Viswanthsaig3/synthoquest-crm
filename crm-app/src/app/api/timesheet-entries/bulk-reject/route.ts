import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/middleware'
import { bulkRejectEntries, validateBulkEntryOwnership } from '@/lib/db/queries/timesheets'
import { hasPermission } from '@/lib/auth/authorization'
import { z } from 'zod'

const bulkRejectSchema = z.object({
  entryIds: z.array(z.string().uuid()).min(1, 'At least one entry ID is required'),
  reason: z.string().min(1, 'Rejection reason is required'),
})

export async function POST(request: NextRequest) {
  return withAuth(request, async (user) => {
    try {
      const body = await request.json()
      const validated = bulkRejectSchema.parse(body)

      const canApprove = await hasPermission(user, 'timesheets.approve')

      if (!canApprove) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      const canViewAll = await hasPermission(user, 'timesheets.view_all')
      const ownership = await validateBulkEntryOwnership(validated.entryIds, user.userId, canViewAll)

      if (!ownership.valid) {
        return NextResponse.json({ error: ownership.error }, { status: 403 })
      }

      await bulkRejectEntries(validated.entryIds, user.userId, validated.reason)

      return NextResponse.json({ 
        message: `${validated.entryIds.length} entries rejected successfully` 
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
      }
      console.error('Bulk reject entries error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  })
}
