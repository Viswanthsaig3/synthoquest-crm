import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/middleware'
import { bulkApproveEntries, validateBulkEntryOwnership } from '@/lib/db/queries/timesheets'
import { hasPermission } from '@/lib/auth/authorization'
import { z } from 'zod'

const bulkApproveSchema = z.object({
  entryIds: z.array(z.string().uuid()).min(1, 'At least one entry ID is required'),
})

export async function POST(request: NextRequest) {
  return withAuth(request, async (user) => {
    try {
      const body = await request.json()
      const validated = bulkApproveSchema.parse(body)

      const canApprove = await hasPermission(user, 'timesheets.approve')

      if (!canApprove) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      const canViewAll = await hasPermission(user, 'timesheets.view_all')
      const ownership = await validateBulkEntryOwnership(validated.entryIds, user.userId, canViewAll)

      if (!ownership.valid) {
        return NextResponse.json({ error: ownership.error }, { status: 403 })
      }

      await bulkApproveEntries(validated.entryIds, user.userId)

      return NextResponse.json({ 
        message: `${validated.entryIds.length} entries approved successfully` 
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
      }
      console.error('Bulk approve entries error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  })
}
