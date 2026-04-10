import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/middleware'
import { hasPermission } from '@/lib/auth/authorization'
import { getHierarchyTree } from '@/lib/db/queries/users'

export async function GET(request: NextRequest) {
  return withAuth(request, async (user) => {
    try {
      const canView = 
        (await hasPermission(user, 'employees.view_all')) ||
        (await hasPermission(user, 'employees.manage'))

      if (!canView) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      const { searchParams } = new URL(request.url)
      const department = searchParams.get('department') || undefined

      const tree = await getHierarchyTree({ department })

      return NextResponse.json({ data: tree })
    } catch (error) {
      console.error('Get hierarchy error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  })
}