import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/middleware'
import { getUserRoleHistory } from '@/lib/db/queries/roles'
import { getUserById } from '@/lib/db/queries/users'
import { hasPermission } from '@/lib/auth/authorization'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  return withAuth(request, async (user) => {
    try {
      const canViewAll = await hasPermission(user, 'employees.view_all')
      const isOwnProfile = params.id === user.userId

      if (!canViewAll && !isOwnProfile) {
        return NextResponse.json(
          { error: 'Forbidden' },
          { status: 403 }
        )
      }

      // Verify user exists
      const targetUser = await getUserById(params.id)
      if (!targetUser) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        )
      }

      const history = await getUserRoleHistory(params.id)

      return NextResponse.json({
        data: history,
      })
    } catch (error) {
      console.error('Get role history error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  })
}
