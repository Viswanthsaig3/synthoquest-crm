import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/middleware'
import { getLeadById, claimLead } from '@/lib/db/queries/leads'
import { hasPermission } from '@/lib/auth/authorization'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async (user) => {
    try {
      const lead = await getLeadById(params.id)

      if (!lead) {
        return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
      }

      if (!(await hasPermission(user, 'leads.claim'))) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      try {
        const updated = await claimLead(params.id, user.userId)
        return NextResponse.json({ data: updated })
      } catch (claimError) {
        if (claimError instanceof Error && claimError.message.includes('already claimed')) {
          return NextResponse.json({ error: 'Lead already claimed' }, { status: 400 })
        }
        throw claimError
      }
    } catch (error) {
      console.error('Claim lead error:', error)
      return NextResponse.json({ error: 'An unexpected error occurred. Please try again.' }, { status: 500 })
    }
  })
}