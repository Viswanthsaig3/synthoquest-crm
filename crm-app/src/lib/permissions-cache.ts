/**
 * SECURITY: CRIT-05 — Permission cache with role/status staleness detection.
 * 
 * TTL reduced from 5 minutes → 60 seconds.
 * Stores the user's role and updated_at alongside permissions.
 * If the user's role or updated_at changed since cache was set, the cache
 * entry is invalidated immediately — no waiting for TTL.
 */
class PermissionCache {
  private cache: Map<string, {
    permissions: string[]
    role: string
    userUpdatedAt: string
    timestamp: number
  }>
  // SECURITY: Reduced from 5 min → 60 sec to limit stale permission window
  private ttl: number = 60 * 1000 // 60 seconds

  constructor() {
    this.cache = new Map()
  }

  set(userId: string, permissions: string[], role: string, userUpdatedAt: string): void {
    this.cache.set(userId, {
      permissions,
      role,
      userUpdatedAt,
      timestamp: Date.now(),
    })
  }

  /**
   * Get cached permissions. Returns null if:
   * - No cache entry exists
   * - TTL expired
   * - User's role changed since cache was set
   * - User record was updated since cache was set
   */
  get(userId: string, currentRole?: string, currentUpdatedAt?: string): string[] | null {
    const cached = this.cache.get(userId)
    
    if (!cached) {
      return null
    }

    // TTL check
    const age = Date.now() - cached.timestamp
    if (age > this.ttl) {
      this.cache.delete(userId)
      return null
    }

    // SECURITY: Staleness check — if role or updated_at changed, invalidate immediately
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

  // Cleanup expired entries
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
}

// Singleton instance
export const permissionCache = new PermissionCache()

// Periodic cleanup (every 5 minutes — matches reduced TTL)
if (typeof global !== 'undefined') {
  setInterval(() => {
    permissionCache.cleanup()
  }, 5 * 60 * 1000)
}
