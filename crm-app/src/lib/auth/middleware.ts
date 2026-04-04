import { NextRequest, NextResponse } from 'next/server'
import { verifyAccessToken } from './jwt'
import { createAdminClient } from '@/lib/db/server-client'

export interface AuthenticatedUser {
  userId: string
  email: string
  role: string
}

export type AuthHandler = (user: AuthenticatedUser, request: NextRequest) => Promise<NextResponse>

export async function withAuth(request: NextRequest, handler: AuthHandler): Promise<NextResponse> {
  const authHeader = request.headers.get('authorization')
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json(
      { error: 'Unauthorized', code: 'MISSING_TOKEN' },
      { status: 401 }
    )
  }

  const token = authHeader.substring(7)
  const payload = await verifyAccessToken(token)

  if (!payload) {
    return NextResponse.json(
      { error: 'Invalid or expired token', code: 'INVALID_TOKEN' },
      { status: 401 }
    )
  }

  const supabase = await createAdminClient()
  
  const { data: user, error } = await supabase
    .from('users')
    .select('id, email, role, status')
    .eq('id', payload.userId)
    .is('deleted_at', null)
    .single()

  if (error || !user) {
    return NextResponse.json(
      { error: 'User not found', code: 'USER_NOT_FOUND' },
      { status: 401 }
    )
  }

  if (user.status !== 'active') {
    return NextResponse.json(
      { error: 'Account is not active', code: 'ACCOUNT_INACTIVE' },
      { status: 403 }
    )
  }

  const authUser: AuthenticatedUser = {
    userId: user.id,
    email: user.email,
    role: user.role,
  }

  try {
    return await handler(authUser, request)
  } catch (error) {
    console.error('Auth handler error:', error)
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}

export async function getUserFromToken(token: string): Promise<AuthenticatedUser | null> {
  const payload = await verifyAccessToken(token)
  
  if (!payload) {
    return null
  }

  const supabase = await createAdminClient()
  
  const { data: user, error } = await supabase
    .from('users')
    .select('id, email, role, status')
    .eq('id', payload.userId)
    .is('deleted_at', null)
    .single()

  if (error || !user || user.status !== 'active') {
    return null
  }

  return {
    userId: user.id,
    email: user.email,
    role: user.role,
  }
}
