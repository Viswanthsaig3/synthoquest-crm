'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'
import { User, AuthState } from '@/types/user'
import { setAccessToken as setGlobalAccessToken } from '@/lib/api/client'

interface ExtendedAuthState extends AuthState {
  getAccessToken: () => string | null
  token: string | null
}

const AuthContext = createContext<ExtendedAuthState | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const getAccessToken = useCallback(() => accessToken, [accessToken])

  useEffect(() => {
    silentRefresh()
  }, [])

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