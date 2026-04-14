# Students Module Implementation Plan

> **Version**: 1.0 | **Date**: 2026-04-14 | **Status**: Planning Complete

---

## Executive Summary

This plan outlines the implementation of a comprehensive **Students Module** for SynthoQuest CRM, enabling course enrollment, fee tracking, and payment management. The design maximizes code reuse from the existing Interns module while introducing course management capabilities.

---

## Current State Analysis

### ✅ What EXISTS (Reuse These)

| Component | Location | Status |
|-----------|----------|--------|
| **Student Types** | `src/types/student.ts` | ✅ Defined |
| **Student Permissions** | `src/lib/permissions.ts` | ✅ 6 permissions defined |
| **Student Constants** | `src/lib/constants.ts` | ✅ COURSES, COURSE_FEES, STATUSES |
| **Student Pages (stub)** | `src/app/(dashboard)/students/` | ✅ UI exists, no API |
| **Intern Payment System** | Complete implementation | ✅ Reference pattern |
| **Batches System** | `src/types/batch.ts` | ✅ Has courseName field |

### ❌ What MISSING (Build These)

| Component | Reason |
|-----------|--------|
| **Database Tables** | No `students`, `courses`, `student_enrollments`, `student_payments` |
| **Query Functions** | No `src/lib/db/queries/students.ts` |
| **API Routes** | No `src/app/api/students/` |
| **Payment Components** | No student payment UI (stub only) |
| **Course Management** | Courses are constants, no admin CRUD |

---

## Architecture Design

### Database Schema

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│    courses      │────<│ student_enroll- │>────│   students      │
│                 │     │    ments        │     │  (user-based)   │
├─────────────────┤     ├─────────────────┤     ├─────────────────┤
│ id (UUID)       │     │ id (UUID)       │     │ user_id (UUID)  │
│ name            │     │ student_id      │     │ (users table)   │
│ code            │     │ course_id       │     │                 │
│ description     │     │ batch_id        │     │ student_profiles│
│ duration_weeks  │     │ total_fee       │     ├─────────────────┤
│ default_fee     │     │ paid_amount     │     │ user_id (PK)    │
│ category        │     │ remaining_balance│     │ alternate_phone │
│ status          │     │ status          │     │ qualification   │
│ created_by      │     │ enrolled_at     │     │ occupation      │
│ created_at      │     │ start_date      │     │ company         │
│ updated_at      │     │ end_date        │     │ experience      │
│ deleted_at      │     │ progress        │     │ status          │
└─────────────────┘     │ certificate_id  │     │ source          │
                        │ deleted_at      │     │ lead_id         │
                        └─────────────────┘     │ converted_from  │
                                                │ converted_at    │
                        ┌─────────────────┐     │ converted_by    │
                        │ student_payments│     │ notes           │
                        ├─────────────────┤     │ created_at      │
                        │ id (UUID)       │     │ updated_at      │
                        │ enrollment_id   │     │ deleted_at      │
                        │ amount          │     └─────────────────┘
                        │ payment_method  │
                        │ payment_date    │
                        │ receipt_number  │
                        │ notes           │
                        │ collected_by    │
                        │ created_at      │
                        │ deleted_at      │
                        └─────────────────┘
