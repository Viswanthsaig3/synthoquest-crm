# Phase 3: Timesheets

> **Duration**: Week 3-4 | **Priority**: HIGH | **Dependencies**: Phase 1, Phase 2

---

## Objective

Implement a comprehensive timesheet management system with submission, approval workflow, and reporting capabilities.

---

## Features

### 1. Timesheet Entry
- Daily time entry
- Project/task allocation
- Break time tracking
- Notes and comments

### 2. Daily Timesheet
- Daily view of entries
- Auto-calculation of hours
- Validation of entries
- Draft/Submitted states

### 3. Approval Workflow
- Submit timesheet
- Manager review
- Approve/Reject with feedback
- Resubmission capability

### 4. Reporting
- Hours summary
- Project breakdown
- Employee comparison
- Export capabilities

---

## Database Schema

### Timesheets Table
```
Table: timesheets

Fields:
- id: UUID, primary key
- employee_id: UUID, foreign key to users.id, not null
- work_date: DATE, not null
- total_hours: DECIMAL(5,2), default 0
- regular_hours: DECIMAL(5,2), default 0
- overtime_hours: DECIMAL(5,2), default 0
- status: VARCHAR(20), default 'draft'
  - draft: Being edited
  - submitted: Pending approval
  - approved: Approved by manager
  - rejected: Rejected, needs revision
- submitted_at: TIMESTAMPTZ
- submitted_by: UUID, foreign key to users.id
- approved_at: TIMESTAMPTZ
- approved_by: UUID, foreign key to users.id
- rejected_at: TIMESTAMPTZ
- rejected_by: UUID, foreign key to users.id
- rejection_reason: TEXT
- notes: TEXT
- created_at: TIMESTAMPTZ, default now()
- updated_at: TIMESTAMPTZ, default now()
- deleted_at: TIMESTAMPTZ (soft delete)

Indexes:
- idx_timesheets_employee_id on employee_id
- idx_timesheets_work_date on work_date
- idx_timesheets_status on status
- idx_timesheets_employee_date on (employee_id, work_date)

Constraints:
- employee_id must exist in users table
- one daily timesheet per employee per work_date
- status must be one of defined values
- unique (employee_id, work_date, deleted_at)
```

### Timesheet Entries Table
```
Table: timesheet_entries

Fields:
- id: UUID, primary key
- timesheet_id: UUID, foreign key to timesheets.id, not null
- date: DATE, not null
- project_id: UUID, foreign key to projects.id (optional)
- task_id: UUID, foreign key to tasks.id (optional)
- description: TEXT
- start_time: TIME
- end_time: TIME
- break_minutes: INTEGER, default 0
- total_hours: DECIMAL(4,2), not null
- billable: BOOLEAN, default true
- location: VARCHAR(100) (office, remote, client_site)
- created_at: TIMESTAMPTZ, default now()
- updated_at: TIMESTAMPTZ, default now()

Indexes:
- idx_timesheet_entries_timesheet_id on timesheet_id
- idx_timesheet_entries_date on date
- idx_timesheet_entries_project_id on project_id

Constraints:
- timesheet_id must exist in timesheets table
- date must match timesheet work date
- total_hours must be positive
- Cascade delete on timesheet delete
```

### Timesheet Approvals Table
```
Table: timesheet_approvals

Fields:
- id: UUID, primary key
- timesheet_id: UUID, foreign key to timesheets.id, not null
- approver_id: UUID, foreign key to users.id, not null
- action: VARCHAR(20), not null (approved, rejected)
- comments: TEXT
- created_at: TIMESTAMPTZ, default now()

Indexes:
- idx_timesheet_approvals_timesheet_id on timesheet_id
- idx_timesheet_approvals_approver_id on approver_id

Constraints:
- timesheet_id must exist in timesheets table
- approver_id must exist in users table
- action must be 'approved' or 'rejected'
```

### Timesheet Comments Table
```
Table: timesheet_comments

Fields:
- id: UUID, primary key
- timesheet_id: UUID, foreign key to timesheets.id, not null
- user_id: UUID, foreign key to users.id, not null
- comment: TEXT, not null
- created_at: TIMESTAMPTZ, default now()

Indexes:
- idx_timesheet_comments_timesheet_id on timesheet_id
- idx_timesheet_comments_user_id on user_id

Constraints:
- timesheet_id must exist in timesheets table
- user_id must exist in users table
- Cascade delete on timesheet delete
```

---

## Timesheet Workflow

### State Machine
```
[DRAFT] ──submit──> [SUBMITTED] ──approve──> [APPROVED]
                          │
                          └──reject──> [REJECTED] ──edit──> [DRAFT]
```

