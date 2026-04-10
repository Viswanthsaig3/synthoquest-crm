import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/middleware'
import { getUserById, updateUserPassword } from '@/lib/db/queries/users'
import { revokeAllUserTokens } from '@/lib/db/queries/refresh-tokens'
import { hashPassword, verifyPassword, validatePasswordStrength } from '@/lib/auth/password'
import { hasPermission } from '@/lib/auth/authorization'
import { z } from 'zod'

const changePasswordSchema = z.object({
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
})

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  return withAuth(request, async (user) => {
    try {
      const employee = await getUserById(params.id)

      if (!employee) {
        return NextResponse.json(
          { error: 'Employee not found' },
          { status: 404 }
        )
      }

      const isOwnProfile = employee.id === user.userId
      const canManage = await hasPermission(user, 'employees.manage')

      if (!isOwnProfile && !canManage) {
        return NextResponse.json(
          { error: 'Forbidden' },
          { status: 403 }
        )
      }

      const body = await request.json()
      const validated = changePasswordSchema.parse(body)

      if (isOwnProfile && !canManage) {
        if (!validated.currentPassword) {
          return NextResponse.json(
            { error: 'Current password is required' },
            { status: 400 }
          )
        }

        const passwordValid = employee.password_hash 
          ? await verifyPassword(validated.currentPassword, employee.password_hash)
          : false
        
        if (!passwordValid) {
          return NextResponse.json(
            { error: 'Current password is incorrect' },
            { status: 401 }
          )
        }
      }

      const passwordValidation = validatePasswordStrength(validated.newPassword)
      
      if (!passwordValidation.valid) {
        return NextResponse.json(
          { error: 'Password does not meet requirements', details: passwordValidation.errors },
          { status: 400 }
        )
      }

      const newPasswordHash = await hashPassword(validated.newPassword)

      await updateUserPassword(params.id, newPasswordHash)

      await revokeAllUserTokens(params.id, user.userId)

      return NextResponse.json({
        message: 'Password updated successfully',
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Validation error', details: error.errors },
          { status: 400 }
        )
      }

      console.error('Change password error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  })
}
