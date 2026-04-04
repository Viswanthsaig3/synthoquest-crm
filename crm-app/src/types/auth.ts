import { Role } from './user'

export type EmployeeStatus = 'active' | 'inactive' | 'suspended'

export interface User {
  id: string
  name: string
  email: string
  phone: string
  role: Role
  department: string
  status: EmployeeStatus
  joinDate: string
  avatar: string | null
  salary?: number
  managedBy?: string | null
  lastLoginAt?: string | null
}

export interface LoginLog {
  id: string
  userId: string
  ipAddress: string
  latitude: number | null
  longitude: number | null
  city: string
  region: string
  country: string
  userAgent: string | null
  loginAt: string
  logoutAt: string | null
  sessionDuration: number | null
}

export interface RefreshToken {
  id: string
  userId: string
  tokenHash: string
  expiresAt: string
  createdAt: string
  revokedAt: string | null
  revokedBy: string | null
}

export interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<boolean>
  logout: () => Promise<void>
  refreshSession: () => Promise<void>
}
