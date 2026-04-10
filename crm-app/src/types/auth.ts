/**
 * Auth-related types. `User` and `AuthState` live in `./user` (single source of truth).
 */
export type {
  User,
  AuthState,
  Role,
  EmployeeStatus,
  CompensationType,
  Department,
} from './user'

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
  familyId: string | null // SECURITY: HIGH-04 — token family for reuse detection
}
