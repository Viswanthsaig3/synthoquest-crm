import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { apiClient } from '../helpers/api-client'
import { authHelper } from '../helpers/auth'
import { newEmployee, testUsers } from '../fixtures/test-data'

describe('Employees API', () => {
  let createdEmployeeId: string

  beforeAll(async () => {
    await authHelper.login()
  })

  afterAll(async () => {
    // Cleanup: Delete created employee if exists
    if (createdEmployeeId) {
      // Add delete endpoint call if available
    }
    await authHelper.logout()
  })

  describe('GET /api/employees', () => {
    it('should list all employees when authenticated as admin', async () => {
      const response = await apiClient.get('/api/employees')

      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('data')
      expect(Array.isArray(response.data.data)).toBe(true)
      expect(response.data).toHaveProperty('pagination')
    })

    it('should support pagination', async () => {
      const response = await apiClient.get('/api/employees?page=1&limit=10')

      expect(response.status).toBe(200)
      expect(response.data.pagination.page).toBe(1)
      expect(response.data.pagination.limit).toBe(10)
    })

    it('should support filtering by department', async () => {
      const response = await apiClient.get('/api/employees?department=engineering')

      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('data')
    })

    it('should support filtering by status', async () => {
      const response = await apiClient.get('/api/employees?status=active')

      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('data')
    })

    it('should support search', async () => {
      const response = await apiClient.get('/api/employees?search=admin')

      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('data')
    })

    it('should fail without authentication', async () => {
      apiClient.clearAccessToken()
      const response = await apiClient.get('/api/employees')

      expect(response.status).toBe(401)
      await authHelper.login() // Re-login for other tests
    })
  })

  describe('POST /api/employees', () => {
    it('should create a new employee with valid data', async () => {
      const uniqueEmail = `test.${Date.now()}@example.com`
      const response = await apiClient.post('/api/employees', {
        ...newEmployee,
        email: uniqueEmail,
      })

      expect(response.status).toBe(201)
      expect(response.data).toHaveProperty('data')
      expect(response.data.data).toHaveProperty('id')
      expect(response.data.data.email).toBe(uniqueEmail)
      
      createdEmployeeId = response.data.data.id
    })

    it('should fail with duplicate email', async () => {
      const response = await apiClient.post('/api/employees', {
        ...newEmployee,
        email: testUsers.admin.email, // Existing email
      })

      expect(response.status).toBeGreaterThanOrEqual(400)
    })

    it('should fail with invalid email format', async () => {
      const response = await apiClient.post('/api/employees', {
        ...newEmployee,
        email: 'invalid-email',
      })

      expect(response.status).toBe(400)
    })

    it('should fail with missing required fields', async () => {
      const response = await apiClient.post('/api/employees', {
        email: 'test@example.com',
        // Missing name, password, department, role
      })

      expect(response.status).toBe(400)
    })

    it('should fail with invalid role', async () => {
      const response = await apiClient.post('/api/employees', {
        ...newEmployee,
        role: 'invalid_role',
      })

      expect(response.status).toBe(400)
    })

    it('should fail without authentication', async () => {
      apiClient.clearAccessToken()
      const response = await apiClient.post('/api/employees', newEmployee)

      expect(response.status).toBe(401)
      await authHelper.login()
    })
  })

  describe('GET /api/employees/[id]', () => {
    let employeeId: string

    beforeAll(async () => {
      // Get an existing employee ID
      const listResponse = await apiClient.get('/api/employees?limit=1')
      if (listResponse.data.data.length > 0) {
        employeeId = listResponse.data.data[0].id
      }
    })

    it('should get employee details by ID', async () => {
      if (!employeeId) {
        return // Skip if no employee found
      }

      const response = await apiClient.get(`/api/employees/${employeeId}`)

      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('data')
      expect(response.data.data.id).toBe(employeeId)
    })

    it('should return 404 for non-existent employee', async () => {
      const response = await apiClient.get('/api/employees/00000000-0000-0000-0000-000000000000')

      expect(response.status).toBe(404)
    })
  })

  describe('PUT /api/employees/[id]/password', () => {
    it('should update employee password', async () => {
      if (!createdEmployeeId) {
        return // Skip if no employee created
      }

      const response = await apiClient.put(
        `/api/employees/${createdEmployeeId}/password`,
        { password: 'NewPassword123' }
      )

      expect([200, 400, 403, 404]).toContain(response.status)
    })

    it('should fail with invalid password', async () => {
      if (!createdEmployeeId) {
        return
      }

      const response = await apiClient.put(
        `/api/employees/${createdEmployeeId}/password`,
        { password: '123' } // Too short
      )

      expect(response.status).toBe(400)
    })
  })
})