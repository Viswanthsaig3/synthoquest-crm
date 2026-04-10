import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/middleware'
import { getAllPermissions } from '@/lib/db/queries/permissions'
import { hasPermission } from '@/lib/auth/authorization'

export async function GET(request: NextRequest) {
  return withAuth(request, async (user) => {
    try {
      const canManage = await hasPermission(user, 'roles.manage')
      
      if (!canManage) {
        return NextResponse.json(
          { error: 'Forbidden' },
          { status: 403 }
        )
      }

      const permissions = await getAllPermissions()

      // Group by resource
      const grouped = permissions.reduce((acc, perm) => {
        if (!acc[perm.resource]) {
          acc[perm.resource] = []
        }
        acc[perm.resource].push({
          id: perm.id,
          key: perm.key,
          name: perm.name,
          description: perm.description,
          action: perm.action,
        })
        return acc
      }, {} as Record<string, { id: string; key: string; name: string; description: string | null; action: string }[]>)

      return NextResponse.json({
        data: grouped,
      })
    } catch (error) {
      console.error('Get permissions error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  })
}
