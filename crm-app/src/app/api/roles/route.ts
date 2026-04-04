import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/middleware'
import { getAllRoles, getRoleWithPermissions } from '@/lib/db/queries/roles'
import { hasPermissionStatic } from '@/lib/permissions'

export async function GET(request: NextRequest) {
  return withAuth(request, async (user) => {
    try {
      const canView = hasPermissionStatic({ role: user.role } as any, 'employees.view_all')
      
      if (!canView) {
        return NextResponse.json(
          { error: 'Forbidden' },
          { status: 403 }
        )
      }

      const roles = await getAllRoles()

      const rolesWithPermissions = await Promise.all(
        roles.map(async (role) => {
          const roleWithPerms = await getRoleWithPermissions(role.key)
          return {
            id: role.id,
            key: role.key,
            name: role.name,
            description: role.description,
            isSystem: role.isSystem,
            permissions: roleWithPerms?.permissions || [],
          }
        })
      )

      return NextResponse.json({
        data: rolesWithPermissions,
      })
    } catch (error) {
      console.error('Get roles error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  })
}