### Transitions

**Draft → Submitted**
- Trigger: Employee clicks "Submit"
- Validation:
  - All required entries filled
  - Total hours > 0
  - No future dates
- Actions:
  - Set status to 'submitted'
  - Set submitted_at, submitted_by
  - Notify approver

**Submitted → Approved**
- Trigger: Manager clicks "Approve"
- Permission: timesheets.approve
- Validation:
  - User is approver for employee
  - Timesheet in 'submitted' state
- Actions:
  - Set status to 'approved'
  - Set approved_at, approved_by
  - Create approval record
  - Notify employee

**Submitted → Rejected**
- Trigger: Manager clicks "Reject"
- Permission: timesheets.approve
- Validation:
  - User is approver for employee
  - Timesheet in 'submitted' state
  - Reason provided
- Actions:
  - Set status to 'rejected'
  - Set rejected_at, rejected_by, rejection_reason
  - Create approval record
  - Notify employee

**Rejected → Draft**
- Trigger: Employee clicks "Edit"
- Validation:
  - Timesheet in 'rejected' state
  - User is timesheet owner
- Actions:
  - Set status to 'draft'
  - Clear rejection fields
  - Allow editing

---

## API Endpoints

### Timesheet Endpoints

#### GET /api/timesheets
```
Purpose: List timesheets

Headers:
- Authorization: Bearer {accessToken}

Query Parameters:
- page: integer
- limit: integer
- status: string (draft, submitted, approved, rejected)
- employee_id: string (admin/HR only)
- work_date: date (YYYY-MM-DD)
- from_date: date
- to_date: date

Permission:
- timesheets.view_all: See all timesheets
- Default: See own timesheets only

Process:
1. Verify authentication
2. Check permission
3. Build query based on permission
4. Apply filters
5. Execute paginated query
6. Return timesheets

Response (200):
{
  "data": [
    {
      "id": "uuid",
      "work_date": "2026-04-07",
      "total_hours": 40.5,
      "status": "submitted",
      "employee": { "id": "...", "name": "..." },
      ...
    }
  ],
  "pagination": { ... }
}

Errors:
- 401: Unauthorized
```

#### POST /api/timesheets
```
Purpose: Create new daily timesheet

Headers:
- Authorization: Bearer {accessToken}

Permission: timesheets.submit (or own)

Request Body:
{
  "work_date": "2026-04-07",
  "notes": "Optional notes"
}

Validation:
- work_date is required
- No existing timesheet for same employee/day (unless deleted)
- work_date cannot be invalid

Process:
1. Verify authentication
2. Validate input
3. Create timesheet
5. Return timesheet

Response (201):
{
  "data": {
    "id": "uuid",
    "work_date": "2026-04-07",
    "status": "draft",
    ...
  }
}

Errors:
- 400: Invalid input
- 401: Unauthorized
- 409: Timesheet already exists
```

#### GET /api/timesheets/:id
```
Purpose: Get timesheet details with entries

Headers:
- Authorization: Bearer {accessToken}

Permission:
- timesheets.view_all
- Own timesheet

Process:
1. Verify authentication
2. Check permission
3. Fetch timesheet
4. Fetch all entries
5. Calculate totals
6. Return timesheet with entries

Response (200):
{
  "data": {
    "id": "uuid",
    "work_date": "2026-04-07",
    "total_hours": 40.5,
    "regular_hours": 40,
    "overtime_hours": 0.5,
    "status": "submitted",
    "entries": [
      {
        "id": "uuid",
        "date": "2026-04-07",
        "total_hours": 8.5,
        "description": "...",
        ...
      }
    ],
    "approvals": [ ... ],
    "comments": [ ... ]
  }
}

Errors:
- 401: Unauthorized
- 403: Forbidden
- 404: Timesheet not found
```

#### PUT /api/timesheets/:id
```
Purpose: Update timesheet (only in draft status)

Headers:
- Authorization: Bearer {accessToken}

Permission: Own timesheet only

Request Body:
{
  "notes": "Updated notes"
}

Validation:
- Timesheet must be in 'draft' status
- User must be owner

Process:
1. Verify authentication
2. Check ownership
3. Check status
4. Update timesheet
5. Return updated timesheet

Response (200):
{
  "data": { ... }
}

Errors:
- 400: Invalid status
- 401: Unauthorized
- 403: Forbidden
- 404: Timesheet not found
```

