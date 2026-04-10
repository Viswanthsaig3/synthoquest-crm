# 🚀 COMPREHENSIVE IMPLEMENTATION PLAN
## Phase 3: Timesheets + Complete Mock Data Removal

**Duration**: 1-2 days (continuous session)  
**Priority**: CRITICAL  
**Scope**: Phase 3 + ALL 13 entities mock data removal

---

## 📋 EXECUTION STRATEGY

### Approach: Layer-by-Layer
```
For each entity:
1. Database Schema → Migrations
2. Query Functions → Test
3. API Routes → Test
4. Frontend Update → Test
5. Remove Mock Imports → Verify
```

### Order: Dependency-Based
```
Phase 3 (Timesheets) - FIRST
    ↓
Core CRM Entities
    ├── Leads (depends on users, lead_types)
    ├── Lead Types (independent)
    ├── Tasks (depends on users)
    ├── Students (depends on users, batches)
    └── Batches (depends on users)
    ↓
HR/Operations Entities
    ├── Interns (depends on users)
    ├── Attendance (depends on users)
    ├── Leaves (depends on users)
    ├── Payroll (depends on users)
    └── Payments (depends on students)
    ↓
Supporting Entities
    ├── Certificates (depends on students)
    ├── Reports (aggregates)
    └── Settings (independent)
```

---

## PHASE 3: TIMESHEETS (4-5 hours)

### Step 1: Database Schema (45 min)

**Migration 010: timesheets table**
```sql
CREATE TABLE timesheets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES users(id),
  week_start_date DATE NOT NULL,
  week_end_date DATE NOT NULL,
  total_hours DECIMAL(5,2) DEFAULT 0,
  regular_hours DECIMAL(5,2) DEFAULT 0,
  overtime_hours DECIMAL(5,2) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'draft',
  submitted_at TIMESTAMPTZ,
  submitted_by UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES users(id),
  rejected_at TIMESTAMPTZ,
  rejected_by UUID REFERENCES users(id),
  rejection_reason TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  UNIQUE(employee_id, week_start_date)
);

-- Indexes
CREATE INDEX idx_timesheets_employee ON timesheets(employee_id);
CREATE INDEX idx_timesheets_status ON timesheets(status);
CREATE INDEX idx_timesheets_week ON timesheets(week_start_date);

-- Constraints
ALTER TABLE timesheets ADD CONSTRAINT check_week_dates 
  CHECK (week_end_date = week_start_date + 6);
```

**Migration 011: timesheet_entries table**
```sql
CREATE TABLE timesheet_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timesheet_id UUID NOT NULL REFERENCES timesheets(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  task_id UUID REFERENCES tasks(id),
  description TEXT,
  start_time TIME,
  end_time TIME,
  break_minutes INTEGER DEFAULT 0,
  total_hours DECIMAL(4,2) NOT NULL,
  billable BOOLEAN DEFAULT true,
  location VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_entries_timesheet ON timesheet_entries(timesheet_id);
CREATE INDEX idx_entries_date ON timesheet_entries(date);
```

**Migration 012: timesheet_approvals table**
```sql
CREATE TABLE timesheet_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timesheet_id UUID NOT NULL REFERENCES timesheets(id),
  approver_id UUID NOT NULL REFERENCES users(id),
  action VARCHAR(20) NOT NULL,
  comments TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_approvals_timesheet ON timesheet_approvals(timesheet_id);
```

### Step 2: Query Functions (60 min)

**File: `src/lib/db/queries/timesheets.ts`**
```typescript
Functions needed:
- getTimesheets(filters, pagination)
- getTimesheetById(id)
- getTimesheetByWeek(employeeId, weekStart)
- createTimesheet(data)
- updateTimesheet(id, updates)
- deleteTimesheet(id)

Entry functions:
- getEntries(timesheetId)
- createEntry(timesheetId, data)
- updateEntry(id, data)
- deleteEntry(id)

Workflow functions:
- submitTimesheet(id, userId)
- approveTimesheet(id, approverId, comments)
- rejectTimesheet(id, approverId, reason)

Calculation functions:
- calculateEntryHours(startTime, endTime, breakMinutes)
- recalculateTimesheetTotals(timesheetId)
```

### Step 3: API Routes (90 min)

**Endpoints to create:**
```
GET    /api/timesheets              - List timesheets
POST   /api/timesheets              - Create timesheet
GET    /api/timesheets/:id          - Get timesheet details
PUT    /api/timesheets/:id          - Update timesheet
POST   /api/timesheets/:id/submit   - Submit for approval
POST   /api/timesheets/:id/approve  - Approve timesheet
POST   /api/timesheets/:id/reject   - Reject timesheet

GET    /api/timesheets/:id/entries  - Get entries
POST   /api/timesheets/:id/entries  - Add entry
PUT    /api/timesheet-entries/:id   - Update entry
DELETE /api/timesheet-entries/:id   - Delete entry
```

