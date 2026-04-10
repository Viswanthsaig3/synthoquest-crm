import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/middleware'
import { getUserById } from '@/lib/db/queries/users'
import { getUserPermissions } from '@/lib/db/queries/permissions'

export async function GET(request: NextRequest) {
  return withAuth(request, async (user) => {
    try {
      const userData = await getUserById(user.userId)

      if (!userData) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        )
      }

      const userResponse = {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        permissions: await getUserPermissions(userData.id),
        department: userData.department,
        phone: userData.phone,
        avatar: userData.avatar,
        status: userData.status,
        managedBy: userData.managedBy,
        // SECURITY: CRIT-04 — Compensation data stripped from /me response.
        // Access via /api/users/[id]/compensation with compensation.manage permission.
        lastLoginAt: userData.lastLoginAt,
      }

      return NextResponse.json({
        data: userResponse,
      })
    } catch (error) {
      console.error('Get me error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  })
}