#### POST /api/timesheets/:id/submit
```
Purpose: Submit timesheet for approval

Headers:
- Authorization: Bearer {accessToken}

Permission: Own timesheet only

Validation:
- Timesheet in 'draft' status
- Has at least one entry
- Total hours > 0
- No future dates

Process:
1. Verify authentication
2. Check ownership
3. Validate timesheet
4. Update status to 'submitted'
5. Set submitted_at, submitted_by
6. Determine approver
7. Send notification
8. Return timesheet

Response (200):
{
  "data": { ... },
  "message": "Timesheet submitted for approval"
}

Errors:
- 400: Invalid status, no entries
- 401: Unauthorized
- 403: Forbidden
- 404: Timesheet not found
```

#### POST /api/timesheets/:id/approve
```
Purpose: Approve timesheet

Headers:
- Authorization: Bearer {accessToken}

Permission: timesheets.approve

Request Body:
{
  "comments": "Optional approval comments"
}

Validation:
- Timesheet in 'submitted' status
- User is approver for employee

Process:
1. Verify authentication
2. Check permission
3. Validate approver
4. Update status to 'approved'
5. Set approved_at, approved_by
6. Create approval record
7. Send notification
8. Return timesheet

Response (200):
{
  "data": { ... },
  "message": "Timesheet approved"
}

Errors:
- 400: Invalid status
- 401: Unauthorized
- 403: Forbidden (not approver)
- 404: Timesheet not found
```

#### POST /api/timesheets/:id/reject
```
Purpose: Reject timesheet

Headers:
- Authorization: Bearer {accessToken}

Permission: timesheets.approve

Request Body:
{
  "reason": "Required rejection reason"
}

Validation:
- Timesheet in 'submitted' status
- User is approver for employee
- Reason provided

Process:
1. Verify authentication
2. Check permission
3. Validate approver
4. Update status to 'rejected'
5. Set rejected_at, rejected_by, rejection_reason
6. Create approval record
7. Send notification
8. Return timesheet

Response (200):
{
  "data": { ... },
  "message": "Timesheet rejected"
}

Errors:
- 400: Invalid status, no reason
- 401: Unauthorized
- 403: Forbidden (not approver)
- 404: Timesheet not found
```

### Timesheet Entry Endpoints

#### GET /api/timesheets/:id/entries
```
Purpose: Get all entries for a timesheet

Headers:
- Authorization: Bearer {accessToken}

Permission:
- timesheets.view_all
- Own timesheet

Process:
1. Verify authentication
2. Check permission
3. Fetch all entries
4. Group by date
5. Return entries

Response (200):
{
  "data": [
    {
      "date": "2026-04-07",
      "entries": [ ... ]
    }
  ]
}

Errors:
- 401: Unauthorized
- 403: Forbidden
- 404: Timesheet not found
```

#### POST /api/timesheets/:id/entries
```
Purpose: Add entry to timesheet

Headers:
- Authorization: Bearer {accessToken}

Permission: Own timesheet only

Request Body:
{
  "date": "2026-04-07",
  "start_time": "09:00",
  "end_time": "17:30",
  "break_minutes": 30,
  "description": "Worked on project X",
  "project_id": "uuid",
  "task_id": "uuid",
  "billable": true,
  "location": "office"
}

Validation:
- Timesheet in 'draft' status
- Date must match timesheet work date
- start_time < end_time
- total_hours calculated correctly

Process:
1. Verify authentication
2. Check ownership and status
3. Validate input
4. Calculate total_hours
5. Create entry
6. Update timesheet totals
7. Return entry

Response (201):
{
  "data": { ... }
}

Errors:
- 400: Invalid input
- 401: Unauthorized
- 403: Forbidden
- 404: Timesheet not found
```

#### PUT /api/timesheet-entries/:id
```
Purpose: Update timesheet entry

Headers:
- Authorization: Bearer {accessToken}

Permission: Own timesheet entry only

Validation:
- Timesheet in 'draft' status

Process:
1. Verify authentication
2. Check ownership and status
3. Validate input
4. Update entry
5. Recalculate timesheet totals
6. Return entry

Response (200):
{
  "data": { ... }
}

Errors:
- 400: Invalid status
- 401: Unauthorized
- 403: Forbidden
- 404: Entry not found
```

#### DELETE /api/timesheet-entries/:id
```
Purpose: Delete timesheet entry

Headers:
- Authorization: Bearer {accessToken}

Permission: Own timesheet entry only

Validation:
- Timesheet in 'draft' status

Process:
1. Verify authentication
2. Check ownership and status
3. Delete entry
4. Recalculate timesheet totals
5. Return success

Response (200):
{
  "message": "Entry deleted"
}

Errors:
- 400: Invalid status
- 401: Unauthorized
- 403: Forbidden
- 404: Entry not found
```

---

## Hours Calculation

