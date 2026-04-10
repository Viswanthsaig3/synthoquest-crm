import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { apiClient } from '../helpers/api-client'
import { authHelper } from '../helpers/auth'
import { newIntern, getFutureDate } from '../fixtures/test-data'

describe('Interns API', () => {
  let createdInternId: string
  let existingInternId: string
  let userId: string

  beforeAll(async () => {
    const user = await authHelper.login()
    userId = user.id

    const listResponse = await apiClient.get('/api/interns?limit=1')
    if (listResponse.data?.data?.length > 0) {
      existingInternId = listResponse.data.data[0].id
    }
  })

  afterAll(async () => {
    await authHelper.logout()
  })

  describe('GET /api/interns', () => {
    it('should list all interns', async () => {
      const response = await apiClient.get('/api/interns')

      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('data')
    })

    it('should filter by status', async () => {
      const response = await apiClient.get('/api/interns?status=active')

      expect(response.status).toBe(200)
    })

    it('should filter by department', async () => {
      const response = await apiClient.get('/api/interns?department=engineering')

      expect(response.status).toBe(200)
    })
  })

  describe('POST /api/interns', () => {
    it('should create a new intern', async () => {
      const uniqueEmail = `intern.${Date.now()}@example.com`
      const response = await apiClient.post('/api/interns', {
        ...newIntern,
        email: uniqueEmail,
        managedBy: userId,
        profile: {
          ...newIntern.profile,
          startDate: getFutureDate(0),
          expectedEndDate: getFutureDate(90),
        },
      })

      expect(response.status).toBe(201)
      expect(response.data).toHaveProperty('data')

      createdInternId = response.data.data?.id
    })

    it('should fail with missing required fields', async () => {
      const response = await apiClient.post('/api/interns', {
        email: 'test@example.com',
        // Missing other required fields
      })

      expect(response.status).toBe(400)
    })
  })

  describe('GET /api/interns/[id]', () => {
    it('should get intern details', async () => {
      if (!existingInternId) return

      const response = await apiClient.get(`/api/interns/${existingInternId}`)

      expect(response.status).toBe(200)
    })
  })

  describe('POST /api/interns/[id]/approve', () => {
    it('should approve intern', async () => {
      if (!existingInternId) return

      const response = await apiClient.post(`/api/interns/${existingInternId}/approve`)

      expect(response.status).toBe(200)
    })
  })

  describe('POST /api/interns/[id]/reject', () => {
    it('should reject intern', async () => {
      if (!createdInternId) return

      const response = await apiClient.post(`/api/interns/${createdInternId}/reject`, {
        reason: 'Rejected during testing',
      })

      expect(response.status).toBe(200)
    })
  })
})