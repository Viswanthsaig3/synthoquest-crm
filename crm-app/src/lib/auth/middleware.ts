import { NextRequest, NextResponse } from 'next/server'
import { verifyAccessToken } from './jwt'
import { createAdminClient } from '@/lib/db/server-client'
import { getCorrelationIdFromHeaders, CORRELATION_ID_HEADER, formatLogMessage } from '@/lib/correlation'

export interface AuthenticatedUser {
  userId: string
  email: string
  role: string
  updatedAt: string
  correlationId?: string
}

export type AuthHandler = (user: AuthenticatedUser, request: NextRequest) => Promise<NextResponse>

export async function withAuth(request: NextRequest, handler: AuthHandler): Promise<NextResponse> {
  const correlationId = getCorrelationIdFromHeaders(request.headers) || 'unknown'
  
  const authHeader = request.headers.get('authorization')
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json(
      { error: 'Unauthorized', code: 'MISSING_TOKEN', correlationId },
      { status: 401, headers: { [CORRELATION_ID_HEADER]: correlationId } }
    )
  }

  const token = authHeader.substring(7)
  const payload = await verifyAccessToken(token)

  if (!payload) {
    return NextResponse.json(
      { error: 'Invalid or expired token', code: 'INVALID_TOKEN', correlationId },
      { status: 401, headers: { [CORRELATION_ID_HEADER]: correlationId } }
    )
  }

  const supabase = await createAdminClient()
  
  const { data: user, error } = await supabase
    .from('users')
    .select('id, email, role, status, updated_at')
    .eq('id', payload.userId)
    .is('deleted_at', null)
    .single()

  if (error || !user) {
    return NextResponse.json(
      { error: 'User not found', code: 'USER_NOT_FOUND', correlationId },
      { status: 401, headers: { [CORRELATION_ID_HEADER]: correlationId } }
    )
  }

  if (user.status !== 'active') {
    return NextResponse.json(
      { error: 'Account is not active', code: 'ACCOUNT_INACTIVE', correlationId },
      { status: 403, headers: { [CORRELATION_ID_HEADER]: correlationId } }
    )
  }

  const authUser: AuthenticatedUser = {
    userId: user.id,
    email: user.email,
    role: user.role,
    updatedAt: user.updated_at,
    correlationId,
  }

  try {
    const response = await handler(authUser, request)
    response.headers.set(CORRELATION_ID_HEADER, correlationId)
    return response
  } catch (error) {
    console.error(formatLogMessage(correlationId, 'Auth handler error:'), error)
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR', correlationId },
      { status: 500, headers: { [CORRELATION_ID_HEADER]: correlationId } }
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
    .select('id, email, role, status, updated_at')
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
    updatedAt: user.updated_at,
  }
}