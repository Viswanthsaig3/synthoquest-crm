import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/middleware'
import { canAccessLeadTypes } from '@/lib/auth/authorization'
import { getLeadTypeById } from '@/lib/db/queries/lead-types'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async (user) => {
    try {
      if (!(await canAccessLeadTypes(user))) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      const leadType = await getLeadTypeById(params.id)

      if (!leadType) {
        return NextResponse.json({ error: 'Lead type not found' }, { status: 404 })
      }

      return NextResponse.json({ data: leadType })
    } catch (error) {
      console.error('Get lead type error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  })
}