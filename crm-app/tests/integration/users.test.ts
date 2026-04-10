import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { apiClient } from '../helpers/api-client'
import { authHelper } from '../helpers/auth'

describe('Users API', () => {
  let userId: string
  let otherUserId: string

  beforeAll(async () => {
    const user = await authHelper.login()
    userId = user.id
    
    // Get another user ID for role change tests
    const employeesResponse = await apiClient.get('/api/employees?limit=2')
    if (employeesResponse.data?.data?.length > 1) {
      otherUserId = employeesResponse.data.data.find((e: any) => e.id !== userId)?.id
    }
  })

  afterAll(async () => {
    await authHelper.logout()
  })

  describe('GET /api/users/hierarchy', () => {
    it('should get user hierarchy', async () => {
      const response = await apiClient.get('/api/users/hierarchy')

      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('data')
    })
  })

  describe('GET /api/users/assignable', () => {
    it('should get assignable users', async () => {
      const response = await apiClient.get('/api/users/assignable')

      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('data')
      expect(Array.isArray(response.data.data)).toBe(true)
    })
  })

  describe('PUT /api/users/[id]/role', () => {
    it('should update user role', async () => {
      if (!otherUserId) return // Skip if no other user

      const response = await apiClient.put(`/api/users/${otherUserId}/role`, {
        role: 'employee',
      })

      expect(response.status).toBe(200)
    })

    it('should fail with invalid role', async () => {
      if (!otherUserId) return

      const response = await apiClient.put(`/api/users/${otherUserId}/role`, {
        role: 'invalid_role',
      })

      expect(response.status).toBe(404) // Role not found
    })
    
    it('should fail when changing own role', async () => {
      const response = await apiClient.put(`/api/users/${userId}/role`, {
        role: 'employee',
      })

      expect(response.status).toBe(403)
    })
  })

  describe('GET /api/users/[id]/role-history', () => {
    it('should get role history', async () => {
      const response = await apiClient.get(`/api/users/${userId}/role-history`)

      expect(response.status).toBe(200)
    })
  })

  describe('PATCH /api/users/[id]/home-location', () => {
    it('should update home location', async () => {
      const response = await apiClient.patch(`/api/users/${userId}/home-location`, {
        latitude: 12.9716,
        longitude: 77.5946,
      })

      expect(response.status).toBe(200)
    })

    it('should fail with invalid coordinates', async () => {
      const response = await apiClient.patch(`/api/users/${userId}/home-location`, {
        latitude: 200,
        longitude: 200,
      })

      expect(response.status).toBe(400)
    })
  })

  describe('PATCH /api/users/[id]/manager', () => {
    it('should fail to set self as manager', async () => {
      const response = await apiClient.patch(`/api/users/${userId}/manager`, {
        managerId: userId,
      })

      expect(response.status).toBe(400)
    })
  })

  describe('GET /api/users/[id]/compensation', () => {
    it('should get compensation details', async () => {
      const response = await apiClient.get(`/api/users/${userId}/compensation`)

      expect(response.status).toBe(200)
    })
  })
})