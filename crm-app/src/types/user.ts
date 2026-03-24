export type Role = 'admin' | 'hr' | 'team_lead' | 'employee'
export type Department = 'sales' | 'training' | 'marketing'
export type EmployeeStatus = 'active' | 'inactive'

export interface User {
  id: string
  name: string
  email: string
  phone: string
  role: Role
  department: Department
  status: EmployeeStatus
  joinDate: Date
  avatar: string
  salary: number
}

export interface AuthState {
  user: User | null
  isAuthenticated: boolean
  login: (email: string, password: string, role: Role) => Promise<boolean>
  logout: () => void
  switchRole: (role: Role) => void
}