### Rules
```
Regular Hours: Up to 8 hours per day
Overtime Hours: Hours > 8 per day

Daily Calculation:
- Total Hours = Sum of all entries on work_date
- Regular Hours = Min(Total, 8)
- Overtime Hours = Max(0, Total - 8)

Daily Calculation:
- total_hours = end_time - start_time - break_minutes
```

### Validation Rules
```
- Minimum entry: 0.25 hours (15 minutes)
- Maximum entry: 24 hours
- Break time cannot exceed work time
- Start time must be before end time
- No overlapping entries for same time slot
```

---

## Approver Logic

### Approver Determination
```
If employee.role == 'employee':
  approver = employee.managed_by (team lead)

If employee.role == 'sales_rep':
  approver = employee.managed_by (team lead or HR)

If employee.role == 'team_lead':
  approver = HR or admin

If employee.role == 'hr':
  approver = admin
```

### Approval Hierarchy
```
1. Direct manager/Team Lead
2. HR (fallback if no manager)
3. Admin (can approve any)
```

---

## Notifications

### Events
```
- Timesheet submitted → Notify approver
- Timesheet approved → Notify employee
- Timesheet rejected → Notify employee
- Timesheet overdue → Notify employee and approver
```

### Notification Channels
```
- In-app notification
- Email (optional, configurable)
- Slack integration (future)
```

---

## Reporting

### Employee Report
```
Metrics:
- Total hours (weekly, monthly)
- Regular vs overtime breakdown
- Project allocation
- Submission timeliness
- Approval turnaround

Format:
- Table view
- Chart view
- Export to CSV/PDF
```

### Manager Report
```
Metrics:
- Team hours summary
- Pending approvals count
- Approval status breakdown
- Employee comparison

Format:
- Dashboard view
- Detailed report
- Export
```

### Admin/HR Report
```
Metrics:
- Organization-wide hours
- Department breakdown
- Overtime costs
- Compliance tracking

Format:
- Summary dashboard
- Detailed reports
- Export
```

---

## Testing Checklist

### Timesheet Creation Tests
- [ ] Create timesheet for valid date
- [ ] Cannot create duplicate timesheet
- [ ] Cannot create for invalid date
- [ ] Cannot create for far future/past if policy enforces

### Entry Tests
- [ ] Add entry with valid data
- [ ] Calculate hours correctly
- [ ] Validate time range
- [ ] Prevent overlapping entries
- [ ] Update entry in draft
- [ ] Delete entry in draft
- [ ] Cannot edit in submitted status

### Workflow Tests
- [ ] Submit timesheet (draft → submitted)
- [ ] Approve timesheet (submitted → approved)
- [ ] Reject timesheet (submitted → rejected)
- [ ] Edit rejected timesheet (rejected → draft)
- [ ] Permission checks for each action
- [ ] Notification triggers correctly

### Calculation Tests
- [ ] Total hours calculation
- [ ] Regular/overtime split
- [ ] Break time deduction
- [ ] Daily totals update

### Approval Tests
- [ ] Manager can approve team member
- [ ] Cannot approve own timesheet
- [ ] Multiple approvers handled
- [ ] Approval audit trail

---

## Success Criteria

- [ ] Employees can create timesheets
- [ ] Employees can add entries
- [ ] Hours calculated correctly
- [ ] Submission workflow works
- [ ] Approval workflow works
- [ ] Rejection and resubmission works
- [ ] Notifications sent correctly
- [ ] Reports generate correctly
- [ ] All permissions enforced
- [ ] All tests pass
- [ ] No data loss or corruption

---

## Migration Steps

### Step 1: Database Setup
1. Create timesheets table
2. Create timesheet_entries table
3. Create timesheet_approvals table
4. Create timesheet_comments table
5. Add indexes
6. Set up constraints

### Step 2: Query Functions
1. Timesheet CRUD functions
2. Entry CRUD functions
3. Calculation functions
4. Approval functions
5. Report functions

### Step 3: API Routes
1. Timesheet endpoints
2. Entry endpoints
3. Approval endpoints
4. Report endpoints
5. Test all endpoints

### Step 4: Frontend Integration
1. Update timesheet pages
2. Update forms
3. Implement workflow UI
4. Add notifications
5. Add reports
6. Remove mock data

### Step 5: Testing & Deployment
1. Unit tests
2. Integration tests
3. User acceptance testing
4. Deploy
5. Monitor

---

## Next Phase

After Phase 3 is complete and tested, proceed to:
- **Phase 4**: Task Assignment

---

**Dependencies for Next Phase**:
- Employee tracking working
- Permission system working
- Timesheet system working