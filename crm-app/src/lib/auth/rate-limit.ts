import { LRUCache } from 'lru-cache'

interface RateLimitEntry {
  attempts: number
  lockedUntil: number | null
}

const loginAttempts = new LRUCache<string, RateLimitEntry>({
  max: 10000,
  ttl: 15 * 60 * 1000, // 15 minutes
})

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number | null
  locked: boolean
}

export function checkLoginRateLimit(ip: string): RateLimitResult {
  const now = Date.now()
  const entry = loginAttempts.get(ip)

  if (!entry) {
    loginAttempts.set(ip, { attempts: 1, lockedUntil: null })
    return {
      allowed: true,
      remaining: 4,
      resetAt: now + 15 * 60 * 1000,
      locked: false,
    }
  }

  if (entry.lockedUntil && now < entry.lockedUntil) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.lockedUntil,
      locked: true,
    }
  }

  if (entry.attempts >= 10) {
    const lockedUntil = now + 30 * 60 * 1000 // 30 minutes lockout
    loginAttempts.set(ip, { attempts: entry.attempts + 1, lockedUntil })
    return {
      allowed: false,
      remaining: 0,
      resetAt: lockedUntil,
      locked: true,
    }
  }

  const newAttempts = entry.attempts + 1
  loginAttempts.set(ip, { attempts: newAttempts, lockedUntil: null })

  return {
    allowed: true,
    remaining: Math.max(0, 5 - newAttempts),
    resetAt: now + 15 * 60 * 1000,
    locked: false,
  }
}

export function resetLoginAttempts(ip: string): void {
  loginAttempts.delete(ip)
}

export function getLoginAttempts(ip: string): number {
  const entry = loginAttempts.get(ip)
  return entry?.attempts || 0
}
