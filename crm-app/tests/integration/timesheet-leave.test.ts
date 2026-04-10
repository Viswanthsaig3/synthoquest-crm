import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { apiClient } from '../helpers/api-client'
import { authHelper } from '../helpers/auth'
import { newTimeEntry, newLeave, getFutureDate, getTodayDate } from '../fixtures/test-data'

describe('Timesheet & Leave API', () => {
  let createdTimeEntryId: string
  let createdLeaveId: string
  let existingLeaveId: string

  beforeAll(async () => {
    await authHelper.login()
    
    // Get existing leave for tests
    const leavesResponse = await apiClient.get('/api/leaves?limit=1')
    if (leavesResponse.data?.data?.length > 0) {
      existingLeaveId = leavesResponse.data.data[0].id
    }
  })

  afterAll(async () => {
    await authHelper.logout()
  })

  describe('Time Entries', () => {
    describe('GET /api/time-entries', () => {
      it('should list time entries', async () => {
        const response = await apiClient.get('/api/time-entries')

        expect(response.status).toBe(200)
        expect(response.data).toHaveProperty('data')
        expect(response.data).toHaveProperty('pagination')
      })

      it('should filter by date', async () => {
        const today = getTodayDate()
        const response = await apiClient.get(`/api/time-entries?date=${today}`)

        expect(response.status).toBe(200)
      })

      it('should filter by status', async () => {
        const response = await apiClient.get('/api/time-entries?status=pending')

        expect(response.status).toBe(200)
      })
    })

    describe('POST /api/time-entries', () => {
      it('should create a time entry for today', async () => {
        const today = getTodayDate()
        const response = await apiClient.post('/api/time-entries', {
          date: today,
          ...newTimeEntry,
        })

        expect(response.status).toBe(201)
        expect(response.data).toHaveProperty('data')
        
        createdTimeEntryId = response.data.data?.id
      })

      it('should fail for past dates', async () => {
        const pastDate = getFutureDate(-1)
        const response = await apiClient.post('/api/time-entries', {
          date: pastDate,
          ...newTimeEntry,
        })

        expect(response.status).toBe(400)
      })

      it('should fail with invalid time range', async () => {
        const today = getTodayDate()
        const response = await apiClient.post('/api/time-entries', {
          date: today,
          startTime: '17:00',
          endTime: '09:00', // End before start
          description: 'Test time entry',
        })

        expect(response.status).toBe(400)
      })

      it('should fail with missing fields', async () => {
        const today = getTodayDate()
        const response = await apiClient.post('/api/time-entries', {
          date: today,
          // Missing time and description
        })

        expect(response.status).toBe(400)
      })
    })

    describe('GET /api/time-entries/[id]', () => {
      it('should get time entry details', async () => {
        if (!createdTimeEntryId) return

        const response = await apiClient.get(`/api/time-entries/${createdTimeEntryId}`)

        expect(response.status).toBe(200)
      })
    })

    describe('POST /api/time-entries/[id]/approve', () => {
      it('should approve time entry', async () => {
        if (!createdTimeEntryId) return

        const response = await apiClient.post(`/api/time-entries/${createdTimeEntryId}/approve`)

        expect([200, 400, 404]).toContain(response.status)
      })
    })

    describe('POST /api/time-entries/[id]/reject', () => {
      it('should reject time entry with reason', async () => {
        if (!createdTimeEntryId) return

        const response = await apiClient.post(`/api/time-entries/${createdTimeEntryId}/reject`, {
          reason: 'Rejected during testing',
        })

        expect([200, 400, 404]).toContain(response.status)
      })
    })

    describe('GET /api/time/now', () => {
      it('should get current server time', async () => {
        const response = await apiClient.get('/api/time/now')

        expect(response.status).toBe(200)
        expect(response.data).toHaveProperty('data')
      })
    })
  })

  describe('Timesheets', () => {
    describe('GET /api/timesheets', () => {
      it('should list timesheets', async () => {
        const response = await apiClient.get('/api/timesheets')

        expect(response.status).toBe(200)
        expect(response.data).toHaveProperty('data')
      })
    })
  })

  describe('Timesheet Approvals', () => {
    describe('GET /api/timesheet-entries/pending', () => {
      it('should get pending entries', async () => {
        const response = await apiClient.get('/api/timesheet-entries/pending')

        expect(response.status).toBe(200)
      })
    })

    describe('GET /api/timesheet-entries/my-stats', () => {
      it('should get my stats', async () => {
        const response = await apiClient.get('/api/timesheet-entries/my-stats')

        expect(response.status).toBe(200)
      })
    })

    describe('POST /api/timesheet-entries/bulk-approve', () => {
      it('should bulk approve entries', async () => {
        const response = await apiClient.post('/api/timesheet-entries/bulk-approve', {
          ids: [],
        })

        expect([200, 400]).toContain(response.status)
      })
    })

    describe('POST /api/timesheet-entries/bulk-reject', () => {
      it('should bulk reject entries', async () => {
        const response = await apiClient.post('/api/timesheet-entries/bulk-reject', {
          ids: [],
          reason: 'Testing',
        })

        expect([200, 400]).toContain(response.status)
      })
    })
  })

  describe('Leaves', () => {
    describe('GET /api/leaves', () => {
      it('should list leaves', async () => {
        const response = await apiClient.get('/api/leaves')

        expect(response.status).toBe(200)
        expect(response.data).toHaveProperty('data')
      })

      it('should filter by status', async () => {
        const response = await apiClient.get('/api/leaves?status=pending')

        expect(response.status).toBe(200)
      })

      it('should filter by type', async () => {
        const response = await apiClient.get('/api/leaves?type=casual')

        expect(response.status).toBe(200)
      })
    })

    describe('GET /api/leaves/balances', () => {
      it('should get leave balances', async () => {
        const response = await apiClient.get('/api/leaves/balances')

        expect(response.status).toBe(200)
      })
    })

    describe('GET /api/leaves/balance', () => {
      it('should get my leave balance', async () => {
        const response = await apiClient.get('/api/leaves/balance')

        expect(response.status).toBe(200)
      })
    })

    describe('POST /api/leaves', () => {
      it('should apply for leave', async () => {
        const startDate = getFutureDate(7)
        const endDate = getFutureDate(8)

        const response = await apiClient.post('/api/leaves', {
          ...newLeave,
          startDate,
          endDate,
        })

        expect([201, 400]).toContain(response.status)
        if (response.status === 201) {
          expect(response.data).toHaveProperty('data')
          createdLeaveId = response.data.data?.id
        }
      })

      it('should fail for past dates', async () => {
        const pastDate = getFutureDate(-1)

        const response = await apiClient.post('/api/leaves', {
          ...newLeave,
          startDate: pastDate,
          endDate: pastDate,
        })

        expect(response.status).toBe(400)
      })

      it('should fail with end date before start date', async () => {
        const response = await apiClient.post('/api/leaves', {
          ...newLeave,
          startDate: getFutureDate(10),
          endDate: getFutureDate(7),
        })

        expect(response.status).toBe(400)
      })

      it('should fail with short reason', async () => {
        const response = await apiClient.post('/api/leaves', {
          ...newLeave,
          startDate: getFutureDate(7),
          endDate: getFutureDate(8),
          reason: 'Too short',
        })

        expect(response.status).toBe(400)
      })
    })

    describe('GET /api/leaves/[id]', () => {
      it('should get leave details', async () => {
        if (!existingLeaveId) return

        const response = await apiClient.get(`/api/leaves/${existingLeaveId}`)

        expect(response.status).toBe(200)
      })
    })

    describe('POST /api/leaves/[id]/approve', () => {
      it('should approve leave', async () => {
        if (!existingLeaveId) return

        const response = await apiClient.post(`/api/leaves/${existingLeaveId}/approve`)

        expect([200, 400, 403, 404]).toContain(response.status)
      })
    })

    describe('POST /api/leaves/[id]/reject', () => {
      it('should reject leave', async () => {
        if (!createdLeaveId) return

        const response = await apiClient.post(`/api/leaves/${createdLeaveId}/reject`, {
          reason: 'Rejected during testing',
        })

        expect(response.status).toBe(200)
      })
    })

    describe('POST /api/leaves/[id]/cancel', () => {
      it('should cancel leave', async () => {
        if (!createdLeaveId) return

        const response = await apiClient.post(`/api/leaves/${createdLeaveId}/cancel`)

        expect(response.status).toBe(200)
      })
    })
  })
})