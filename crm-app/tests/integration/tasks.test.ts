import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { apiClient } from '../helpers/api-client'
import { authHelper } from '../helpers/auth'
import { newTask, getFutureDate } from '../fixtures/test-data'

describe('Tasks API', () => {
  let createdTaskId: string
  let existingTaskId: string
  let userId: string

  beforeAll(async () => {
    const user = await authHelper.login()
    userId = user.id
    
    // Get an existing task for tests
    const listResponse = await apiClient.get('/api/tasks?limit=1')
    if (listResponse.data?.data?.length > 0) {
      existingTaskId = listResponse.data.data[0].id
    }
  })

  afterAll(async () => {
    await authHelper.logout()
  })

  describe('GET /api/tasks', () => {
    it('should list all tasks', async () => {
      const response = await apiClient.get('/api/tasks')

      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('data')
      expect(Array.isArray(response.data.data)).toBe(true)
      expect(response.data).toHaveProperty('pagination')
    })

    it('should support pagination', async () => {
      const response = await apiClient.get('/api/tasks?page=1&limit=5')

      expect(response.status).toBe(200)
      expect(response.data.pagination.page).toBe(1)
      expect(response.data.pagination.limit).toBe(5)
    })

    it('should filter by status', async () => {
      const response = await apiClient.get('/api/tasks?status=pending')

      expect(response.status).toBe(200)
    })

    it('should filter by priority', async () => {
      const response = await apiClient.get('/api/tasks?priority=high')

      expect(response.status).toBe(200)
    })

    it('should filter by type', async () => {
      const response = await apiClient.get('/api/tasks?type=task')

      expect(response.status).toBe(200)
    })

    it('should support search', async () => {
      const response = await apiClient.get('/api/tasks?search=test')

      expect(response.status).toBe(200)
    })
  })

  describe('POST /api/tasks', () => {
    it('should create a new task with valid data', async () => {
      const response = await apiClient.post('/api/tasks', {
        ...newTask,
        assignedTo: userId,
      })

      expect(response.status).toBe(201)
      expect(response.data).toHaveProperty('data')
      expect(response.data.data).toHaveProperty('id')

      createdTaskId = response.data.data.id
    })

    it('should fail with missing title', async () => {
      const response = await apiClient.post('/api/tasks', {
        description: 'Test description',
      })

      expect(response.status).toBe(400)
    })

    it('should fail with invalid type', async () => {
      const response = await apiClient.post('/api/tasks', {
        ...newTask,
        type: 'invalid',
      })

      expect(response.status).toBe(400)
    })

    it('should fail with invalid priority', async () => {
      const response = await apiClient.post('/api/tasks', {
        ...newTask,
        priority: 'invalid',
      })

      expect(response.status).toBe(400)
    })

    it('should fail when assigning to non-existent user', async () => {
      const response = await apiClient.post('/api/tasks', {
        ...newTask,
        assignedTo: '00000000-0000-0000-0000-000000000000',
      })

      expect(response.status).toBe(404)
    })
  })

  describe('GET /api/tasks/[id]', () => {
    it('should get task details by ID', async () => {
      if (!existingTaskId) return

      const response = await apiClient.get(`/api/tasks/${existingTaskId}`)

      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('data')
    })

    it('should return 404 for non-existent task', async () => {
      const response = await apiClient.get('/api/tasks/00000000-0000-0000-0000-000000000000')

      expect(response.status).toBe(404)
    })
  })

  describe('GET /api/tasks/[id]/history', () => {
    it('should get task history', async () => {
      if (!existingTaskId) return

      const response = await apiClient.get(`/api/tasks/${existingTaskId}/history`)

      expect(response.status).toBe(200)
    })
  })

  describe('GET /api/tasks/[id]/comments', () => {
    it('should get task comments', async () => {
      if (!existingTaskId) return

      const response = await apiClient.get(`/api/tasks/${existingTaskId}/comments`)

      expect(response.status).toBe(200)
    })
  })

  describe('GET /api/tasks/[id]/time-logs', () => {
    it('should get task time logs', async () => {
      if (!existingTaskId) return

      const response = await apiClient.get(`/api/tasks/${existingTaskId}/time-logs`)

      expect(response.status).toBe(200)
    })
  })

  describe('POST /api/tasks/[id]/assign', () => {
    it('should assign task to user', async () => {
      if (!existingTaskId) return

      const response = await apiClient.post(`/api/tasks/${existingTaskId}/assign`, {
        assignedTo: userId,
      })

      expect(response.status).toBe(200)
    })
  })

  describe('POST /api/tasks/[id]/start', () => {
    it('should start task execution', async () => {
      if (!existingTaskId) return

      const response = await apiClient.post(`/api/tasks/${existingTaskId}/start`)

      expect([200, 400]).toContain(response.status)
    })
  })

  describe('POST /api/tasks/[id]/complete', () => {
    it('should mark task as complete', async () => {
      if (!existingTaskId) return

      const response = await apiClient.post(`/api/tasks/${existingTaskId}/complete`)

      expect([200, 400]).toContain(response.status)
    })
  })

  describe('POST /api/tasks/[id]/cancel', () => {
    it('should cancel task', async () => {
      if (!createdTaskId) return

      const response = await apiClient.post(`/api/tasks/${createdTaskId}/cancel`, {
        reason: 'Cancelled during testing',
      })

      expect(response.status).toBe(200)
    })
  })
})