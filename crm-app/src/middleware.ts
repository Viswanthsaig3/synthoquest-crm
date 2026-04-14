import { NextRequest, NextResponse } from 'next/server'
import { verifyAccessToken } from './lib/auth/jwt'
import { generateCorrelationId, getCorrelationIdFromHeaders, CORRELATION_ID_HEADER } from './lib/correlation'

const PUBLIC_PATHS = ['/login', '/forgot-password', '/reset-password']

const AUTH_API_PATHS = ['/api/auth/login', '/api/auth/refresh', '/api/auth/logout', '/api/health']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  const correlationId = getCorrelationIdFromHeaders(request.headers) || generateCorrelationId()

  console.log('[MIDDLEWARE] Processing:', pathname)

  if (pathname.startsWith('/api/')) {
    const response = NextResponse.next()
    response.headers.set(CORRELATION_ID_HEADER, correlationId)
    
    if (AUTH_API_PATHS.some(path => pathname === path)) {
      console.log('[MIDDLEWARE] Auth API path, skipping token check')
      return response
    }

    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      console.log('[MIDDLEWARE] No Bearer token for API path:', pathname)
      return NextResponse.json(
        { error: 'Unauthorized', correlationId },
        { status: 401, headers: { [CORRELATION_ID_HEADER]: correlationId } }
      )
    }

    const token = authHeader.substring(7)
    try {
      console.log('[MIDDLEWARE] Verifying token for:', pathname)
      await verifyAccessToken(token)
      console.log('[MIDDLEWARE] Token verified for:', pathname)
      return response
    } catch (err) {
      console.error('[MIDDLEWARE] Token verification failed:', err)
      return NextResponse.json(
        { error: 'Unauthorized', correlationId },
        { status: 401, headers: { [CORRELATION_ID_HEADER]: correlationId } }
      )
    }
  }

  if (pathname.startsWith('/_next') || 
      pathname.startsWith('/static') || 
      pathname.includes('.') ||
      pathname === '/favicon.ico') {
    console.log('[MIDDLEWARE] Static/Next path, skipping:', pathname)
    return NextResponse.next()
  }

  if (PUBLIC_PATHS.some(path => pathname.startsWith(path))) {
    console.log('[MIDDLEWARE] Public path, skipping:', pathname)
    return NextResponse.next()
  }

  const refreshToken = request.cookies.get('refreshToken')
  
  if (!refreshToken) {
    console.log('[MIDDLEWARE] No refresh token, redirecting to login from:', pathname)
    const loginUrl = new URL('/login', request.url)
    if (pathname !== '/') {
      loginUrl.searchParams.set('redirect', pathname)
    }
    return NextResponse.redirect(loginUrl)
  }

  console.log('[MIDDLEWARE] Has refresh token, allowing:', pathname)
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public|api/auth).*)',
  ],
}