```

### Key Design Decisions

1. **Students = Users Table Pattern**
   - Follow intern pattern: `users` table with `role='student'`
   - Separate `student_profiles` table for extended data
   - Enables unified authentication & user management

2. **Courses = Dedicated Table**
   - Move from constants to database table
   - Admin can add/edit/delete courses dynamically
   - Include: name, code, description, default_fee, duration, category

3. **Enrollments = Link Table**
   - `student_enrollments` links student to course/batch
   - Contains fee info: total_fee, paid_amount, remaining_balance
   - Payment tracking per enrollment (not per student)

4. **Payments = Copy Intern Pattern**
   - `student_payments` linked to enrollment
   - Same structure as `intern_payments`
   - Same UI components, API patterns, query functions

---

## Implementation Plan (Phased)

### Phase 1: Database Foundation (Priority: HIGH)

**Migration 1: courses table**
```sql
CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  code VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  duration_weeks INTEGER NOT NULL DEFAULT 12,
  default_fee DECIMAL(12,2) NOT NULL DEFAULT 0,
  category VARCHAR(100) DEFAULT 'cyber_security',
  syllabus TEXT[],
  prerequisites TEXT[],
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- Insert existing courses from constants
INSERT INTO courses (name, code, default_fee, category) VALUES
  ('Cyber Security Fundamentals', 'CSF-101', 25000, 'cyber_security'),
  ('Ethical Hacking', 'EH-201', 45000, 'cyber_security'),
  ('Penetration Testing', 'PT-301', 55000, 'cyber_security'),
  ('Network Security', 'NS-102', 35000, 'cyber_security'),
  ('Cloud Security', 'CLS-202', 50000, 'cyber_security'),
  ('Incident Response', 'IR-302', 40000, 'cyber_security'),
  ('Security Analytics', 'SA-401', 45000, 'cyber_security'),
  ('CompTIA Security+', 'SEC+-101', 30000, 'certification'),
  ('CISSP Preparation', 'CISSP-101', 60000, 'certification'),
  ('CEH Certification', 'CEH-101', 50000, 'certification'),
  ('AI/ML Fundamentals', 'AIML-101', 35000, 'ai_ml'),
  ('Machine Learning', 'ML-201', 45000, 'ai_ml');
```

**Migration 2: student_profiles table**
```sql
CREATE TABLE student_profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id),
  alternate_phone VARCHAR(20),
  qualification VARCHAR(255),
  occupation VARCHAR(100),
  company VARCHAR(255),
  experience VARCHAR(50),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  pincode VARCHAR(20),
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  source VARCHAR(100) NOT NULL DEFAULT 'organic',
  lead_id UUID REFERENCES leads(id),
  converted_from VARCHAR(100),
  converted_at TIMESTAMPTZ,
  converted_by UUID REFERENCES users(id),
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- Add student role to users constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check 
  CHECK (role IN ('admin', 'hr', 'team_lead', 'sales_rep', 'employee', 'intern', 'student'));
```

**Migration 3: student_enrollments table**
```sql
CREATE TABLE student_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(id),
  course_id UUID NOT NULL REFERENCES courses(id),
  batch_id UUID REFERENCES batches(id),
  enrollment_fee DECIMAL(12,2) DEFAULT 0,
  course_fee DECIMAL(12,2) NOT NULL,
  discount DECIMAL(12,2) DEFAULT 0,
  total_fee DECIMAL(12,2) NOT NULL,
  paid_amount DECIMAL(12,2) DEFAULT 0,
  remaining_balance DECIMAL(12,2) NOT NULL,
  payment_plan VARCHAR(20) DEFAULT 'full',
  status VARCHAR(20) NOT NULL DEFAULT 'enrolled',
  enrolled_at TIMESTAMPTZ DEFAULT now(),
  start_date DATE,
  expected_end_date DATE,
  actual_end_date DATE,
  progress INTEGER DEFAULT 0 CHECK (>= 0 AND <= 100),
  certificate_id UUID,
  instructor_id UUID REFERENCES users(id),
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  UNIQUE(student_id, course_id, batch_id)
);

-- Trigger for auto balance calculation
CREATE OR REPLACE FUNCTION update_enrollment_remaining_balance()
RETURNS TRIGGER AS $$
BEGIN
  NEW.remaining_balance := NEW.total_fee - NEW.paid_amount;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enrollment_balance_trigger
  BEFORE INSERT OR UPDATE OF total_fee, paid_amount ON student_enrollments
  FOR EACH ROW EXECUTE FUNCTION update_enrollment_remaining_balance();
```

**Migration 4: student_payments table**
```sql
CREATE TABLE student_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL REFERENCES student_enrollments(id),
  amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
  payment_method VARCHAR(50) NOT NULL DEFAULT 'cash',
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  receipt_number VARCHAR(100),
  notes TEXT,
  collected_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- Trigger to update enrollment paid_amount
CREATE OR REPLACE FUNCTION update_enrollment_paid_amount()
RETURNS TRIGGER AS $$
DECLARE
  enrollment_uuid UUID;