### Step 4: Frontend Updates (45 min)

**Files to update:**
- `src/app/(dashboard)/timesheets/page.tsx` (558 lines)
- `src/app/(dashboard)/timesheets/approvals/page.tsx` (274 lines)
- `src/app/(dashboard)/timesheets/new/page.tsx` (261 lines)

**Changes needed:**
- Replace mock imports with API calls
- Add loading states
- Add error handling
- Update types to match new schema (weekly instead of daily)

### Step 5: Testing & Commit (30 min)
- Test all endpoints
- Test all UI pages
- Test workflow (draft → submitted → approved/rejected)
- Git commit

---

## COMPLETE MOCK DATA REMOVAL (8-10 hours)

### PRIORITY ORDER

#### 1. LEADS (Highest - Sales Critical) - 90 min
**Database:**
- leads table (already has lead_type, sources, statuses)
- lead_activities table (calls, notes, follow-ups)

**API Endpoints (8):**
```
GET    /api/leads
POST   /api/leads
GET    /api/leads/:id
PUT    /api/leads/:id
DELETE /api/leads/:id
POST   /api/leads/:id/claim
POST   /api/leads/:id/convert
GET    /api/leads/:id/activities
POST   /api/leads/:id/activities
```

**Pages to update (6):**
- `/leads/page.tsx`
- `/leads/[id]/page.tsx`
- `/leads/pool/page.tsx`
- `/leads/mine/page.tsx`
- `/leads/new/page.tsx`
- Dashboard home

#### 2. LEAD TYPES - 30 min
**Database:**
- lead_types table
- lead_type_fields, statuses, sources as JSONB

**API Endpoints (4):**
```
GET    /api/lead-types
POST   /api/lead-types
PUT    /api/lead-types/:id
DELETE /api/lead-types/:id
```

**Pages to update (3):**
- `/settings/lead-types/page.tsx`
- `/settings/lead-types/new/page.tsx`
- `/leads/new/page.tsx` (for dropdown)

#### 3. TASKS - 60 min
**Database:**
- tasks table (already exists via Phase 1? Check)
- task_comments table
- task_attachments table

**API Endpoints (5):**
```
GET    /api/tasks
POST   /api/tasks
GET    /api/tasks/:id
PUT    /api/tasks/:id
DELETE /api/tasks/:id
```

**Pages to update (3):**
- `/tasks/page.tsx`
- `/tasks/[id]/page.tsx`
- `/tasks/new/page.tsx`

#### 4. STUDENTS - 75 min
**Database:**
- students table
- student_enrollments table
- student_documents table

**API Endpoints (5):**
```
GET    /api/students
POST   /api/students
GET    /api/students/:id
PUT    /api/students/:id
DELETE /api/students/:id
```

**Pages to update (3):**
- `/students/page.tsx`
- `/students/[id]/page.tsx`
- `/students/new/page.tsx`

#### 5. BATCHES - 60 min
**Database:**
- batches table
- batch_students table

**API Endpoints (5):**
```
GET    /api/batches
POST   /api/batches
GET    /api/batches/:id
PUT    /api/batches/:id
DELETE /api/batches/:id
```

**Pages to update (2):**
- `/batches/page.tsx`
- `/batches/[id]/page.tsx`

#### 6. INTERNS - 45 min
**Database:**
- interns table (similar to students)

**API Endpoints (5):**
```
GET    /api/interns
POST   /api/interns
GET    /api/interns/:id
PUT    /api/interns/:id
DELETE /api/interns/:id
POST   /api/interns/:id/approve
```

**Pages to update (2):**
- `/interns/page.tsx`
- `/interns/[id]/page.tsx`

#### 7. ATTENDANCE - 45 min
**Database:**
- attendance table

**API Endpoints (4):**
```
GET    /api/attendance
POST   /api/attendance
GET    /api/attendance/:id
PUT    /api/attendance/:id
```

**Pages to update (2):**
- `/attendance/page.tsx`
- `/attendance/history/page.tsx`

#### 8. LEAVES - 45 min
**Database:**
- leaves table
- leave_balances table

**API Endpoints (5):**
```
GET    /api/leaves
POST   /api/leaves
GET    /api/leaves/:id
PUT    /api/leaves/:id
POST   /api/leaves/:id/approve
POST   /api/leaves/:id/reject
```

**Pages to update (4):**
- `/leaves/page.tsx`
- `/leaves/approvals/page.tsx`
- `/leaves/calendar/page.tsx`
- `/leaves/apply/page.tsx`

