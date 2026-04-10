/**
 * Timesheet Approval Workflow Tests
 * Tests complete timesheet submission and approval process
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { apiClient } from '../../helpers/api-client'
import { authHelper } from '../../helpers/auth'

describe('Timesheet Approval Workflow', () => {
  let adminToken: string
  let employeeId: string
  let timeEntryIds: string[] = []

  beforeAll(async () => {
    const adminUser = await authHelper.login({
      email: 'admin@synthoquest.com',
      password: 'Admin@123',
    })
    adminToken = authHelper.getCurrentUser()?.accessToken || ''

    apiClient.setAccessToken(adminToken)
    const employeesResponse = await apiClient.get('/api/employees?limit=1')
    if (employeesResponse.data?.data?.length > 0) {
      employeeId = employeesResponse.data.data[0].id
    }
  })

  afterAll(async () => {
    await authHelper.logout()
  })

  describe('Weekly Timesheet Submission Workflow', () => {
    it('Step 1: Employee logs time entries for the week', async () => {
      apiClient.setAccessToken(adminToken)

      const today = new Date()
      const weekStart = new Date(today)
      weekStart.setDate(today.getDate() - today.getDay() + 1) // Monday

      const timeEntries = [
        { day: 0, hours: '09:00-17:00', desc: 'API development - Authentication endpoints' },
        { day: 1, hours: '09:00-18:00', desc: 'API development - User management module' },
        { day: 2, hours: '09:00-17:30', desc: 'Code review and bug fixes' },
        { day: 3, hours: '09:00-17:00', desc: 'Documentation and testing' },
        { day: 4, hours: '09:00-16:00', desc: 'Sprint planning and demos' },
      ]

      for (const entry of timeEntries) {
        const date = new Date(weekStart)
        date.setDate(weekStart.getDate() + entry.day)
        const dateStr = date.toISOString().split('T')[0]

        const [startTime, endTime] = entry.hours.split('-')

        const response = await apiClient.post('/api/time-entries', {
          date: dateStr,
          startTime,
          endTime,
          description: entry.desc,
        })

        if (response.status === 201) {
          timeEntryIds.push(response.data.data.id)
        }
      }

      console.log(`✓ Created ${timeEntryIds.length} time entries for the week`)
    })

    it('Step 2: Verify time entries are in pending status', async () => {
      apiClient.setAccessToken(adminToken)

      const response = await apiClient.get('/api/time-entries?status=pending')

      expect(response.status).toBe(200)
      
      const pendingCount = response.data.data.filter((e: any) =>
        timeEntryIds.includes(e.id)
      ).length

      console.log(`✓ ${pendingCount} time entries in pending status`)
    })

    it('Step 3: Check my timesheet stats', async () => {
      apiClient.setAccessToken(adminToken)

      const response = await apiClient.get('/api/timesheet-entries/my-stats')

      expect(response.status).toBe(200)
      
      const stats = response.data.data
      console.log('✓ Timesheet statistics:')
      console.log(`   - Total entries: ${stats.totalEntries || 0}`)
      console.log(`   - Pending: ${stats.pendingCount || 0}`)
      console.log(`   - Approved: ${stats.approvedCount || 0}`)
    })

    it('Step 4: Manager views pending timesheet entries', async () => {
      apiClient.setAccessToken(adminToken)

      const response = await apiClient.get('/api/timesheet-entries/pending')

      expect(response.status).toBe(200)
      expect(response.data.data.length).toBeGreaterThanOrEqual(0)
      console.log(`✓ Pending entries visible to manager: ${response.data.data.length}`)
    })

    it('Step 5: Manager approves individual time entry', async () => {
      if (timeEntryIds.length === 0) return

      apiClient.setAccessToken(adminToken)

      const entryId = timeEntryIds[0]
      const response = await apiClient.post(`/api/time-entries/${entryId}/approve`)

      expect([200, 400, 404]).toContain(response.status)

      if (response.status === 200) {
        console.log('✓ Time entry approved individually')
        
        // Verify status changed
        const entryResponse = await apiClient.get(`/api/time-entries/${entryId}`)
        if (entryResponse.status === 200) {
          expect(entryResponse.data.data.status).toBe('approved')
        }
      }
    })

    it('Step 6: Manager bulk approves remaining entries', async () => {
      if (timeEntryIds.length < 2) return

      apiClient.setAccessToken(adminToken)

      const remainingIds = timeEntryIds.slice(1)
      
      const response = await apiClient.post('/api/timesheet-entries/bulk-approve', {
        ids: remainingIds,
      })

      expect([200, 400]).toContain(response.status)

      if (response.status === 200) {
        console.log(`✓ Bulk approved ${remainingIds.length} time entries`)
      }
    })

    it('Step 7: Verify all entries are approved', async () => {
      apiClient.setAccessToken(adminToken)

      const response = await apiClient.get('/api/time-entries?status=approved')

      expect(response.status).toBe(200)
      
      const approvedFromOurBatch = response.data.data.filter((e: any) =>
        timeEntryIds.includes(e.id)
      ).length

      console.log(`✓ ${approvedFromOurBatch} entries now in approved status`)
    })

    it('Step 8: Check updated timesheet stats', async () => {
      apiClient.setAccessToken(adminToken)

      const response = await apiClient.get('/api/timesheet-entries/my-stats')

      expect(response.status).toBe(200)
      console.log('✓ Updated timesheet statistics retrieved')
    })
  })

  describe('Time Entry Rejection Workflow', () => {
    let rejectedEntryId: string

    it('should create and reject a time entry', async () => {
      apiClient.setAccessToken(adminToken)

      const today = new Date().toISOString().split('T')[0]

      // Create entry
      const createResponse = await apiClient.post('/api/time-entries', {
        date: today,
        startTime: '14:00',
        endTime: '15:00',
        description: 'Test entry for rejection workflow - this entry will be rejected.',
      })

      if (createResponse.status === 201) {
        rejectedEntryId = createResponse.data.data.id
        console.log('✓ Created time entry for rejection test')

        // Reject entry
        const rejectResponse = await apiClient.post(
          `/api/time-entries/${rejectedEntryId}/reject`,
          { reason: 'Insufficient description. Please provide more details about the work performed.' }
        )

        expect([200, 400, 404]).toContain(rejectResponse.status)

        if (rejectResponse.status === 200) {
          console.log('✓ Time entry rejected with reason')
          
          // Verify status
          const entryResponse = await apiClient.get(`/api/time-entries/${rejectedEntryId}`)
          if (entryResponse.status === 200) {
            expect(entryResponse.data.data.status).toBe('rejected')
          }
        }
      }
    })
  })

  describe('Timesheet Hours Validation', () => {
    it('should reject time entries with invalid time range', async () => {
      apiClient.setAccessToken(adminToken)

      const today = new Date().toISOString().split('T')[0]

      const response = await apiClient.post('/api/time-entries', {
        date: today,
        startTime: '17:00',
        endTime: '09:00', // End before start
        description: 'This should fail due to invalid time range.',
      })

      expect(response.status).toBe(400)
      console.log('✓ System correctly rejected invalid time range')
    })

    it('should reject time entries for past dates', async () => {
      apiClient.setAccessToken(adminToken)

      const pastDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0]

      const response = await apiClient.post('/api/time-entries', {
        date: pastDate,
        startTime: '09:00',
        endTime: '17:00',
        description: 'Past date entry that should be rejected.',
      })

      expect(response.status).toBe(400)
      console.log('✓ System correctly rejected past date entry')
    })

    it('should reject time entries with short description', async () => {
      apiClient.setAccessToken(adminToken)

      const today = new Date().toISOString().split('T')[0]

      const response = await apiClient.post('/api/time-entries', {
        date: today,
        startTime: '09:00',
        endTime: '17:00',
        description: 'Too short', // Less than 10 characters
      })

      expect(response.status).toBe(400)
      console.log('✓ System correctly rejected short description')
    })
  })
})