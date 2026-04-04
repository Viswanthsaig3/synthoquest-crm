'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { User, AuthState } from '@/types/user'
import { createClient } from '@/lib/db/client'

const AuthContext = createContext<AuthState | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    checkSession()
  }, [])

  async function checkSession() {
    try {
      const storedUser = localStorage.getItem('crm_user')
      const storedToken = localStorage.getItem('crm_access_token')

      if (storedUser && storedToken) {
        const response = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${storedToken}`,
          },
        })

        if (response.ok) {
          const result = await response.json()
          setUser(result.data)
          setIsAuthenticated(true)
        } else {
          const refreshToken = document.cookie
            .split('; ')
            .find(row => row.startsWith('refreshToken='))
            ?.split('=')[1]

          if (refreshToken) {
            const refreshResponse = await fetch('/api/auth/refresh', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ refreshToken }),
            })

            if (refreshResponse.ok) {
              const refreshResult = await refreshResponse.json()
              localStorage.setItem('crm_access_token', refreshResult.data.accessToken)
              
              const meResponse = await fetch('/api/auth/me', {
                headers: {
                  'Authorization': `Bearer ${refreshResult.data.accessToken}`,
                },
              })

              if (meResponse.ok) {
                const meResult = await meResponse.json()
                setUser(meResult.data)
                setIsAuthenticated(true)
                return
              }
            }
          }

          localStorage.removeItem('crm_user')
          localStorage.removeItem('crm_access_token')
        }
      }
    } catch (error) {
      console.error('Session check error:', error)
      localStorage.removeItem('crm_user')
      localStorage.removeItem('crm_access_token')
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        const error = await response.json()
        console.error('Login error:', error)
        return false
      }

      const result = await response.json()
      
      setUser(result.data.user)
      setIsAuthenticated(true)
      localStorage.setItem('crm_user', JSON.stringify(result.data.user))
      localStorage.setItem('crm_access_token', result.data.accessToken)

      return true
    } catch (error) {
      console.error('Login error:', error)
      return false
    }
  }

  const logout = async () => {
    try {
      const token = localStorage.getItem('crm_access_token')
      
      if (token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })
      }
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setUser(null)
      setIsAuthenticated(false)
      localStorage.removeItem('crm_user')
      localStorage.removeItem('crm_access_token')
    }
  }

  const refreshSession = async () => {
    await checkSession()
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isLoading, login, logout, refreshSession }}>
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
