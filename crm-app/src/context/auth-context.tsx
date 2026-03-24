'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { User, Role, AuthState } from '@/types/user'
import { mockUsers } from '@/lib/mock-data'

const AuthContext = createContext<AuthState | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('crm_user')
      if (savedUser) {
        const parsed = JSON.parse(savedUser)
        parsed.joinDate = new Date(parsed.joinDate)
        setUser(parsed)
        setIsAuthenticated(true)
      }
    } catch (e) {
      localStorage.removeItem('crm_user')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const login = async (email: string, password: string, role: Role): Promise<boolean> => {
    await new Promise(resolve => setTimeout(resolve, 500))
    
    const roleUsers: Record<Role, string> = {
      admin: 'usr_1',
      hr: 'usr_2',
      team_lead: 'usr_3',
      employee: 'usr_5',
    }

    const userId = roleUsers[role]
    const foundUser = mockUsers.find(u => u.id === userId)
    
    if (foundUser) {
      const userWithRole = { ...foundUser, role }
      setUser(userWithRole)
      setIsAuthenticated(true)
      localStorage.setItem('crm_user', JSON.stringify(userWithRole))
      return true
    }
    
    return false
  }

  const logout = () => {
    setUser(null)
    setIsAuthenticated(false)
    localStorage.removeItem('crm_user')
  }

  const switchRole = (role: Role) => {
    if (user) {
      const updatedUser = { ...user, role }
      setUser(updatedUser)
      localStorage.setItem('crm_user', JSON.stringify(updatedUser))
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, logout, switchRole }}>
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