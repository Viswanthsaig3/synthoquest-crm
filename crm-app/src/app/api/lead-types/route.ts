import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/middleware'
import { canAccessLeadTypes } from '@/lib/auth/authorization'
import { getLeadTypes } from '@/lib/db/queries/lead-types'

export async function GET(request: NextRequest) {
  return withAuth(request, async (user) => {
    try {
      if (!(await canAccessLeadTypes(user))) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      const { searchParams } = new URL(request.url)
      const includeInactive = searchParams.get('includeInactive') === 'true'
      
      const leadTypes = await getLeadTypes(includeInactive)

      return NextResponse.json({ data: leadTypes })
    } catch (error) {
      console.error('Get lead types error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  })
}