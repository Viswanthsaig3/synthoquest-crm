/**
 * SECURITY: CRIT-07 — Database-backed login rate limiting.
 *
 * Replaces the previous in-memory LRUCache implementation which was
 * per-process and reset on every serverless cold start.
 *
 * Uses Supabase RPCs for atomic check-and-increment, ensuring rate
 * limits persist across deployments and scale across instances.
 */
import { createAdminClient } from '@/lib/db/server-client'

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
      console.error('Rate limit check failed, failing closed for security:', error)
      return { allowed: false, remaining: 0, resetAt: Date.now() + 60000, locked: true }
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
    console.error('Rate limit check error, failing closed for security:', err)
    return { allowed: false, remaining: 0, resetAt: Date.now() + 60000, locked: true }
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

export interface ApiRateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number | null
  locked: boolean
}

export async function checkRefreshRateLimit(userId: string): Promise<ApiRateLimitResult> {
  try {
    const supabase = await createAdminClient()
    const { data, error } = await supabase.rpc('check_api_rate_limit', {
      p_key: 'refresh_token',
      p_identifier: userId,
      p_max_attempts: 5,
      p_window_seconds: 60,
      p_lockout_seconds: 300,
    })

    if (error) {
      console.error('Refresh rate limit check failed, failing closed:', error)
      return { allowed: false, remaining: 0, resetAt: Date.now() + 300000, locked: true }
    }

    const row = Array.isArray(data) ? data[0] : data
    if (!row) {
      return { allowed: true, remaining: 5, resetAt: null, locked: false }
    }

    return {
      allowed: row.allowed,
      remaining: Math.max(0, row.remaining),
      resetAt: row.reset_at_ts ? new Date(row.reset_at_ts).getTime() : null,
      locked: !row.allowed,
    }
  } catch (err) {
    console.error('Refresh rate limit check error, failing closed:', err)
    return { allowed: false, remaining: 0, resetAt: Date.now() + 300000, locked: true }
  }
}

export async function checkPayrollRateLimit(userId: string): Promise<ApiRateLimitResult> {
  try {
    const supabase = await createAdminClient()
    const { data, error } = await supabase.rpc('check_api_rate_limit', {
      p_key: 'payroll_run',
      p_identifier: userId,
      p_max_attempts: 3,
      p_window_seconds: 3600,
      p_lockout_seconds: 3600,
    })

    if (error) {
      console.error('Payroll rate limit check failed, failing closed:', error)
      return { allowed: false, remaining: 0, resetAt: Date.now() + 3600000, locked: true }
    }

    const row = Array.isArray(data) ? data[0] : data
    if (!row) {
      return { allowed: true, remaining: 3, resetAt: null, locked: false }
    }

    return {
      allowed: row.allowed,
      remaining: Math.max(0, row.remaining),
      resetAt: row.reset_at_ts ? new Date(row.reset_at_ts).getTime() : null,
      locked: !row.allowed,
    }
  } catch (err) {
    console.error('Payroll rate limit check error, failing closed:', err)
    return { allowed: false, remaining: 0, resetAt: Date.now() + 3600000, locked: true }
  }
}

/** @deprecated No longer used with DB-backed rate limiting. Kept for API compat. */
export function getLoginAttempts(_ip: string): number {
  return 0
}
