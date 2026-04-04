import { createAdminClient } from '../server-client'
import type { RefreshToken } from '@/types/auth'

export async function createRefreshToken(token: {
  userId: string
  tokenHash: string
  expiresAt: string
}): Promise<RefreshToken> {
  const supabase = await createAdminClient()
  
  const { data, error } = await supabase
    .from('refresh_tokens')
    .insert({
      user_id: token.userId,
      token_hash: token.tokenHash,
      expires_at: token.expiresAt,
    })
    .select()
    .single()

  if (error) throw error
  return data as RefreshToken
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

  return data as RefreshToken
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
