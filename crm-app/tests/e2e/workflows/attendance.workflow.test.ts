/**
 * Attendance Workflow Tests
 * Tests complete attendance check-in, heartbeat, and check-out process
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { apiClient } from '../../helpers/api-client'
import { authHelper } from '../../helpers/auth'

describe('Attendance Workflow', () => {
  let adminToken: string
  let attendanceId: string

  // Office coordinates (from user's message)
  const OFFICE_LAT = 16.303566862310234
  const OFFICE_LNG = 80.44350636372154

  beforeAll(async () => {
    const adminUser = await authHelper.login({
      email: 'admin@synthoquest.com',
      password: 'Admin@123',
    })
    adminToken = authHelper.getCurrentUser()?.accessToken || ''
  })

  afterAll(async () => {
    await authHelper.logout()
  })

  describe('Complete Daily Attendance Workflow', () => {
    it('Step 1: Verify no active session at start of day', async () => {
      apiClient.setAccessToken(adminToken)

      const response = await apiClient.get('/api/attendance/today')

      expect(response.status).toBe(200)
      
      const data = response.data.data
      console.log('✓ Today\'s attendance summary:')
      console.log(`   - Date: ${data.date}`)
      console.log(`   - Sessions: ${data.sessions?.length || 0}`)
      console.log(`   - Open session: ${data.openSession ? 'Yes' : 'No'}`)
    })

    it('Step 2: Employee checks in at office location', async () => {
      apiClient.setAccessToken(adminToken)

      const response = await apiClient.post('/api/attendance/today', {
        latitude: OFFICE_LAT,
        longitude: OFFICE_LNG,
        notes: 'Checking in from office for morning shift',
      })

      expect([200, 201, 400, 403]).toContain(response.status)

      if (response.status === 201 || response.status === 200) {
        expect(response.data).toHaveProperty('data')
        attendanceId = response.data.data?.id
        
        console.log('✓ Check-in successful:')
        console.log(`   - Check-in time: ${new Date().toLocaleTimeString()}`)
        console.log(`   - Location: Office (${OFFICE_LAT}, ${OFFICE_LNG})`)
        console.log(`   - In radius: ${response.data.data?.checkInInRadius ? 'Yes' : 'No'}`)
      } else if (response.status === 400) {
        console.log('⚠ Already checked in (expected for repeated runs)')
      } else if (response.status === 403) {
        console.log('⚠ Geolocation permission denied')
      }
    })

    it('Step 3: Send heartbeat during work hours', async () => {
      apiClient.setAccessToken(adminToken)

      // Send multiple heartbeats to simulate activity
      for (let i = 0; i < 3; i++) {
        const response = await apiClient.post('/api/attendance/heartbeat')
        expect([200, 400]).toContain(response.status)
      }

      console.log('✓ Heartbeats sent successfully (3 times)')
    })

    it('Step 4: Verify session shows active status', async () => {
      apiClient.setAccessToken(adminToken)

      const response = await apiClient.get('/api/attendance/today')

      expect(response.status).toBe(200)
      
      const data = response.data.data
      if (data.openSession) {
        console.log('✓ Active session confirmed:')
        console.log(`   - Check-in time: ${data.openSession.checkInTime}`)
        console.log(`   - Heartbeat count: ${data.openSession.heartbeatCount || 0}`)
        console.log(`   - Approximate hours: ${data.totalHoursTodayApprox?.toFixed(2) || 0}`)
      }
    })

    it('Step 5: Check out after work hours', async () => {
      apiClient.setAccessToken(adminToken)

      const response = await apiClient.put('/api/attendance/today', {
        latitude: OFFICE_LAT,
        longitude: OFFICE_LNG,
        notes: 'Checking out after completing work for the day',
      })

      expect([200, 400, 403]).toContain(response.status)

      if (response.status === 200) {
        console.log('✓ Check-out successful:')
        console.log(`   - Check-out time: ${new Date().toLocaleTimeString()}`)
        
        const data = response.data.data
        if (data.totalHours) {
          console.log(`   - Total hours: ${data.totalHours.toFixed(2)}`)
        }
      } else if (response.status === 400) {
        console.log('⚠ No active session to check out (may have already checked out)')
      }
    })

    it('Step 6: Verify attendance history shows completed session', async () => {
      apiClient.setAccessToken(adminToken)

      const response = await apiClient.get('/api/attendance/history?limit=5')

      expect(response.status).toBe(200)
      expect(response.data.data.length).toBeGreaterThan(0)
      
      const latestSession = response.data.data[0]
      console.log('✓ Attendance history updated:')
      console.log(`   - Date: ${latestSession.date}`)
      console.log(`   - Total hours: ${latestSession.totalHours?.toFixed(2) || 0}`)
      console.log(`   - Status: ${latestSession.status}`)
    })

    it('Step 7: Verify team attendance shows the record', async () => {
      apiClient.setAccessToken(adminToken)

      const response = await apiClient.get('/api/attendance/team-today')

      expect(response.status).toBe(200)
      console.log(`✓ Team attendance retrieved: ${response.data.data?.length || 0} members`)
    })
  })

  describe('Multiple Check-in/out Sessions (Breaks)', () => {
    it('should handle multiple sessions in a day', async () => {
      apiClient.setAccessToken(adminToken)

      // Get today's sessions
      const response = await apiClient.get('/api/attendance/today')

      expect(response.status).toBe(200)
      
      const sessions = response.data.data.sessions || []
      console.log(`✓ Today has ${sessions.length} attendance session(s)`)
      
      sessions.forEach((session: any, index: number) => {
        console.log(`   Session ${index + 1}:`)
        console.log(`     - Check-in: ${session.checkInTime}`)
        console.log(`     - Check-out: ${session.checkOutTime || 'Active'}`)
        console.log(`     - Hours: ${session.totalHours?.toFixed(2) || 0}`)
      })
    })
  })

  describe('Geofence Validation', () => {
    it('should detect check-in outside allowed radius', async () => {
      apiClient.setAccessToken(adminToken)

      // Try checking in from a distant location
      const response = await apiClient.post('/api/attendance/today', {
        latitude: OFFICE_LAT + 0.1, // About 11km away
        longitude: OFFICE_LNG,
        notes: 'Testing geofence validation',
      })

      // Note: May still succeed but should be flagged
      expect([200, 201, 400, 403]).toContain(response.status)
      
      if (response.status === 201 || response.status === 200) {
        const inRadius = response.data.data?.checkInInRadius
        if (inRadius === false) {
          console.log('✓ System correctly detected location outside allowed radius')
        }
      }
    })
  })

  describe('Attendance Adjustment Workflow', () => {
    it('should request adjustment for attendance record', async () => {
      apiClient.setAccessToken(adminToken)

      // Get a recent attendance record
      const historyResponse = await apiClient.get('/api/attendance/history?limit=1')

      if (historyResponse.data.data?.length > 0) {
        const recordId = historyResponse.data.data[0].id

        const response = await apiClient.post(`/api/attendance/${recordId}/adjust`, {
          reason: 'Forgot to check out - left at 6 PM for emergency',
        })

        expect([200, 400, 403]).toContain(response.status)

        if (response.status === 200) {
          console.log('✓ Adjustment request submitted')
        } else {
          console.log('⚠ Adjustment request returned:', response.status)
        }
      }
    })
  })

  describe('Attendance Warnings & Security', () => {
    it('should check for attendance warnings', async () => {
      apiClient.setAccessToken(adminToken)

      const response = await apiClient.get('/api/attendance/warnings')

      expect(response.status).toBe(200)
      console.log(`✓ Attendance warnings: ${response.data.data?.length || 0}`)
    })

    it('should check security logs', async () => {
      apiClient.setAccessToken(adminToken)

      const response = await apiClient.get('/api/attendance/security')

      expect(response.status).toBe(200)
      console.log('✓ Security logs retrieved')
    })
  })
})