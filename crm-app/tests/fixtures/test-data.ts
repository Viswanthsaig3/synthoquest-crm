/**
 * Test Data Fixtures
 * Provides test data for different entities
 */

export const testUsers = {
  admin: {
    email: 'admin@synthoquest.com',
    password: 'Admin@123',
    name: 'Admin User',
    role: 'admin',
  },
  hr: {
    email: 'hr@synthoquest.com',
    password: 'HR@123',
    name: 'HR User',
    role: 'hr',
  },
  employee: {
    email: 'employee@synthoquest.com',
    password: 'Employee@123',
    name: 'Employee User',
    role: 'employee',
  },
}

export const newEmployee = {
  email: 'test.employee@example.com',
  name: 'Test Employee',
  password: 'TestPass123',
  phone: '+919876543210',
  department: 'engineering',
  role: 'employee',
  salary: 50000,
  compensationType: 'paid',
  compensationAmount: 50000,
}

export const newLead = {
  name: 'Test Lead',
  email: 'test.lead@example.com',
  phone: '+919876543211',
  alternatePhone: '+919876543212',
  courseInterested: 'Cyber Security',
  source: 'ads' as const,
  priority: 'hot' as const,
  notes: 'Interested in full course',
}

export const newTask = {
  title: 'Test Task for API Testing',
  description: 'This is a comprehensive test task',
  type: 'task' as const,
  priority: 'medium' as const,
  dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  estimatedHours: 2.5,
  tags: ['testing', 'api'],
  notes: 'Created during API testing',
}

export const newBug = {
  title: 'Test Bug Report',
  description: 'This is a test bug for API testing',
  severity: 'medium' as const,
  priority: 'high' as const,
  pageUrl: 'http://localhost:3000/test-page',
}

export const newIntern = {
  email: 'test.intern@example.com',
  password: 'InternPass123',
  name: 'Test Intern',
  phone: '+919876543213',
  department: 'engineering',
  compensationType: 'paid',
  compensationAmount: 5000,
  profile: {
    internshipType: 'paid' as const,
    duration: '3_months' as const,
    college: 'Test University',
    degree: 'B.Tech',
    year: '3rd',
    skills: ['python', 'javascript'],
    status: 'active' as const,
    source: 'website',
    notes: 'API test intern',
  },
}

export const attendanceCheckIn = {
  latitude: 12.9716,
  longitude: 77.5946,
  notes: 'Test check-in',
}

export const attendanceCheckOut = {
  latitude: 12.9716,
  longitude: 77.5946,
  notes: 'Test check-out',
}

export const newTimeEntry = {
  startTime: '09:00',
  endTime: '11:00',
  description: 'API testing time entry',
}

export const newLeave = {
  type: 'casual' as const,
  reason: 'API testing leave application - minimum 10 characters required',
}

export const newBatch = {
  name: 'Test Batch 2026',
  capacity: 30,
  course: 'Cyber Security',
  department: 'training',
}

export function getFutureDate(daysFromNow: number): string {
  const date = new Date()
  date.setDate(date.getDate() + daysFromNow)
  return date.toISOString().split('T')[0]
}

export function getTodayDate(): string {
  return new Date().toISOString().split('T')[0]
}