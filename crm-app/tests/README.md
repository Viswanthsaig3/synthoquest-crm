# API Testing Guide

## Overview

This project uses **Vitest** for API endpoint testing with a structured, production-ready approach.

## Test Structure

```
tests/
├── integration/           # API endpoint tests
│   ├── auth.test.ts       # Authentication endpoints
│   ├── employees.test.ts  # Employee management
│   ├── leads.test.ts      # Lead management
│   ├── tasks.test.ts      # Task management
│   ├── attendance.test.ts # Attendance tracking
│   ├── timesheet.test.ts  # Timesheet & leave management
│   ├── users.test.ts      # User management
│   ├── bugs.test.ts       # Bug tracking
│   ├── interns.test.ts    # Intern management
│   └── other.test.ts      # Misc endpoints (roles, payroll, etc.)
├── helpers/               # Test utilities
│   ├── api-client.ts      # API request helper
│   └── auth.ts            # Authentication helper
├── fixtures/              # Test data
│   └── test-data.ts       # Test data factories
└── setup.ts              # Global test setup
```

## Running Tests

### All Tests
```bash
npm test
```

### Run Once (CI mode)
```bash
npm run test:run
```

### Watch Mode
```bash
npm run test:watch
```

### Specific Test File
```bash
npm test -- auth.test.ts
```

### Integration Tests Only
```bash
npm run test:integration
```

### With Coverage
```bash
npm run test:coverage
```

## Test Configuration

Tests are configured in `vitest.config.ts`:
- **Environment**: jsdom (for React components)
- **Timeout**: 30 seconds
- **Coverage**: v8 provider

## Writing Tests

### Basic Test Structure
```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { apiClient } from '../helpers/api-client'
import { authHelper } from '../helpers/auth'

describe('Entity API', () => {
  beforeAll(async () => {
    await authHelper.login()
  })

  afterAll(async () => {
    await authHelper.logout()
  })

  describe('GET /api/entities', () => {
    it('should list entities', async () => {
      const response = await apiClient.get('/api/entities')

      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('data')
    })
  })
})
```

### Using Test Fixtures
```typescript
import { newEmployee } from '../fixtures/test-data'

it('should create employee', async () => {
  const response = await apiClient.post('/api/employees', {
    ...newEmployee,
    email: `test.${Date.now()}@example.com`, // Unique email
  })

  expect(response.status).toBe(201)
})
```

## Test Helpers

### API Client
```typescript
// GET request
const response = await apiClient.get('/api/endpoint')

// POST request
const response = await apiClient.post('/api/endpoint', { data })

// PUT request
const response = await apiClient.put('/api/endpoint', { data })

// DELETE request
const response = await apiClient.delete('/api/endpoint')
```

### Auth Helper
```typescript
// Login as admin
await authHelper.login()

// Login as specific user
await authHelper.login({
  email: 'hr@synthoquest.com',
  password: 'HR@123',
})

// Logout
await authHelper.logout()

// Get current user
const user = authHelper.getCurrentUser()
```

## Best Practices

1. **Isolate Tests**: Each test should be independent
2. **Clean Up**: Remove created resources in `afterAll`
3. **Use Fixtures**: Centralize test data
4. **Handle Edge Cases**: Test error scenarios
5. **Be Specific**: Use specific assertions

## Environment Variables

Tests use these environment variables:
- `NEXT_PUBLIC_APP_URL`: Base URL (default: http://localhost:3000)

## CI/CD Integration

```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test:run
```

## Troubleshooting

### Tests Failing
1. Ensure dev server is running: `npm run dev`
2. Check database connection
3. Verify test user credentials

### Timeout Errors
Increase timeout in test:
```typescript
it('long test', async () => {
  // ...
}, 60000) // 60 seconds
```

### Flaky Tests
- Avoid depending on test order
- Use unique identifiers
- Clean up created resources