import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/middleware'
import { getAssignableUsers } from '@/lib/db/queries/users'
import { hasPermission } from '@/lib/auth/authorization'

export async function GET(request: NextRequest) {
  return withAuth(request, async (user) => {
    try {
      const canAssign = await hasPermission(user, 'tasks.assign')
      if (!canAssign) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      const assignableUsers = await getAssignableUsers(user.userId)

      const users = assignableUsers.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        department: u.department,
        avatar: u.avatar,
      }))

      return NextResponse.json({ 
        data: users,
        total: users.length
      })
    } catch (error) {
      console.error('Get assignable users error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  })
}