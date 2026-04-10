/**
 * Authentication Test Helper
 * Handles login, token management, and user creation for tests
 */

import { apiClient, TestResponse } from './api-client'

export interface TestUser {
  id: string
  email: string
  name: string
  role: string
  permissions: string[]
  department: string
  phone?: string
  status: string
  accessToken: string
}

export interface LoginCredentials {
  email: string
  password: string
}

const TEST_ADMIN = {
  email: 'admin@synthoquest.com',
  password: 'Admin@123',
}

class AuthHelper {
  private currentUser: TestUser | null = null

  async login(credentials: LoginCredentials = TEST_ADMIN): Promise<TestUser> {
    const response = await apiClient.post<{ data: { user: any; accessToken: string } }>(
      '/api/auth/login',
      credentials
    )

    if (response.status !== 200) {
      throw new Error(`Login failed: ${JSON.stringify(response.data)}`)
    }

    const { user, accessToken } = response.data.data
    apiClient.setAccessToken(accessToken)
    apiClient.setAccessToken(accessToken)

    this.currentUser = {
      ...user,
      accessToken,
    }

    return this.currentUser!
  }

  async logout(): Promise<void> {
    await apiClient.post('/api/auth/logout')
    apiClient.clearAccessToken()
    this.currentUser = null
  }

  getCurrentUser(): TestUser | null {
    return this.currentUser
  }

  async getMe(): Promise<TestResponse> {
    return apiClient.get('/api/auth/me')
  }

  isAuthenticated(): boolean {
    return this.currentUser !== null
  }

  clearAuth(): void {
    apiClient.clearAccessToken()
    this.currentUser = null
  }
}

export const authHelper = new AuthHelper()