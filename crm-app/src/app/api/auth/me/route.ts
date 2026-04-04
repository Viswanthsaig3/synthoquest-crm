import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/middleware'
import { getUserById } from '@/lib/db/queries/users'

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
        department: userData.department,
        phone: userData.phone,
        avatar: userData.avatar,
        status: userData.status,
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
