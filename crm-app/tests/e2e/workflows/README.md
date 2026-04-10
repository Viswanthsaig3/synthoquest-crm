# Workflow Tests Documentation

## Overview

This directory contains **end-to-end workflow tests** that simulate real business processes in the SynthoQuest CRM system. Unlike unit tests that test individual endpoints, workflow tests validate complete business scenarios from start to finish.

## Test Files

| File | Workflow | Tests |
|------|----------|-------|
| `task-management.workflow.test.ts` | Task lifecycle from creation to completion | 14 tests |
| `leave-approval.workflow.test.ts` | Leave application and approval process | 12 tests |
| `timesheet-approval.workflow.test.ts` | Timesheet submission and approval | 11 tests |
| `attendance.workflow.test.ts` | Daily attendance check-in/out process | 12 tests |
| `lead-management.workflow.test.ts` | Lead lifecycle from inquiry to conversion | 15 tests |
| `intern-onboarding.workflow.test.ts` | Intern application to activation | 12 tests |

## Workflow Descriptions

### 1. Task Management Workflow

**Business Scenario:** Administrator assigns a task to an employee, who completes it with time tracking.

```
Admin creates task → Assigns to employee → Employee starts → 
Logs time → Completes with remarks → Admin reviews
```

**Tests:**
- Task creation with assignment
- Task visibility in assigned list
- Task start/progress tracking
- Time logging against task
- Task completion with remarks
- Task reassignment workflow
- Task cancellation workflow

### 2. Leave Approval Workflow

**Business Scenario:** Employee applies for leave, manager reviews and approves/rejects.

```
Employee checks balance → Applies for leave → Manager views pending → 
Approves/Rejects → Balance updated → Leave recorded
```

**Tests:**
- Leave balance check
- Leave application submission
- Pending leave visibility
- Leave approval process
- Leave rejection with reason
- Leave cancellation
- Balance validation

### 3. Timesheet Approval Workflow

**Business Scenario:** Employee logs weekly work hours, manager reviews and approves.

```
Employee logs time entries → Submits timesheet → Manager reviews → 
Approves/Rejects entries → Stats updated
```

**Tests:**
- Weekly time entry logging
- Pending entry visibility
- Individual entry approval
- Bulk approval process
- Time validation rules
- Rejection workflow
- Stats tracking

### 4. Attendance Workflow

**Business Scenario:** Employee checks in at office, system tracks activity, checks out at end of day.

```
Check-in with location → Heartbeat during work → 
Check-out with location → Hours calculated → History updated
```

**Tests:**
- Check-in with geolocation
- Heartbeat/activity tracking
- Check-out process
- Hours calculation
- Multiple sessions (breaks)
- Geofence validation
- Adjustment requests
- Security logs

### 5. Lead Management Workflow

**Business Scenario:** Lead inquires through website, gets claimed, followed up, and converted.

```
Lead created → Claimed by sales → Follow-ups logged → 
Qualified → Converted to student
```

**Tests:**
- Lead creation from inquiry
- Lead claiming process
- Activity/call logging
- Priority management
- Qualification checklist
- Conversion process
- Source tracking
- Performance metrics

### 6. Intern Onboarding Workflow

**Business Scenario:** Intern applies, HR reviews, approves, assigns mentor, creates initial tasks.

```
Intern applies → HR reviews profile → Approves/rejects → 
Assigns mentor → Creates onboarding tasks → Intern starts
```

**Tests:**
- Application submission
- Profile review
- Approval process
- Mentor assignment
- Task assignment
- Performance tracking
- Rejection handling
- Completion process

## Running Workflow Tests

### Run All Workflow Tests
```bash
npm run test:e2e
```

### Run Specific Workflow
```bash
npm test -- task-management.workflow.test.ts
npm test -- leave-approval.workflow.test.ts
npm test -- timesheet-approval.workflow.test.ts
npm test -- attendance.workflow.test.ts
npm test -- lead-management.workflow.test.ts
npm test -- intern-onboarding.workflow.test.ts
```

### Run with Verbose Output
```bash
npm test -- --reporter=verbose task-management.workflow.test.ts
```

### Run in Watch Mode (for development)
```bash
npm run test:watch -- --reporter=verbose
```

## Test Data Requirements

### Users Needed
- **Admin user**: `admin@synthoquest.com` / `Admin@123`
- **HR user**: For approval workflows (optional, admin can act as HR)
- **Employee users**: For task assignment testing
- **Intern users**: Created during test execution

### Database State
- Tests should be idempotent (can run multiple times)
- Cleanup happens in `afterAll` hooks
- Tests use unique identifiers (timestamps) to avoid conflicts

## Best Practices

### 1. Isolation
Each workflow test is self-contained and cleans up after itself:
```typescript
afterAll(async () => {
  // Cleanup created resources
  if (taskId) {
    await apiClient.post(`/api/tasks/${taskId}/cancel`, { reason: 'Cleanup' })
  }
})
```

### 2. Realistic Data
Use realistic test data that mirrors actual business scenarios:
```typescript
const taskData = {
  title: 'Complete API Documentation',
  description: 'Document all endpoints with examples...',  // Realistic description
  estimatedHours: 8,  // Reasonable estimate
}
```

### 3. Multiple Scenarios
Test both happy path and edge cases:
- ✅ Successful workflow completion
- ✅ Validation failures
- ✅ Permission denied scenarios
- ✅ Not found cases

### 4. Progress Logging
Log key steps for debugging:
```typescript
console.log('✓ Task created successfully')
console.log(`   - ID: ${taskId}`)
console.log(`   - Status: ${response.data.data.status}`)
```

## CI/CD Integration

Add to your CI pipeline:
```yaml
# .github/workflows/test.yml
- name: Run Workflow Tests
  run: npm run test:e2e
  env:
    NEXT_PUBLIC_APP_URL: http://localhost:3000
```

## Extending Tests

To add a new workflow test:

1. Create file: `tests/e2e/workflows/[workflow-name].workflow.test.ts`
2. Use the template:
```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { apiClient } from '../helpers/api-client'
import { authHelper } from '../helpers/auth'

describe('New Workflow', () => {
  beforeAll(async () => {
    // Setup
  })

  afterAll(async () => {
    // Cleanup
  })

  describe('Complete Process', () => {
    it('Step 1: Description', async () => {
      // Test code
    })
  })
})
```

## Debugging Failed Tests

### 1. Check Server Status
```bash
curl http://localhost:3000/api/auth/me -H "Authorization: Bearer $TOKEN"
```

### 2. View Detailed Logs
```bash
npm test -- --reporter=verbose workflow-name.test.ts
```

### 3. Check Database State
```sql
SELECT * FROM tasks WHERE title LIKE '%Test%' ORDER BY created_at DESC LIMIT 5;
```

### 4. Common Issues
- **401 Unauthorized**: Token expired, re-login
- **404 Not Found**: Resource deleted or wrong ID
- **400 Bad Request**: Validation failed, check request body
- **500 Internal Error**: Server error, check logs

## Test Metrics

Current coverage:
- **76 integration tests** (endpoint tests)
- **76 workflow tests** (end-to-end scenarios)
- **152 total tests**

Run time: ~2-3 minutes for all tests