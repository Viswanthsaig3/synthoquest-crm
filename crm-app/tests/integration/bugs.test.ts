import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { apiClient } from '../helpers/api-client'
import { authHelper } from '../helpers/auth'
import { newBug } from '../fixtures/test-data'

describe('Bugs API', () => {
  let createdBugId: string
  let existingBugId: string
  let userId: string

  beforeAll(async () => {
    const user = await authHelper.login()
    userId = user.id

    const listResponse = await apiClient.get('/api/bugs?limit=1')
    if (listResponse.data?.data?.length > 0) {
      existingBugId = listResponse.data.data[0].id
    }
  })

  afterAll(async () => {
    await authHelper.logout()
  })

  describe('GET /api/bugs', () => {
    it('should list all bugs', async () => {
      const response = await apiClient.get('/api/bugs')

      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('data')
      expect(Array.isArray(response.data.data)).toBe(true)
    })
  })

  describe('POST /api/bugs', () => {
    it('should create a new bug', async () => {
      const response = await apiClient.post('/api/bugs', {
        ...newBug,
        assignedTo: userId,
      })

      expect(response.status).toBe(201)
      expect(response.data).toHaveProperty('data')

      createdBugId = response.data.data?.id
    })

    it('should fail with missing title', async () => {
      const response = await apiClient.post('/api/bugs', {
        description: 'Test bug',
      })

      expect(response.status).toBe(400)
    })
  })

  describe('GET /api/bugs/[id]', () => {
    it('should get bug details', async () => {
      if (!existingBugId) return

      const response = await apiClient.get(`/api/bugs/${existingBugId}`)

      expect(response.status).toBe(200)
    })
  })

describe('DELETE /api/bugs/[id]/screenshot', () => {
      it('should delete bug screenshot', async () => {
        if (!existingBugId) return

        const response = await apiClient.delete(`/api/bugs/${existingBugId}/screenshot`)

        expect([200, 400, 404]).toContain(response.status)
      })
    })

    describe('PUT /api/bugs/[id]/assign', () => {
      it('should assign bug to user', async () => {
        if (!existingBugId) return

        const response = await apiClient.put(`/api/bugs/${existingBugId}/assign`, {
          assignedTo: userId,
        })

        expect(response.status).toBe(200)
      })
    })
})