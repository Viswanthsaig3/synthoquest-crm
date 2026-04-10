import { NextRequest, NextResponse } from 'next/server'
import { verifyAccessToken } from './lib/auth/jwt'

const PUBLIC_PATHS = ['/login', '/forgot-password', '/reset-password']

const AUTH_API_PATHS = ['/api/auth/login', '/api/auth/refresh', '/api/auth/logout']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname.startsWith('/api/')) {
    if (AUTH_API_PATHS.some(path => pathname === path)) {
      return NextResponse.next()
    }

    // SECURITY: CRIT-03 — Verify JWT for all non-auth API routes (defense-in-depth).
    // Individual route handlers still call withAuth() for permission context,
    // but this prevents ANY unauthenticated request from reaching a handler.
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    try {
      await verifyAccessToken(token)
      return NextResponse.next()
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  if (pathname.startsWith('/_next') || 
      pathname.startsWith('/static') || 
      pathname.includes('.') ||
      pathname === '/favicon.ico') {
    return NextResponse.next()
  }

  if (PUBLIC_PATHS.some(path => pathname.startsWith(path))) {
    return NextResponse.next()
  }

  const refreshToken = request.cookies.get('refreshToken')
  
  if (!refreshToken) {
    const loginUrl = new URL('/login', request.url)
    if (pathname !== '/') {
      loginUrl.searchParams.set('redirect', pathname)
    }
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public|api/auth).*)',
  ],
}