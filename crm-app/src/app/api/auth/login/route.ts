import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getUserByEmail } from '@/lib/db/queries/users'
import { createLoginLog } from '@/lib/db/queries/login-logs'
import { createRefreshToken as createRefreshTokenRecord } from '@/lib/db/queries/refresh-tokens'
import { verifyPassword } from '@/lib/auth/password'
import { generateAccessToken, generateRefreshToken } from '@/lib/auth/jwt'
import { getIPLocation, getClientIP } from '@/lib/auth/ip-geolocation'
import { checkLoginRateLimit, resetLoginAttempts } from '@/lib/auth/rate-limit'
import { createHash } from 'crypto'

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

export async function POST(request: NextRequest) {
  try {
    const clientIP = getClientIP(request)
    
    const rateLimit = checkLoginRateLimit(clientIP)
    
    if (!rateLimit.allowed) {
      const remainingTime = rateLimit.resetAt 
        ? Math.ceil((rateLimit.resetAt - Date.now()) / 1000 / 60)
        : 30
      
      return NextResponse.json(
        { 
          error: 'Too many login attempts. Please try again later.',
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter: remainingTime,
        },
        { status: 429 }
      )
    }

    const body = await request.json()
    const validated = loginSchema.parse(body)

    const user = await getUserByEmail(validated.email)

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password', code: 'INVALID_CREDENTIALS' },
        { status: 401 }
      )
    }

    if (!user.password_hash) {
      return NextResponse.json(
        { error: 'Invalid email or password', code: 'INVALID_CREDENTIALS' },
        { status: 401 }
      )
    }

    const passwordValid = await verifyPassword(validated.password, user.password_hash)
    
    if (!passwordValid) {
      return NextResponse.json(
        { error: 'Invalid email or password', code: 'INVALID_CREDENTIALS' },
        { status: 401 }
      )
    }

    if (user.status !== 'active') {
      const statusMessages = {
        inactive: 'Your account is inactive. Please contact HR.',
        suspended: 'Your account is suspended. Please contact HR.',
      }
      
      return NextResponse.json(
        { 
          error: statusMessages[user.status as keyof typeof statusMessages] || 'Account not active',
          code: 'ACCOUNT_INACTIVE',
        },
        { status: 403 }
      )
    }

    const location = await getIPLocation(clientIP)

    const userAgent = request.headers.get('user-agent') || ''

    const accessToken = await generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    })

    const tokenId = createHash('sha256')
      .update(`${user.id}-${Date.now()}-${Math.random()}`)
      .digest('hex')

    const refreshToken = await generateRefreshToken({
      userId: user.id,
      tokenId,
    })

    const refreshTokenHash = createHash('sha256')
      .update(refreshToken)
      .digest('hex')

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

    await createRefreshTokenRecord({
      userId: user.id,
      tokenHash: refreshTokenHash,
      expiresAt,
    })

    await createLoginLog({
      userId: user.id,
      ipAddress: clientIP,
      latitude: location?.latitude ?? null,
      longitude: location?.longitude ?? null,
      city: location?.city || 'Unknown',
      region: location?.region || 'Unknown',
      country: location?.country || 'Unknown',
      userAgent,
    })

    const userResponse = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      department: user.department,
      phone: user.phone,
      avatar: user.avatar,
      status: user.status,
    }

    const response = NextResponse.json({
      data: {
        user: userResponse,
        accessToken,
      },
    })

    response.cookies.set('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    })

    resetLoginAttempts(clientIP)

    return response
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
