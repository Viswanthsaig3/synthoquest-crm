import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/middleware'
import { updateRolePermissions, getRoleWithPermissions } from '@/lib/db/queries/roles'
import { hasPermissionStatic } from '@/lib/permissions'
import { z } from 'zod'
import { permissionCache } from '@/lib/permissions-cache'

const updatePermissionsSchema = z.object({
  permissions: z.array(z.string()).min(1),
})

export async function PUT(request: NextRequest, { params }: { params: { key: string } }) {
  return withAuth(request, async (user) => {
    try {
      const canManage = hasPermissionStatic({ role: user.role } as any, 'roles.manage')
      
      if (!canManage) {
        return NextResponse.json(
          { error: 'Forbidden' },
          { status: 403 }
        )
      }

      const body = await request.json()
      const validated = updatePermissionsSchema.parse(body)

      const role = await getRoleWithPermissions(params.key)
      
      if (!role) {
        return NextResponse.json(
          { error: 'Role not found' },
          { status: 404 }
        )
      }

      // Prevent modifying system roles unless admin
      if (role.isSystem && user.role !== 'admin') {
        return NextResponse.json(
          { error: 'Cannot modify system roles' },
          { status: 403 }
        )
      }

      const updatedRole = await updateRolePermissions(params.key, validated.permissions, user.userId)

      // Invalidate permission cache for all users with this role
      permissionCache.invalidateAll()

      return NextResponse.json({
        data: {
          id: updatedRole.id,
          key: updatedRole.key,
          name: updatedRole.name,
          permissions: updatedRole.permissions,
        },
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Validation error', details: error.errors },
          { status: 400 }
        )
      }

      console.error('Update role permissions error:', error)
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Internal server error' },
        { status: error instanceof Error && error.message.includes('not found') ? 404 : 500 }
      )
    }
  })
}
