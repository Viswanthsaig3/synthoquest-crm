/**
 * SECURITY: CRIT-07 — Database-backed login rate limiting.
 *
 * Replaces the previous in-memory LRUCache implementation which was
 * per-process and reset on every serverless cold start.
 *
 * Uses Supabase RPCs for atomic check-and-increment, ensuring rate
 * limits persist across deployments and scale across instances.
 */
import { createAdminClient } from '@/lib/db/client'

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number | null
  locked: boolean
}

export async function checkLoginRateLimit(ip: string): Promise<RateLimitResult> {
  try {
    const supabase = await createAdminClient()
    const { data, error } = await supabase.rpc('check_login_rate_limit', {
      p_ip: ip,
    })

    if (error) {
      console.error('Rate limit check failed, failing open:', error)
      // Fail-open: allow login if rate limit check fails
      return { allowed: true, remaining: 5, resetAt: null, locked: false }
    }

    const row = Array.isArray(data) ? data[0] : data
    if (!row) {
      return { allowed: true, remaining: 5, resetAt: null, locked: false }
    }

    const locked = !row.allowed
    return {
      allowed: row.allowed,
      remaining: Math.max(0, 10 - row.attempts_count),
      resetAt: row.locked_until_ts ? new Date(row.locked_until_ts).getTime() : null,
      locked,
    }
  } catch (err) {
    console.error('Rate limit check error, failing open:', err)
    // Fail-open on unexpected errors to avoid blocking all logins
    return { allowed: true, remaining: 5, resetAt: null, locked: false }
  }
}

export async function resetLoginAttempts(ip: string): Promise<void> {
  try {
    const supabase = await createAdminClient()
    await supabase.rpc('reset_login_rate_limit', { p_ip: ip })
  } catch (err) {
    console.error('Failed to reset login attempts:', err)
  }
}

/** @deprecated No longer used with DB-backed rate limiting. Kept for API compat. */
export function getLoginAttempts(_ip: string): number {
  return 0
}
