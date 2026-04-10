import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/middleware'
import { updateRolePermissions, getRoleWithPermissions } from '@/lib/db/queries/roles'
import { hasPermission, isAdmin } from '@/lib/auth/authorization'
import { z } from 'zod'
import { permissionCache } from '@/lib/permissions-cache'

const updatePermissionsSchema = z.object({
  permissions: z.array(z.string()),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  return withAuth(request, async (user) => {
    try {
      const { key } = await params
      const role = await getRoleWithPermissions(key)

      if (!role) {
        return NextResponse.json({ error: 'Role not found' }, { status: 404 })
      }

      return NextResponse.json({
        data: {
          id: role.id,
          key: role.key,
          name: role.name,
          permissions: role.permissions,
        },
      })
    } catch (error) {
      console.error('Get role permissions error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  })
}

export async function PUT(request: NextRequest, { params }: { params: { key: string } }) {
  return withAuth(request, async (user) => {
    try {
      const canManage = await hasPermission(user, 'roles.manage')
      
      if (!canManage || !isAdmin(user)) {
        return NextResponse.json(
          { error: 'Only admin can update role permissions' },
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