BEGIN
  IF TG_OP = 'INSERT' THEN
    enrollment_uuid := NEW.enrollment_id;
    UPDATE student_enrollments
    SET paid_amount = paid_amount + NEW.amount,
        updated_at = now()
    WHERE id = enrollment_uuid;
  ELSIF TG_OP = 'UPDATE' THEN
    UPDATE student_enrollments
    SET paid_amount = paid_amount - OLD.amount + NEW.amount,
        updated_at = now()
    WHERE id = NEW.enrollment_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE student_enrollments
    SET paid_amount = paid_amount - OLD.amount,
        updated_at = now()
    WHERE id = OLD.enrollment_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER student_payment_trigger
  AFTER INSERT OR UPDATE OR DELETE ON student_payments
  FOR EACH ROW EXECUTE FUNCTION update_enrollment_paid_amount();
```

---

### Phase 2: Types & Permissions (Priority: HIGH)

**Update `src/types/course.ts`** (NEW FILE)
```typescript
export type CourseStatus = 'active' | 'inactive' | 'archived'
export type CourseCategory = 'cyber_security' | 'ai_ml' | 'certification' | 'cloud' | 'network'

export interface Course {
  id: string
  name: string
  code: string
  description?: string
  durationWeeks: number
  defaultFee: number
  category: CourseCategory
  syllabus?: string[]
  prerequisites?: string[]
  status: CourseStatus
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

export interface CreateCourseInput {
  name: string
  code: string
  description?: string
  durationWeeks: number
  defaultFee: number
  category: CourseCategory
  syllabus?: string[]
  prerequisites?: string[]
}
```

**Update `src/types/student.ts`** (MODIFY EXISTING)
```typescript
// Add payment types similar to intern-payment.ts
export type StudentPaymentMethod = 'cash' | 'upi' | 'bank_transfer' | 'card' | 'cheque'

export interface StudentPayment {
  id: string
  enrollmentId: string
  amount: number
  paymentMethod: StudentPaymentMethod
  paymentDate: Date
  receiptNumber?: string
  notes?: string
  collectedBy?: string
  collectedByName?: string
  createdAt: Date
  updatedAt: Date
}

export interface StudentPaymentSummary {
  totalFee: number
  totalPaid: number
  remainingBalance: number
  payments: StudentPayment[]
}

export interface CreateStudentPaymentInput {
  amount: number
  paymentMethod: StudentPaymentMethod
  paymentDate?: string
  receiptNumber?: string
  notes?: string
}
```

**Update `src/lib/permissions.ts`** (ADD NEW)
```typescript
// Add course permissions
| 'courses.view'
| 'courses.create'
| 'courses.edit'
| 'courses.delete'

// Add helper functions
export function canViewCourses(user: User): boolean {
  return hasPermissionStatic(user, 'courses.view')
}

export function canManageCourses(user: User): boolean {
  return hasPermissionStatic(user, 'courses.create') ||
         hasPermissionStatic(user, 'courses.edit')
}

export function canManageStudentPayments(user: User): boolean {
  return hasPermissionStatic(user, 'payments.create') ||
         hasPermissionStatic(user, 'payments.process')
}
```

---

### Phase 3: Query Functions (Priority: HIGH)

**Create `src/lib/db/queries/courses.ts`** (NEW)
```typescript
// Pattern: Same as interns.ts
export async function getCourses(filters?: { status?: string; category?: string })
export async function getCourseById(id: string)
export async function getCourseByCode(code: string)
export async function createCourse(input: CreateCourseInput, createdBy: string)
export async function updateCourse(id: string, updates: Partial<Course>)
export async function deleteCourse(id: string) // soft delete
```

**Create `src/lib/db/queries/students.ts`** (NEW)
```typescript
// Pattern: Copy from interns.ts, adapt for students
export async function getStudents(filters: GetStudentsFilters)
export async function getStudentById(id: string)
export async function createStudent(input: CreateStudentInput)
export async function updateStudent(id: string, updates: Partial<Student>)
export async function deleteStudent(id: string)
export async function getStudentEnrollments(studentId: string)
export async function getStudentPaymentSummary(studentId: string)
```

**Create `src/lib/db/queries/student-enrollments.ts`** (NEW)
```typescript
export async function getEnrollments(filters?: { studentId?: string; courseId?: string; batchId?: string })
export async function getEnrollmentById(id: string)
export async function createEnrollment(input: CreateEnrollmentInput)
export async function updateEnrollment(id: string, updates: Partial<Enrollment>)
export async function updateEnrollmentFee(id: string, totalFee: number)
export async function completeEnrollment(id: string, certificateId?: string)
```

**Create `src/lib/db/queries/student-payments.ts`** (NEW)
```typescript
// EXACT COPY of intern-payments.ts pattern
export async function getStudentPayments(enrollmentId: string)
export async function getStudentPaymentById(paymentId: string)
export async function createStudentPayment(enrollmentId: string, input: CreateStudentPaymentInput, collectedBy?: string)
export async function updateStudentPayment(paymentId: string, input: UpdateStudentPaymentInput)
export async function deleteStudentPayment(paymentId: string)
export async function getStudentPaymentSummary(enrollmentId: string)
```

---

### Phase 4: API Routes (Priority: HIGH)

**Create `src/app/api/courses/route.ts`**
```
GET  /api/courses     → List all courses
POST /api/courses     → Create course (admin/hr only)
```

**Create `src/app/api/courses/[id]/route.ts`**
```
GET    /api/courses/:id   → Get course details
PUT    /api/courses/:id   → Update course
DELETE /api/courses/:id   → Soft delete course
```

**Create `src/app/api/students/route.ts`**
```
GET  /api/students    → List students (with filters)
POST /api/students    → Create student
```

**Create `src/app/api/students/[id]/route.ts`**
```
GET    /api/students/:id   → Get student with enrollments
PUT    /api/students/:id   → Update student
DELETE /api/students/:id   → Soft delete student
```

**Create `src/app/api/students/[id]/enrollments/route.ts`**
```
GET  /api/students/:id/enrollments    → List enrollments
POST /api/students/:id/enrollments    → Enroll in course
```

**Create `src/app/api/students/[id]/enrollments/[enrollmentId]/payments/route.ts`**
```
GET  /api/students/:id/enrollments/:eid/payments    → Payment history + summary
POST /api/students/:id/enrollments/:eid/payments    → Record payment
```

**Create `src/app/api/enrollments/[id]/payments/[paymentId]/route.ts`**
```
GET    /api/enrollments/:id/payments/:pid    → Get payment
PUT    /api/enrollments/:id/payments/:pid    → Update payment
DELETE /api/enrollments/:id/payments/:pid    → Delete payment
```

---

### Phase 5: UI Components (Priority: MEDIUM)

**Create `src/components/students/payment-history-card.tsx`**
```
COPY from: src/components/interns/payment-history-card.tsx
ADAPT: Change internId → enrollmentId, InternPayment → StudentPayment
```

**Create `src/components/students/add-payment-modal.tsx`**
```
COPY from: src/components/interns/add-payment-modal.tsx
ADAPT: Same changes as above
```

**Create `src/components/students/enrollment-card.tsx`**
```
NEW: Display enrollment details with payment tracking
INCLUDE: Course, batch, progress, fee summary, payment history
```

**Create `src/components/students/enroll-modal.tsx`**
```
NEW: Modal for enrolling student in course
INCLUDE: Course select, batch select, fee input, discount, payment plan
```

**Create `src/components/courses/course-form.tsx`**
```
NEW: Create/Edit course form
```

---

### Phase 6: Pages Implementation (Priority: HIGH)

**Update `src/app/(dashboard)/students/page.tsx`**
```
CURRENT: Stub with mock data
CHANGE: Connect to API, add real data fetching
ADD: Stats cards (total students, active enrollments, revenue)
```

**Update `src/app/(dashboard)/students/[id]/page.tsx`**
```
CURRENT: Stub with mock data
CHANGE: Connect to API, show real enrollments/payments
ADD: PaymentHistoryCard component per enrollment
```

**Update `src/app/(dashboard)/students/new/page.tsx`**
```
CURRENT: Stub form
CHANGE: Connect to API POST endpoint
```

**Create `src/app/(dashboard)/students/[id]/enroll/page.tsx`**
```
NEW: Enroll existing student in new course
INCLUDE: Course/batch selection, fee calculation, initial payment
```

**Create `src/app/(dashboard)/courses/page.tsx`**
```
NEW: Course management page (list all courses)
```

**Create `src/app/(dashboard)/courses/new/page.tsx`**
```
NEW: Create new course form
```

**Create `src/app/(dashboard)/courses/[id]/edit/page.tsx`**
```
NEW: Edit course form
```

---

### Phase 7: Navigation & Integration (Priority: MEDIUM)

**Update Sidebar Navigation**
```
ADD: Courses menu item (under Settings or separate)
VERIFY: Students already in sidebar
```

**Update Lead Conversion Flow**
```
MODIFY: When converting lead to student
ADD: Enrollment creation option during conversion
INCLUDE: Course selection, batch selection, fee setup
```

**Update Constants**
```
MOVE: COURSES and COURSE_FEES from constants.ts → database
KEEP: Status constants (STUDENT_STATUSES, ENROLLMENT_STATUSES)
```

---

## Reuse Strategy (Maximize Code Reuse)

### Exact Copies (Minimal Changes)

| Source File | Target File | Changes |
|-------------|-------------|---------|
| `intern-payments.ts` | `student-payments.ts` | intern_id → enrollment_id |
| `intern-payment.ts` | Add to `student.ts` | Intern → Student prefix |
| `payment-history-card.tsx` | `students/payment-history-card.tsx` | intern → enrollment |
| `add-payment-modal.tsx` | `students/add-payment-modal.tsx` | intern → enrollment |

### Pattern Copies (Adapt Structure)

| Source Pattern | Target Implementation |
|----------------|----------------------|
| `interns.ts` queries | `students.ts` queries |
| `/api/interns/*` routes | `/api/students/*` routes |
| Intern detail page | Student detail page (enrollments tab) |
| Intern list page | Student list page |

### New Components (Build Fresh)

| Component | Reason |
|-----------|--------|
| Course CRUD | No existing reference |
| Enrollment form | New concept |
| Course management UI | New feature |

---

## Permission Matrix (Students & Courses)

| Role | Courses | Students | Enrollments | Payments |
|------|---------|----------|-------------|----------|
| **admin** | CRUD all | CRUD all | CRUD all | CRUD all |
| **hr** | CRUD all | CRUD all | CRUD all | CRUD all |
| **team_lead** | View only | View all | Enroll | Create/Process |
| **sales_rep** | View only | View assigned | Enroll assigned | Create |
| **employee** | None | None | None | None |

---

## File Checklist (What to Create/Modify)

### NEW FILES (Create)

```
Database:
├── supabase/migrations/
│   ├── 060_courses_table.sql
│   ├── 061_student_profiles_table.sql
│   ├── 062_student_enrollments_table.sql
│   └── 063_student_payments_table.sql

Types:
├── src/types/course.ts

Queries:
├── src/lib/db/queries/courses.ts
├── src/lib/db/queries/students.ts
├── src/lib/db/queries/student-enrollments.ts
├── src/lib/db/queries/student-payments.ts

API Clients:
├── src/lib/api/courses.ts
├── src/lib/api/students.ts
├── src/lib/api/student-payments.ts

API Routes:
├── src/app/api/courses/route.ts
├── src/app/api/courses/[id]/route.ts
├── src/app/api/students/route.ts
├── src/app/api/students/[id]/route.ts
├── src/app/api/students/[id]/enrollments/route.ts
├── src/app/api/students/[id]/enrollments/[enrollmentId]/payments/route.ts
├── src/app/api/enrollments/[id]/payments/[paymentId]/route.ts

Components:
├── src/components/students/payment-history-card.tsx
├── src/components/students/add-payment-modal.tsx
├── src/components/students/enrollment-card.tsx
├── src/components/students/enroll-modal.tsx
├── src/components/courses/course-form.tsx

Pages:
├── src/app/(dashboard)/courses/page.tsx
├── src/app/(dashboard)/courses/new/page.tsx
├── src/app/(dashboard)/courses/[id]/edit/page.tsx
├── src/app/(dashboard)/students/[id]/enroll/page.tsx
```

### MODIFY FILES (Update)

```
Types:
├── src/types/student.ts          → Add payment types

Permissions:
├── src/lib/permissions.ts        → Add course + payment helpers

Constants:
├── src/lib/constants.ts          → Add course categories

Pages (Connect to API):
├── src/app/(dashboard)/students/page.tsx
├── src/app/(dashboard)/students/[id]/page.tsx
├── src/app/(dashboard)/students/new/page.tsx

Navigation:
├── src/components/layout/sidebar.tsx → Add courses menu

Lead Conversion:
├── src/app/(dashboard)/leads/[id]/page.tsx → Add enrollment option
```

---

## Implementation Order (Recommended Sequence)

### Week 1: Database + Core Types
1. ✅ Run migration 060 (courses table)
2. ✅ Run migration 061 (student_profiles)
3. ✅ Run migration 062 (student_enrollments)
4. ✅ Run migration 063 (student_payments)
5. ✅ Create `src/types/course.ts`
6. ✅ Update `src/types/student.ts`

### Week 2: Query Functions
7. ✅ Create `src/lib/db/queries/courses.ts`
8. ✅ Create `src/lib/db/queries/students.ts`
9. ✅ Create `src/lib/db/queries/student-enrollments.ts`
10. ✅ Create `src/lib/db/queries/student-payments.ts`
11. ✅ Create `src/lib/api/*.ts` client functions
12. ✅ Update `src/lib/permissions.ts`

### Week 3: API Routes + Course UI
13. ✅ Create course API routes
14. ✅ Create students API routes
15. ✅ Create enrollment/payment API routes
16. ✅ Create course pages (list, create, edit)
17. ✅ Add courses to sidebar

### Week 4: Student UI + Payments
18. ✅ Connect student pages to API
19. ✅ Create payment components (copy intern)
20. ✅ Create enrollment components
21. ✅ Update student detail page
22. ✅ Create enrollment page

### Week 5: Integration
23. ✅ Update lead conversion flow
24. ✅ Add batch-student linking
25. ✅ Test all CRUD operations
26. ✅ Run `npm run lint && npm run build`
27. ✅ Test with different user roles

---

## Testing Checklist

```
□ Course CRUD works (admin/hr)
□ Student CRUD works
□ Enrollment creation works
□ Payment recording works
□ Balance auto-calculates
□ Payment history displays
□ Students list filters work
□ Permissions enforced
□ Lead → Student → Enrollment flow works
□ Export functionality works
□ Mobile responsive
□ Toast notifications show
□ Loading states display
□ Error handling works
□ npm run lint passes
□ npm run build passes
```

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Data migration issues | Backup before migrations, test on staging |
| Permission gaps | Test all roles after implementation |
| Breaking existing pages | Incremental updates, keep stubs initially |
| Performance with many payments | Pagination on payment history |
| Course-batch sync | Link batch to course_id reference |

---

## Success Criteria

1. Admin can add/edit/delete courses dynamically
2. Students can be enrolled in courses with fee tracking
3. Payments are recorded and balance auto-calculates
4. UI matches existing app design (Shadcn components)
5. All permissions enforced correctly
6. Code follows AGENTS.md patterns
7. No duplicate code (max reuse from interns)
8. All tests pass, build succeeds

---

**END OF PLAN**

---

## Quick Reference: Copy-Paste Templates

### Query Function Template (Copy from interns.ts)
```typescript
export async function getStudents(filters?: GetStudentsFilters): Promise<{ data: Student[]; total: number }> {
  const supabase = await createAdminClient()
  const { data, error } = await supabase
    .from('users')
    .select(`id, email, name, phone, student_profiles!student_profiles_user_id_fkey (*)`)
    .eq('role', 'student')
    .is('deleted_at', null)
  // ... filter logic
}
```

### Payment Query Template (Copy from intern-payments.ts)
```typescript
export async function getStudentPayments(enrollmentId: string): Promise<StudentPayment[]> {
  const supabase = await createAdminClient()
  const { data, error } = await supabase
    .from('student_payments')
    .select(`*`)
    .eq('enrollment_id', enrollmentId)
    .is('deleted_at', null)
  // ... mapping
}
```

### API Route Template (Copy from interns/route.ts)
```typescript
export async function GET(request: NextRequest) {
  return withAuth(request, async (user) => {
    if (!canViewStudents(user)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    const result = await getStudents(filters)
    return NextResponse.json({ data: result.data, pagination: {...} })
  })
}
```

### Payment Component Template (Copy from payment-history-card.tsx)
```typescript
// Change: internId → enrollmentId
// Change: InternPayment → StudentPayment
// Change: getInternPaymentSummary → getStudentPaymentSummary
// Keep: Same UI structure, same validation
```