import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/middleware'
import { getLeadById, getCallRecords } from '@/lib/db/queries/leads'
import { hasPermission } from '@/lib/auth/authorization'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async (user) => {
    try {
      const lead = await getLeadById(params.id)

      if (!lead) {
        return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
      }

      const canViewAll = await hasPermission(user, 'leads.view_all')
      
      if (!canViewAll && lead.assignedTo !== user.userId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      const calls = await getCallRecords(params.id)

      return NextResponse.json({ data: calls })
    } catch (error) {
      console.error('Get call records error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  })
}