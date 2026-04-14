'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react'
import { User, AuthState } from '@/types/user'
import { setAccessToken as setGlobalAccessToken } from '@/lib/api/client'

interface ExtendedAuthState extends AuthState {
  getAccessToken: () => string | null
  token: string | null
}

const AuthContext = createContext<ExtendedAuthState | undefined>(undefined)

const REFRESH_INTERVAL_MS = 3.5 * 60 * 60 * 1000

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const getAccessToken = useCallback(() => accessToken, [accessToken])

  async function silentRefresh(): Promise<boolean> {
    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
        },
      })

      if (response.ok) {
        const result = await response.json()
        setAccessToken(result.data.accessToken)
        setGlobalAccessToken(result.data.accessToken)

        const meResponse = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${result.data.accessToken}`,
          },
        })

        if (meResponse.ok) {
          const meResult = await meResponse.json()
          setUser(meResult.data)
          setIsAuthenticated(true)
          return true
        }
      }
      
      setUser(null)
      setAccessToken(null)
      setGlobalAccessToken(null)
      setIsAuthenticated(false)
      return false
    } catch (error) {
      console.error('Silent refresh error:', error)
      setUser(null)
      setAccessToken(null)
      setGlobalAccessToken(null)
      setIsAuthenticated(false)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    silentRefresh()
  }, [])

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isAuthenticated) {
        silentRefresh()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [isAuthenticated])

  useEffect(() => {
    if (isAuthenticated) {
      refreshIntervalRef.current = setInterval(() => {
        silentRefresh()
      }, REFRESH_INTERVAL_MS)
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current)
        refreshIntervalRef.current = null
      }
    }
  }, [isAuthenticated])

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        const error = await response.json()
        console.error('Login error:', error)
        return false
      }

      const result = await response.json()
      
      setUser(result.data.user)
      setAccessToken(result.data.accessToken)
      setGlobalAccessToken(result.data.accessToken)
      setIsAuthenticated(true)

      return true
    } catch (error) {
      console.error('Login error:', error)
      return false
    }
  }

  const logout = async () => {
    try {
      if (accessToken) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
          credentials: 'include',
        })
      }
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setUser(null)
      setAccessToken(null)
      setGlobalAccessToken(null)
      setIsAuthenticated(false)
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current)
        refreshIntervalRef.current = null
      }
    }
  }

  const refreshSession = async () => {
    await silentRefresh()
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated, 
      isLoading, 
      login, 
      logout, 
      refreshSession,
      getAccessToken,
      token: accessToken,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}