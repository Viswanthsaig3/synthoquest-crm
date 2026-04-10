import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/middleware'
import { changeUserRole, getRoleByKey } from '@/lib/db/queries/roles'
import { getUserById } from '@/lib/db/queries/users'
import { revokeAllUserTokens } from '@/lib/db/queries/refresh-tokens'
import { hasPermission, isAdmin } from '@/lib/auth/authorization'
import { permissionCache } from '@/lib/permissions-cache'
import { z } from 'zod'

const changeRoleSchema = z.object({
  role: z.string().min(1),
  reason: z.string().optional(),
})

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  return withAuth(request, async (user) => {
    try {
      const canManage = await hasPermission(user, 'employees.manage')
      if (!canManage || !isAdmin(user)) {
        return NextResponse.json(
          { error: 'Only admin can assign roles' },
          { status: 403 }
        )
      }

      const body = await request.json()
      const validated = changeRoleSchema.parse(body)

      // Check if changing own role (not allowed)
      if (params.id === user.userId) {
        return NextResponse.json(
          { error: 'Cannot change your own role' },
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

      // Verify role exists
      const role = await getRoleByKey(validated.role)
      if (!role) {
        return NextResponse.json(
          { error: 'Role not found' },
          { status: 404 }
        )
      }

      // Prevent demoting admin unless admin
      if (targetUser.role === 'admin' && !isAdmin(user)) {
        return NextResponse.json(
          { error: 'Only admin can demote other admins' },
          { status: 403 }
        )
      }

      if (validated.role === 'admin' && !isAdmin(user)) {
        return NextResponse.json(
          { error: 'Only admin can promote users to admin' },
          { status: 403 }
        )
      }

      // Change role
      await changeUserRole(params.id, validated.role, user.userId, validated.reason)

      // Revoke all refresh tokens (force re-login)
      await revokeAllUserTokens(params.id, user.userId)

      // Invalidate permission cache
      permissionCache.invalidate(params.id)

      return NextResponse.json({
        message: 'Role updated successfully',
        data: {
          userId: params.id,
          newRole: validated.role,
        },
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Validation error', details: error.errors },
          { status: 400 }
        )
      }

      console.error('Change user role error:', error)
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Internal server error' },
        { status: error instanceof Error && error.message.includes('not found') ? 404 : 500 }
      )
    }
  })
}
