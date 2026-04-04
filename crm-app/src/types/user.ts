export type Role = 'admin' | 'hr' | 'team_lead' | 'sales_rep' | 'employee'
export type Department = 'sales' | 'training' | 'marketing'
export type EmployeeStatus = 'active' | 'inactive' | 'suspended'

export interface User {
  id: string
  name: string
  email: string
  phone: string
  role: Role
  department: Department | string
  status: EmployeeStatus
  joinDate: string
  avatar: string | null
  salary?: number
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
}