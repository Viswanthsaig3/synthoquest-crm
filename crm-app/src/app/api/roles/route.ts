import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/middleware'
import { createRole, getAllRoles, getRoleWithPermissions, updateRolePermissions } from '@/lib/db/queries/roles'
import { hasPermission, isAdmin } from '@/lib/auth/authorization'
import { permissionCache } from '@/lib/permissions-cache'
import { z } from 'zod'

const createRoleSchema = z.object({
  key: z.string().min(2).max(64).regex(/^[a-z][a-z0-9_]*$/),
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  permissions: z.array(z.string()).default([]),
})

export async function GET(request: NextRequest) {
  return withAuth(request, async (user) => {
    try {
      const canView =
        (await hasPermission(user, 'roles.manage')) ||
        (await hasPermission(user, 'employees.manage'))
      
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

export async function POST(request: NextRequest) {
  return withAuth(request, async (user) => {
    try {
      const canManage = await hasPermission(user, 'roles.manage')
      if (!canManage || !isAdmin(user)) {
        return NextResponse.json({ error: 'Only admin can create roles' }, { status: 403 })
      }

      const body = await request.json()
      const validated = createRoleSchema.parse(body)

      if (validated.key === 'admin') {
        return NextResponse.json({ error: 'Admin role is reserved' }, { status: 400 })
      }

      const role = await createRole({
        key: validated.key,
        name: validated.name,
        description: validated.description,
        isSystem: false,
      })

      if (validated.permissions.length > 0) {
        await updateRolePermissions(validated.key, validated.permissions, user.userId)
      }

      permissionCache.invalidateAll()
      const roleWithPermissions = await getRoleWithPermissions(validated.key)
      return NextResponse.json({ data: roleWithPermissions ?? role }, { status: 201 })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
      }
      console.error('Create role error:', error)
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Internal server error' },
        { status: 500 }
      )
    }
  })
}
