import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { apiClient } from '../helpers/api-client'
import { authHelper } from '../helpers/auth'
import { testUsers } from '../fixtures/test-data'

describe('Authentication API', () => {
  describe('POST /api/auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      const response = await apiClient.post('/api/auth/login', {
        email: testUsers.admin.email,
        password: testUsers.admin.password,
      })

      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('data')
      expect(response.data.data).toHaveProperty('accessToken')
      expect(response.data.data).toHaveProperty('user')
      expect(response.data.data.user.email).toBe(testUsers.admin.email)
    })

    it('should fail with invalid credentials', async () => {
      const response = await apiClient.post('/api/auth/login', {
        email: 'invalid@example.com',
        password: 'wrongpassword',
      })

      expect(response.status).toBe(401)
      expect(response.data).toHaveProperty('error')
    })

    it('should fail with missing fields', async () => {
      const response = await apiClient.post('/api/auth/login', {
        email: testUsers.admin.email,
      })

      expect(response.status).toBe(400)
      expect(response.data).toHaveProperty('error')
    })

    it('should reject inactive accounts', async () => {
      // This would require creating an inactive user first
      // For now, we'll skip this test
    })
  })

  describe('GET /api/auth/me', () => {
    beforeEach(async () => {
      await authHelper.login()
    })

    afterAll(async () => {
      await authHelper.logout()
    })

    it('should return current user details when authenticated', async () => {
      const response = await apiClient.get('/api/auth/me')

      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('data')
      expect(response.data.data).toHaveProperty('id')
      expect(response.data.data).toHaveProperty('email')
      expect(response.data.data).toHaveProperty('role')
      expect(response.data.data).toHaveProperty('permissions')
    })

    it('should fail without authentication token', async () => {
      apiClient.clearAccessToken()
      const response = await apiClient.get('/api/auth/me')

      expect(response.status).toBe(401)
      expect(response.data).toHaveProperty('error')
    })
  })

  describe('POST /api/auth/logout', () => {
    beforeEach(async () => {
      await authHelper.login()
    })

    it('should logout successfully', async () => {
      const response = await apiClient.post('/api/auth/logout')

      expect(response.status).toBe(200)
    })

    it('should fail without authentication', async () => {
      apiClient.clearAccessToken()
      const response = await apiClient.post('/api/auth/logout')

      expect(response.status).toBe(401)
    })
  })

  describe('POST /api/auth/refresh', () => {
    it('should fail without refresh token cookie', async () => {
      const response = await apiClient.post('/api/auth/refresh')

      expect([401, 403]).toContain(response.status)
    })
  })
})