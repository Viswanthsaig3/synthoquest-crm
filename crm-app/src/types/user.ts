export type Role = string
export const SYSTEM_ROLES = ['admin'] as const
export type Department = 'sales' | 'training' | 'marketing'
export type EmployeeStatus = 'active' | 'inactive' | 'suspended'
export type CompensationType = 'paid' | 'unpaid'

export interface User {
  id: string
  name: string
  email: string
  phone: string
  role: Role
  permissions?: string[]
  department: Department | string
  status: EmployeeStatus
  joinDate: string
  avatar: string | null
  salary?: number
  compensationType?: CompensationType
  compensationAmount?: number | null
  compensationUpdatedAt?: string | null
  compensationUpdatedBy?: string | null
  managedBy?: string | null
  lastLoginAt?: string | null
  password_hash?: string
}

export interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<boolean>
  logout: () => Promise<void>
  refreshSession: () => Promise<void>
  getAccessToken: () => string | null
}
