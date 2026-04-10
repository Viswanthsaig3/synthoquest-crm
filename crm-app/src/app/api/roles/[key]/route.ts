import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/middleware'
import { archiveRole, getRoleWithPermissions, updateRole } from '@/lib/db/queries/roles'
import { hasPermission, isAdmin } from '@/lib/auth/authorization'
import { permissionCache } from '@/lib/permissions-cache'
import { z } from 'zod'

const updateRoleSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  description: z.string().max(500).nullable().optional(),
})

export async function GET(request: NextRequest, { params }: { params: { key: string } }) {
  return withAuth(request, async (user) => {
    try {
      const canManage = await hasPermission(user, 'roles.manage')
      if (!canManage || !isAdmin(user)) {
        return NextResponse.json({ error: 'Only admin can view role details' }, { status: 403 })
      }

      const role = await getRoleWithPermissions(params.key)
      if (!role) {
        return NextResponse.json({ error: 'Role not found' }, { status: 404 })
      }

      return NextResponse.json({ data: role })
    } catch (error) {
      console.error('Get role error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  })
}

export async function PATCH(request: NextRequest, { params }: { params: { key: string } }) {
  return withAuth(request, async (user) => {
    try {
      const canManage = await hasPermission(user, 'roles.manage')
      if (!canManage || !isAdmin(user)) {
        return NextResponse.json({ error: 'Only admin can update role metadata' }, { status: 403 })
      }

      const body = await request.json()
      const validated = updateRoleSchema.parse(body)

      const updatedRole = await updateRole(params.key, validated)
      return NextResponse.json({ data: updatedRole })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
      }
      console.error('Update role error:', error)
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Internal server error' },
        { status: error instanceof Error && error.message.includes('not found') ? 404 : 500 }
      )
    }
  })
}

export async function DELETE(request: NextRequest, { params }: { params: { key: string } }) {
  return withAuth(request, async (user) => {
    try {
      const canManage = await hasPermission(user, 'roles.manage')
      if (!canManage) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      if (params.key === 'admin' || !isAdmin(user)) {
        return NextResponse.json({ error: 'Only admin can archive roles and admin role is immutable' }, { status: 403 })
      }

      await archiveRole(params.key)
      permissionCache.invalidateAll()

      return NextResponse.json({ message: 'Role archived successfully' })
    } catch (error) {
      console.error('Archive role error:', error)
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Internal server error' },
        { status: error instanceof Error && error.message.includes('not found') ? 404 : 500 }
      )
    }
  })
}
