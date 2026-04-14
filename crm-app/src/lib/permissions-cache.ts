/**
 * SECURITY: CRIT-05 — Permission cache with role/status staleness detection.
 * 
 * TTL reduced from 5 minutes → 60 seconds.
 * Stores the user's role and updated_at alongside permissions.
 * If the user's role or updated_at changed since cache was set, the cache
 * entry is invalidated immediately — no waiting for TTL.
 * 
 * SERVERLESS: In serverless environments (Vercel, AWS Lambda), set
 * DISABLE_PERMISSION_CACHE=true to bypass the in-memory cache.
 * Each instance has its own memory, so the cache won't be consistent
 * across instances.
 */

const DISABLE_CACHE = process.env.DISABLE_PERMISSION_CACHE === 'true'

class PermissionCache {
  private cache: Map<string, {
    permissions: string[]
    role: string
    userUpdatedAt: string
    timestamp: number
  }>
  private ttl: number = 60 * 1000
  private cleanupInterval: NodeJS.Timeout | null = null

  constructor() {
    this.cache = new Map()
  }

  set(userId: string, permissions: string[], role: string, userUpdatedAt: string): void {
    if (DISABLE_CACHE) return
    this.cache.set(userId, {
      permissions,
      role,
      userUpdatedAt,
      timestamp: Date.now(),
    })
  }

  get(userId: string, currentRole?: string, currentUpdatedAt?: string): string[] | null {
    if (DISABLE_CACHE) return null
    
    const cached = this.cache.get(userId)
    
    if (!cached) {
      return null
    }

    const age = Date.now() - cached.timestamp
    if (age > this.ttl) {
      this.cache.delete(userId)
      return null
    }

    if (currentRole && cached.role !== currentRole) {
      this.cache.delete(userId)
      return null
    }
    if (currentUpdatedAt && cached.userUpdatedAt !== currentUpdatedAt) {
      this.cache.delete(userId)
      return null
    }

    return cached.permissions
  }

  invalidate(userId: string): void {
    this.cache.delete(userId)
  }

  invalidateAll(): void {
    this.cache.clear()
  }

  cleanup(): void {
    const now = Date.now()
    const entriesToDelete: string[] = []
    
    this.cache.forEach((data, userId) => {
      if (now - data.timestamp > this.ttl) {
        entriesToDelete.push(userId)
      }
    })
    
    entriesToDelete.forEach(userId => this.cache.delete(userId))
  }

  startCleanupInterval(): void {
    if (DISABLE_CACHE || this.cleanupInterval) return
    this.cleanupInterval = setInterval(() => {
      this.cleanup()
    }, 5 * 60 * 1000)
  }

  stopCleanupInterval(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
  }
}

export const permissionCache = new PermissionCache()

if (typeof global !== 'undefined' && !DISABLE_CACHE) {
  permissionCache.startCleanupInterval()
}