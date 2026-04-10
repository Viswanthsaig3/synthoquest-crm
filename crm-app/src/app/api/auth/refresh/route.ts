import { NextRequest, NextResponse } from 'next/server'
import { verifyRefreshToken, generateAccessToken, generateRefreshToken } from '@/lib/auth/jwt'
import { getRefreshTokenByHash, getAnyTokenByHash, createRefreshToken, revokeRefreshToken, revokeTokenFamily } from '@/lib/db/queries/refresh-tokens'
import { createAdminClient } from '@/lib/db/server-client'
import { createHash } from 'crypto'

export async function POST(request: NextRequest) {
  // SECURITY: CRIT-09 — CSRF protection: require custom header.
  // Browsers prevent forms from setting custom headers, blocking
  // cross-origin form-based CSRF attacks on this cookie-based endpoint.
  const xRequestedWith = request.headers.get('x-requested-with')
  if (xRequestedWith !== 'XMLHttpRequest') {
    return NextResponse.json(
      { error: 'Forbidden: missing CSRF header', code: 'CSRF_PROTECTION' },
      { status: 403 }
    )
  }

  try {
    const refreshTokenString = request.cookies.get('refreshToken')?.value?.trim() ?? ''

    if (!refreshTokenString) {
      return NextResponse.json(
        { error: 'Refresh token required', code: 'MISSING_TOKEN' },
        { status: 401 }
      )
    }

    const payload = await verifyRefreshToken(refreshTokenString)

    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid or expired refresh token', code: 'INVALID_TOKEN' },
        { status: 401 }
      )
    }

    const tokenHash = createHash('sha256')
      .update(refreshTokenString)
      .digest('hex')

    const existingToken = await getRefreshTokenByHash(tokenHash)

    if (!existingToken) {
      // SECURITY: HIGH-04 — Token reuse detection.
      // The token is valid (JWT signature OK) but not in DB as active.
      // Check if it's a REVOKED token — this means an attacker is replaying it.
      const revokedToken = await getAnyTokenByHash(tokenHash)
      
      if (revokedToken && revokedToken.revokedAt && revokedToken.familyId) {
        // CRITICAL: Token was already used and revoked, but someone is replaying it.
        // This indicates the token family is compromised. Kill the entire family.
        console.error(
          `SECURITY ALERT: Refresh token reuse detected for user ${revokedToken.userId}. ` +
          `Family ${revokedToken.familyId} compromised. Revoking all tokens in family.`
        )
        await revokeTokenFamily(revokedToken.familyId)
      }

      return NextResponse.json(
        { error: 'Token has been revoked or expired', code: 'TOKEN_REVOKED' },
        { status: 401 }
      )
    }

    // Revoke the current token (standard rotation)
    await revokeRefreshToken(existingToken.id)

    // SECURITY: MED-07 fix — Fetch current user from DB for fresh email/role
    // instead of using stale payload data
    const supabase = await createAdminClient()
    const { data: currentUser } = await supabase
      .from('users')
      .select('email, role, status')
      .eq('id', payload.userId)
      .is('deleted_at', null)
      .single()

    if (!currentUser || currentUser.status !== 'active') {
      // User was deactivated since token was issued — kill the family
      if (existingToken.familyId) {
        await revokeTokenFamily(existingToken.familyId)
      }
      return NextResponse.json(
        { error: 'Account is not active', code: 'ACCOUNT_INACTIVE' },
        { status: 403 }
      )
    }

    const newAccessToken = await generateAccessToken({
      userId: payload.userId,
      email: currentUser.email,   // Fresh from DB
      role: currentUser.role,     // Fresh from DB
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

    // SECURITY: HIGH-04 — Preserve family_id during rotation
    await createRefreshToken({
      userId: payload.userId,
      tokenHash: newRefreshTokenHash,
      expiresAt,
      familyId: existingToken.familyId || undefined,
    })

    const response = NextResponse.json({
      data: {
        accessToken: newAccessToken,
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
    console.error('Refresh error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
