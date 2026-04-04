class PermissionCache {
  private cache: Map<string, { permissions: string[]; timestamp: number }>
  private ttl: number = 5 * 60 * 1000 // 5 minutes

  constructor() {
    this.cache = new Map()
  }

  set(userId: string, permissions: string[]): void {
    this.cache.set(userId, {
      permissions,
      timestamp: Date.now(),
    })
  }

  get(userId: string): string[] | null {
    const cached = this.cache.get(userId)
    
    if (!cached) {
      return null
    }

    const age = Date.now() - cached.timestamp
    if (age > this.ttl) {
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

// Periodic cleanup (every 10 minutes)
if (typeof global !== 'undefined') {
  setInterval(() => {
    permissionCache.cleanup()
  }, 10 * 60 * 1000)
}