#### 9. PAYROLL - 45 min
**Database:**
- payroll table
- payroll_items table

**API Endpoints (5):**
```
GET    /api/payroll
POST   /api/payroll
GET    /api/payroll/:id
PUT    /api/payroll/:id
POST   /api/payroll/run
```

**Pages to update (3):**
- `/payroll/page.tsx`
- `/payroll/[id]/page.tsx`
- `/payroll/run/page.tsx`

#### 10. PAYMENTS - 30 min
**Database:**
- payments table
- invoices table

**API Endpoints (4):**
```
GET    /api/payments
POST   /api/payments
GET    /api/payments/:id
PUT    /api/payments/:id
```

**Pages to update (1):**
- `/payments/page.tsx`

#### 11. CERTIFICATES - 30 min
**Database:**
- certificates table
- external_certifications table

**API Endpoints (4):**
```
GET    /api/certificates
POST   /api/certificates
GET    /api/certificates/:id
DELETE /api/certificates/:id
```

**Pages to update (1):**
- `/certificates/page.tsx`

#### 12. REPORTS - 30 min
**Database:**
- No new tables (uses aggregated data)

**API Endpoints (3):**
```
GET    /api/reports/overview
GET    /api/reports/financial
GET    /api/reports/performance
```

**Pages to update (1):**
- `/reports/page.tsx`

#### 13. SETTINGS - 30 min
**Database:**
- settings table (key-value pairs)
- Or use existing tables

**API Endpoints (2):**
```
GET    /api/settings
PUT    /api/settings
```

**Pages to update (1):**
- `/settings/page.tsx`

---

## TOTAL FILE COUNT

### Database Migrations (New): ~15
- 010_timesheets.sql
- 011_timesheet_entries.sql
- 012_timesheet_approvals.sql
- 013_leads.sql
- 014_lead_types.sql
- 015_tasks.sql (if not exists)
- 016_students.sql
- 017_batches.sql
- 018_interns.sql
- 019_attendance.sql
- 020_leaves.sql
- 021_payroll.sql
- 022_payments.sql
- 023_certificates.sql

### Query Functions (New): 13 files
- timesheets.ts
- leads.ts
- lead-types.ts
- tasks.ts
- students.ts
- batches.ts
- interns.ts
- attendance.ts
- leaves.ts
- payroll.ts
- payments.ts
- certificates.ts
- reports.ts

### API Routes (New): ~70 endpoints
- Auth: 4 (done)
- Employees: 5 (done)
- Permissions/Roles: 5 (done)
- Timesheets: 10
- Leads: 9
- Lead Types: 4
- Tasks: 5
- Students: 5
- Batches: 5
- Interns: 6
- Attendance: 4
- Leaves: 6
- Payroll: 5
- Payments: 4
- Certificates: 4
- Reports: 3

### Frontend Pages to Update: 37 pages

---

## TESTING STRATEGY

### Per Entity:
1. ✅ Database schema applied
2. ✅ Query functions tested
3. ✅ API endpoints tested (Postman/curl)
4. ✅ Frontend loading correctly
5. ✅ CRUD operations working
6. ✅ Permissions enforced
7. ✅ Mock imports removed

### Integration Tests:
- Complete user flows
- Cross-entity operations (lead → student conversion)
- Approval workflows

---

## COMMIT STRATEGY

### Logical Commits (5-6 total):
1. Phase 3: Timesheets (complete implementation)
2. Core CRM: Leads, Lead Types, Tasks
3. Core CRM: Students, Batches
4. HR/Operations: Interns, Attendance, Leaves
5. HR/Operations: Payroll, Payments
6. Final: Certificates, Reports, Settings, cleanup

---

## ESTIMATED TIMELINE

| Phase | Duration | Cumulative |
|-------|----------|------------|
| Phase 3: Timesheets | 4-5 hours | 5 hours |
| Leads + Lead Types | 2 hours | 7 hours |
| Tasks | 1 hour | 8 hours |
| Students + Batches | 2.5 hours | 10.5 hours |
| Interns | 45 min | 11.25 hours |
| Attendance + Leaves | 1.5 hours | 12.75 hours |
| Payroll + Payments | 1.25 hours | 14 hours |
| Certificates + Reports + Settings | 1.5 hours | 15.5 hours |
| Testing & Bug Fixes | 1 hour | 16.5 hours |

**Total Estimated: 16-18 hours**

---

## READY TO EXECUTE?

This plan will:
- ✅ Implement complete Phase 3 Timesheets
- ✅ Remove ALL mock data from the CRM
- ✅ Create ~70 new API endpoints
- ✅ Update 37 frontend pages
- ✅ Make the application fully database-driven

**Recommended**: Start with Phase 3, then proceed through each entity in order.

