import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { apiClient } from '../helpers/api-client'
import { authHelper } from '../helpers/auth'
import { newLead } from '../fixtures/test-data'

describe('Leads API', () => {
  let createdLeadId: string
  let existingLeadId: string

  beforeAll(async () => {
    await authHelper.login()
    
    // Get an existing lead for tests
    const listResponse = await apiClient.get('/api/leads?limit=1')
    if (listResponse.data?.data?.length > 0) {
      existingLeadId = listResponse.data.data[0].id
    }
  })

  afterAll(async () => {
    await authHelper.logout()
  })

  describe('GET /api/leads', () => {
    it('should list all leads', async () => {
      const response = await apiClient.get('/api/leads')

      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('data')
      expect(Array.isArray(response.data.data)).toBe(true)
      expect(response.data).toHaveProperty('pagination')
    })

    it('should support pagination', async () => {
      const response = await apiClient.get('/api/leads?page=1&limit=5')

      expect(response.status).toBe(200)
      expect(response.data.pagination.page).toBe(1)
      expect(response.data.pagination.limit).toBe(5)
    })

    it('should filter by status', async () => {
      const response = await apiClient.get('/api/leads?status=open')

      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('data')
    })

    it('should filter by priority', async () => {
      const response = await apiClient.get('/api/leads?priority=hot')

      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('data')
    })

    it('should support search', async () => {
      const response = await apiClient.get('/api/leads?search=test')

      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('data')
    })

    it('should fail without authentication', async () => {
      apiClient.clearAccessToken()
      const response = await apiClient.get('/api/leads')

      expect(response.status).toBe(401)
      await authHelper.login()
    })
  })

  describe('POST /api/leads', () => {
    it('should create a new lead with valid data', async () => {
      const uniqueEmail = `lead.${Date.now()}@example.com`
      const response = await apiClient.post('/api/leads', {
        ...newLead,
        email: uniqueEmail,
      })

      expect(response.status).toBe(201)
      expect(response.data).toHaveProperty('data')
      expect(response.data.data).toHaveProperty('id')
      expect(response.data.data.email).toBe(uniqueEmail)

      createdLeadId = response.data.data.id
    })

    it('should fail with invalid email', async () => {
      const response = await apiClient.post('/api/leads', {
        ...newLead,
        email: 'invalid-email',
      })

      expect(response.status).toBe(400)
    })

    it('should fail with missing required fields', async () => {
      const response = await apiClient.post('/api/leads', {
        name: 'Test Lead',
        // Missing email and phone
      })

      expect(response.status).toBe(400)
    })

    it('should fail with invalid source', async () => {
      const response = await apiClient.post('/api/leads', {
        ...newLead,
        source: 'invalid',
      })

      expect(response.status).toBe(400)
    })

    it('should fail with invalid priority', async () => {
      const response = await apiClient.post('/api/leads', {
        ...newLead,
        priority: 'invalid',
      })

      expect(response.status).toBe(400)
    })
  })

  describe('GET /api/leads/[id]', () => {
    it('should get lead details by ID', async () => {
      if (!existingLeadId) {
        return
      }

      const response = await apiClient.get(`/api/leads/${existingLeadId}`)

      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('data')
      expect(response.data.data.id).toBe(existingLeadId)
    })

    it('should return 404 for non-existent lead', async () => {
      const response = await apiClient.get('/api/leads/00000000-0000-0000-0000-000000000000')

      expect(response.status).toBe(404)
    })
  })

  describe('GET /api/leads/[id]/activities', () => {
    it('should get lead activities', async () => {
      if (!existingLeadId) {
        return
      }

      const response = await apiClient.get(`/api/leads/${existingLeadId}/activities`)

      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('data')
    })
  })

  describe('GET /api/leads/[id]/calls', () => {
    it('should get lead calls', async () => {
      if (!existingLeadId) {
        return
      }

      const response = await apiClient.get(`/api/leads/${existingLeadId}/calls`)

      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('data')
    })
  })

  describe('POST /api/leads/[id]/claim', () => {
    it('should claim a lead', async () => {
      if (!createdLeadId) {
        return
      }

      const response = await apiClient.post(`/api/leads/${createdLeadId}/claim`)

      expect(response.status).toBe(200)
    })
  })
})