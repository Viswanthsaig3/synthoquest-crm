import { createAdminClient } from '../server-client'
import type { RefreshToken } from '@/types/auth'

export async function createRefreshToken(token: {
  userId: string
  tokenHash: string
  expiresAt: string
  familyId?: string // SECURITY: HIGH-04 — token family for reuse detection
}): Promise<RefreshToken> {
  const supabase = await createAdminClient()
  
  const insertData: Record<string, unknown> = {
    user_id: token.userId,
    token_hash: token.tokenHash,
    expires_at: token.expiresAt,
  }

  // If familyId provided (token rotation), use it. Otherwise DB generates a new one.
  if (token.familyId) {
    insertData.family_id = token.familyId
  }

  const { data, error } = await supabase
    .from('refresh_tokens')
    .insert(insertData)
    .select()
    .single()

  if (error) throw error
  return {
    id: data.id,
    userId: data.user_id,
    tokenHash: data.token_hash,
    expiresAt: data.expires_at,
    createdAt: data.created_at,
    revokedAt: data.revoked_at,
    revokedBy: data.revoked_by,
    familyId: data.family_id,
  }
}

export async function getRefreshTokenByHash(tokenHash: string): Promise<RefreshToken | null> {
  const supabase = await createAdminClient()
  
  const { data, error } = await supabase
    .from('refresh_tokens')
    .select('*')
    .eq('token_hash', tokenHash)
    .is('revoked_at', null)
    .gt('expires_at', new Date().toISOString())
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }

  return {
    id: data.id,
    userId: data.user_id,
    tokenHash: data.token_hash,
    expiresAt: data.expires_at,
    createdAt: data.created_at,
    revokedAt: data.revoked_at,
    revokedBy: data.revoked_by,
    familyId: data.family_id,
  }
}

/**
 * SECURITY: HIGH-04 — Check if a token hash exists (even if revoked).
 * Used for token reuse detection: if a revoked token is replayed,
 * we know the family is compromised.
 */
export async function getAnyTokenByHash(tokenHash: string): Promise<RefreshToken | null> {
  const supabase = await createAdminClient()
  
  const { data, error } = await supabase
    .from('refresh_tokens')
    .select('*')
    .eq('token_hash', tokenHash)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }

  return {
    id: data.id,
    userId: data.user_id,
    tokenHash: data.token_hash,
    expiresAt: data.expires_at,
    createdAt: data.created_at,
    revokedAt: data.revoked_at,
    revokedBy: data.revoked_by,
    familyId: data.family_id,
  }
}

export async function revokeRefreshToken(id: string): Promise<void> {
  const supabase = await createAdminClient()
  
  const { error } = await supabase
    .from('refresh_tokens')
    .update({
      revoked_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) throw error
}

/**
 * SECURITY: HIGH-04 — Revoke ALL tokens in a family.
 * Called when a revoked token is replayed (indicates the family is compromised).
 */
export async function revokeTokenFamily(familyId: string): Promise<number> {
  const supabase = await createAdminClient()
  
  const { error } = await supabase.rpc('revoke_token_family', {
    p_family_id: familyId,
  })

  if (error) {
    console.error('Failed to revoke token family:', error)
    throw error
  }

  // Also revoke via application layer as backup
  const { data, error: updateError } = await supabase
    .from('refresh_tokens')
    .update({ revoked_at: new Date().toISOString() })
    .eq('family_id', familyId)
    .is('revoked_at', null)
    .select('id')

  if (updateError) throw updateError
  return data?.length || 0
}

export async function revokeAllUserTokens(userId: string, revokedBy?: string): Promise<void> {
  const supabase = await createAdminClient()
  
  const { error } = await supabase
    .from('refresh_tokens')
    .update({
      revoked_at: new Date().toISOString(),
      revoked_by: revokedBy,
    })
    .eq('user_id', userId)
    .is('revoked_at', null)

  if (error) throw error
}

export async function cleanupExpiredTokens(): Promise<void> {
  const supabase = await createAdminClient()
  
  const { error } = await supabase.rpc('cleanup_expired_tokens')
  
  if (error && error.code !== '42883') {
    console.error('Error cleaning up tokens:', error)
  }
}
