import { SignJWT, jwtVerify } from 'jose'
import { getServerEnv } from '@/lib/env'

const env = getServerEnv()
const JWT_SECRET = new TextEncoder().encode(env.JWT_SECRET)
const JWT_REFRESH_SECRET = new TextEncoder().encode(env.JWT_REFRESH_SECRET)

export interface JWTPayload {
  userId: string
  email: string
  role: string
  iat?: number
  exp?: number
}

export interface RefreshTokenPayload {
  userId: string
  tokenId: string
  email?: string
  role?: string
  iat?: number
  exp?: number
}

export async function generateAccessToken(payload: JWTPayload): Promise<string> {
  const iat = Math.floor(Date.now() / 1000)
  const exp = iat + 4 * 60 * 60 // 4 hours (refresh cookie still renews session)

  return new SignJWT({
    userId: payload.userId,
    email: payload.email,
    role: payload.role,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt(iat)
    .setExpirationTime(exp)
    .sign(JWT_SECRET)
}

export async function generateRefreshToken(payload: RefreshTokenPayload): Promise<string> {
  const iat = Math.floor(Date.now() / 1000)
  const exp = iat + 7 * 24 * 60 * 60 // 7 days

  return new SignJWT({
    userId: payload.userId,
    tokenId: payload.tokenId,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt(iat)
    .setExpirationTime(exp)
    .sign(JWT_REFRESH_SECRET)
}

export async function verifyAccessToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as unknown as JWTPayload
  } catch {
    return null
  }
}

export async function verifyRefreshToken(token: string): Promise<RefreshTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_REFRESH_SECRET)
    return payload as unknown as RefreshTokenPayload
  } catch {
    return null
  }
}
