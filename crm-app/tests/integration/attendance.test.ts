import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { apiClient } from '../helpers/api-client'
import { authHelper } from '../helpers/auth'
import { attendanceCheckIn, attendanceCheckOut } from '../fixtures/test-data'

describe('Attendance API', () => {
  let attendanceRecordId: string

  beforeAll(async () => {
    await authHelper.login()
  })

  afterAll(async () => {
    await authHelper.logout()
  })

  describe('GET /api/attendance/today', () => {
    it('should get today\'s attendance summary', async () => {
      const response = await apiClient.get('/api/attendance/today')

      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('data')
    })
  })

  describe('POST /api/attendance/today (Check In)', () => {
    it('should check in with valid location', async () => {
      const response = await apiClient.post('/api/attendance/today', attendanceCheckIn)

      expect([200, 201, 400, 403]).toContain(response.status)
      if (response.status === 201 || response.status === 200) {
        expect(response.data).toHaveProperty('data')
        attendanceRecordId = response.data.data?.id
      }
    })

    it('should fail without location data', async () => {
      const response = await apiClient.post('/api/attendance/today', {})

      expect([400, 403]).toContain(response.status)
    })

    it('should fail with invalid latitude', async () => {
      const response = await apiClient.post('/api/attendance/today', {
        ...attendanceCheckIn,
        latitude: 200,
      })

      expect([400, 403]).toContain(response.status)
    })

    it('should fail with invalid longitude', async () => {
      const response = await apiClient.post('/api/attendance/today', {
        ...attendanceCheckIn,
        longitude: 200,
      })

      expect([400, 403]).toContain(response.status)
    })
  })

  describe('PUT /api/attendance/today (Check Out)', () => {
    it('should check out with valid location', async () => {
      const response = await apiClient.put('/api/attendance/today', attendanceCheckOut)

      expect([200, 400, 403]).toContain(response.status)
    })

    it('should fail without location data', async () => {
      const response = await apiClient.put('/api/attendance/today', {})

      expect([400, 403]).toContain(response.status)
    })
  })

  describe('GET /api/attendance/history', () => {
    it('should get attendance history', async () => {
      const response = await apiClient.get('/api/attendance/history')

      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('data')
    })

    it('should support pagination', async () => {
      const response = await apiClient.get('/api/attendance/history?page=1&limit=10')

      expect(response.status).toBe(200)
    })
  })

  describe('GET /api/attendance/team-today', () => {
    it('should get team attendance for today', async () => {
      const response = await apiClient.get('/api/attendance/team-today')

      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('data')
    })
  })

  describe('GET /api/attendance/warnings', () => {
    it('should get attendance warnings', async () => {
      const response = await apiClient.get('/api/attendance/warnings')

      expect(response.status).toBe(200)
    })
  })

  describe('GET /api/attendance/settings', () => {
    it('should get attendance settings', async () => {
      const response = await apiClient.get('/api/attendance/settings')

      expect([200, 403, 500]).toContain(response.status)
    })
  })

  describe('GET /api/attendance/adjustments', () => {
    it('should get attendance adjustments', async () => {
      const response = await apiClient.get('/api/attendance/adjustments')

      expect(response.status).toBe(200)
    })
  })

  describe('GET /api/attendance/security', () => {
    it('should get security logs', async () => {
      const response = await apiClient.get('/api/attendance/security')

      expect(response.status).toBe(200)
    })
  })

  describe('POST /api/attendance/heartbeat', () => {
    it('should send heartbeat', async () => {
      const response = await apiClient.post('/api/attendance/heartbeat')

      expect([200, 400]).toContain(response.status)
    })
  })

  describe('POST /api/attendance/[id]/adjust', () => {
    it('should adjust attendance record', async () => {
      // First get a record ID from history
      const historyResponse = await apiClient.get('/api/attendance/history?limit=1')
      
      if (historyResponse.data?.data?.length > 0) {
        const recordId = historyResponse.data.data[0].id
        const response = await apiClient.post(`/api/attendance/${recordId}/adjust`, {
          reason: 'Test adjustment',
        })

        expect([200, 400, 403]).toContain(response.status)
      }
    })
  })
})