import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { verifyRefreshToken, generateAccessToken, generateRefreshToken } from '@/lib/auth/jwt'
import { getRefreshTokenByHash, createRefreshToken, revokeRefreshToken } from '@/lib/db/queries/refresh-tokens'
import { createHash } from 'crypto'

const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validated = refreshSchema.parse(body)

    const payload = await verifyRefreshToken(validated.refreshToken)

    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid or expired refresh token', code: 'INVALID_TOKEN' },
        { status: 401 }
      )
    }

    const tokenHash = createHash('sha256')
      .update(validated.refreshToken)
      .digest('hex')

    const existingToken = await getRefreshTokenByHash(tokenHash)

    if (!existingToken) {
      return NextResponse.json(
        { error: 'Token has been revoked or expired', code: 'TOKEN_REVOKED' },
        { status: 401 }
      )
    }

    await revokeRefreshToken(existingToken.id)

    const newAccessToken = await generateAccessToken({
      userId: payload.userId,
      email: payload.email || 'user@example.com',
      role: payload.role || 'employee',
    })

    const newTokenId = createHash('sha256')
      .update(`${payload.userId}-${Date.now()}-${Math.random()}`)
      .digest('hex')

    const newRefreshToken = await generateRefreshToken({
      userId: payload.userId,
      tokenId: newTokenId,
    })

    const newRefreshTokenHash = createHash('sha256')
      .update(newRefreshToken)
      .digest('hex')

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

    await createRefreshToken({
      userId: payload.userId,
      tokenHash: newRefreshTokenHash,
      expiresAt,
    })

    const response = NextResponse.json({
      data: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      },
    })

    response.cookies.set('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    })

    return response
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Refresh error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
