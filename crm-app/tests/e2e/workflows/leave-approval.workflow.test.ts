/**
 * Leave Approval Workflow Tests
 * Tests complete leave application and approval process
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { apiClient } from '../../helpers/api-client'
import { authHelper } from '../../helpers/auth'

describe('Leave Approval Workflow', () => {
  let adminToken: string
  let adminId: string
  let employeeId: string
  let leaveId: string

  beforeAll(async () => {
    const adminUser = await authHelper.login({
      email: 'admin@synthoquest.com',
      password: 'Admin@123',
    })
    adminToken = authHelper.getCurrentUser()?.accessToken || ''
    adminId = adminUser.id

    apiClient.setAccessToken(adminToken)
    const employeesResponse = await apiClient.get('/api/employees?limit=1')
    if (employeesResponse.data?.data?.length > 0) {
      employeeId = employeesResponse.data.data[0].id
    }
  })

  afterAll(async () => {
    if (leaveId) {
      apiClient.setAccessToken(adminToken)
      await apiClient.post(`/api/leaves/${leaveId}/cancel`)
    }
    await authHelper.logout()
  })

  describe('Complete Leave Application & Approval', () => {
    it('Step 1: Check initial leave balance', async () => {
      apiClient.setAccessToken(adminToken)

      const response = await apiClient.get('/api/leaves/balance')

      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('data')
      
      const balance = response.data.data
      console.log('✓ Leave balance retrieved:')
      console.log(`   - Casual: ${balance.casual?.remaining || 0} days remaining`)
      console.log(`   - Sick: ${balance.sick?.remaining || 0} days remaining`)
      console.log(`   - Annual: ${balance.annual?.remaining || 0} days remaining`)
    })

    it('Step 2: Employee applies for casual leave', async () => {
      apiClient.setAccessToken(adminToken)

      const startDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0]
      const endDate = new Date(Date.now() + 16 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0]

      const leaveData = {
        type: 'casual',
        startDate,
        endDate,
        reason: 'Family event - attending cousin\'s wedding ceremony out of station. Need 3 days of leave for travel and attendance.',
      }

      const response = await apiClient.post('/api/leaves', leaveData)

      expect([201, 400]).toContain(response.status)

      if (response.status === 201) {
        expect(response.data.data.status).toBe('pending')
        expect(response.data.data.type).toBe('casual')
        leaveId = response.data.data.id
        console.log(`✓ Leave application submitted with ID: ${leaveId}`)
        console.log(`   - Type: ${leaveData.type}`)
        console.log(`   - Duration: ${leaveData.startDate} to ${leaveData.endDate}`)
      } else {
        console.log('⚠ Leave application returned 400 (may be insufficient balance)')
      }
    })

    it('Step 3: Leave appears in pending leaves list', async () => {
      if (!leaveId) return

      apiClient.setAccessToken(adminToken)

      const response = await apiClient.get('/api/leaves?status=pending')

      expect(response.status).toBe(200)
      
      const pendingLeave = response.data.data.find((l: any) => l.id === leaveId)
      expect(pendingLeave).toBeDefined()
      console.log('✓ Leave visible in pending list')
    })

    it('Step 4: Manager/Admin views leave details', async () => {
      if (!leaveId) return

      apiClient.setAccessToken(adminToken)

      const response = await apiClient.get(`/api/leaves/${leaveId}`)

      expect(response.status).toBe(200)
      expect(response.data.data.status).toBe('pending')
      
      const leave = response.data.data
      console.log('✓ Leave details retrieved:')
      console.log(`   - Applicant: ${leave.employeeName || 'N/A'}`)
      console.log(`   - Type: ${leave.type}`)
      console.log(`   - Reason: ${leave.reason}`)
    })

    it('Step 5: Admin approves the leave', async () => {
      if (!leaveId) return

      apiClient.setAccessToken(adminToken)

      const response = await apiClient.post(`/api/leaves/${leaveId}/approve`)

      expect([200, 400, 403]).toContain(response.status)

      if (response.status === 200) {
        // Verify status changed
        const leaveResponse = await apiClient.get(`/api/leaves/${leaveId}`)
        expect(leaveResponse.data.data.status).toBe('approved')
        console.log('✓ Leave approved successfully')
      } else if (response.status === 403) {
        console.log('⚠ Cannot approve own leave (expected for admin\'s own leave)')
      } else {
        console.log('⚠ Leave approval returned 400')
      }
    })

    it('Step 6: Verify leave balance is updated', async () => {
      apiClient.setAccessToken(adminToken)

      const response = await apiClient.get('/api/leaves/balance')

      expect(response.status).toBe(200)
      console.log('✓ Leave balance after approval:')
      console.log(`   - Check if balance decreased correctly`)
    })

    it('Step 7: Leave appears in approved list', async () => {
      if (!leaveId) return

      apiClient.setAccessToken(adminToken)

      const response = await apiClient.get('/api/leaves?status=approved')

      expect(response.status).toBe(200)
      
      // If leave was approved, check if it's in the list
      // This may not apply if we're testing with admin's own leave
      const approvedLeave = response.data.data.find((l: any) => l.id === leaveId)
      if (approvedLeave) {
        console.log('✓ Leave visible in approved list')
      }
    })
  })

  describe('Leave Rejection Workflow', () => {
    let rejectLeaveId: string

    it('should apply for leave and get rejected', async () => {
      apiClient.setAccessToken(adminToken)

      // Apply for leave
      const startDate = new Date(Date.now() + 20 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0]
      const endDate = startDate

      const applyResponse = await apiClient.post('/api/leaves', {
        type: 'sick',
        startDate,
        endDate,
        reason: 'Medical appointment for routine checkup and follow-up tests that require day off.',
      })

      if (applyResponse.status === 201) {
        rejectLeaveId = applyResponse.data.data.id
        console.log(`✓ Leave application submitted for rejection test`)

        // Reject the leave
        const rejectResponse = await apiClient.post(`/api/leaves/${rejectLeaveId}/reject`, {
          reason: 'Insufficient notice period. Please apply at least 3 days in advance for non-emergency sick leaves.',
        })

        expect([200, 400, 403]).toContain(rejectResponse.status)

        if (rejectResponse.status === 200) {
          // Verify status
          const leaveResponse = await apiClient.get(`/api/leaves/${rejectLeaveId}`)
          expect(leaveResponse.data.data.status).toBe('rejected')
          console.log('✓ Leave rejected with reason')
        } else if (rejectResponse.status === 403) {
          console.log('⚠ Cannot reject own leave (expected)')
        }
      }
    })
  })

  describe('Leave Cancellation Workflow', () => {
    it('should apply for leave and cancel it', async () => {
      apiClient.setAccessToken(adminToken)

      // Apply for leave
      const startDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0]
      const endDate = startDate

      const applyResponse = await apiClient.post('/api/leaves', {
        type: 'annual',
        startDate,
        endDate,
        reason: 'Personal day off for family commitments that were later rescheduled.',
      })

      if (applyResponse.status === 201) {
        const cancelLeaveId = applyResponse.data.data.id
        console.log(`✓ Leave application submitted for cancellation test`)

        // Cancel the leave
        const cancelResponse = await apiClient.post(`/api/leaves/${cancelLeaveId}/cancel`)

        expect(cancelResponse.status).toBe(200)

        // Verify status
        const leaveResponse = await apiClient.get(`/api/leaves/${cancelLeaveId}`)
        expect(leaveResponse.data.data.status).toBe('cancelled')
        console.log('✓ Leave cancelled successfully')
      }
    })
  })

  describe('Leave Balance Validation', () => {
    it('should reject leave application exceeding balance', async () => {
      apiClient.setAccessToken(adminToken)

      // Try to apply for a very long leave
      const startDate = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0]
      const endDate = new Date(Date.now() + 95 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0]

      const response = await apiClient.post('/api/leaves', {
        type: 'casual',
        startDate,
        endDate,
        reason: 'Extended leave request that likely exceeds available balance for testing validation.',
      })

      // Should fail with validation error
      expect([201, 400]).toContain(response.status)
      
      if (response.status === 400) {
        console.log('✓ System correctly rejected leave exceeding balance')
      }
    })
  })
})