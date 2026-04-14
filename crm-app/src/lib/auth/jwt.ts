import { SignJWT, jwtVerify } from 'jose'

function getJwtSecrets() {
  const JWT_SECRET = process.env.JWT_SECRET
  const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET
  
  if (!JWT_SECRET || !JWT_REFRESH_SECRET) {
    throw new Error('Missing JWT_SECRET or JWT_REFRESH_SECRET environment variables')
  }
  
  return {
    access: new TextEncoder().encode(JWT_SECRET),
    refresh: new TextEncoder().encode(JWT_REFRESH_SECRET),
  }
}

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
  const secrets = getJwtSecrets()
  const iat = Math.floor(Date.now() / 1000)
  const exp = iat + 4 * 60 * 60

  return new SignJWT({
    userId: payload.userId,
    email: payload.email,
    role: payload.role,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt(iat)
    .setExpirationTime(exp)
    .sign(secrets.access)
}

export async function generateRefreshToken(payload: RefreshTokenPayload): Promise<string> {
  const secrets = getJwtSecrets()
  const iat = Math.floor(Date.now() / 1000)
  const exp = iat + 7 * 24 * 60 * 60

  return new SignJWT({
    userId: payload.userId,
    tokenId: payload.tokenId,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt(iat)
    .setExpirationTime(exp)
    .sign(secrets.refresh)
}

export async function verifyAccessToken(token: string): Promise<JWTPayload | null> {
  try {
    const secrets = getJwtSecrets()
    const { payload } = await jwtVerify(token, secrets.access)
    return payload as unknown as JWTPayload
  } catch {
    return null
  }
}

export async function verifyRefreshToken(token: string): Promise<RefreshTokenPayload | null> {
  try {
    const secrets = getJwtSecrets()
    const { payload } = await jwtVerify(token, secrets.refresh)
    return payload as unknown as RefreshTokenPayload
  } catch {
    return null
  }
}
