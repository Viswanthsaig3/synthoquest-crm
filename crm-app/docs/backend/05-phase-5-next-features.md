# Phase 5: Next Features (CRM & Operations)

> **Duration**: Week 6+ | **Priority**: MEDIUM | **Dependencies**: All Previous Phases

---

## Objective

Implement CRM-specific features: Leads Management, Student Enrollment, Batch Management, Payment Tracking, and Intern Management.

---

## Feature Overview

### Priority Order

1. **Leads Management** - Core CRM functionality
2. **Student Enrollment** - Convert leads to students
3. **Batch Management** - Organize students into batches
4. **Payment Tracking** - Financial tracking
5. **Intern Management** - Internship program

---

## 1. Leads Management

### Database Schema

#### Leads Table
```
Table: leads

Fields:
- id: UUID, primary key
- name: VARCHAR(255), not null
- email: VARCHAR(255), not null
- phone: VARCHAR(20), not null
- alternate_phone: VARCHAR(20)
- type_id: UUID, foreign key to lead_types.id
- type_status: VARCHAR(50) (status from lead type)
- type_source: VARCHAR(50) (source from lead type)
- custom_fields: JSONB (dynamic fields based on type)
- priority: VARCHAR(20), default 'warm'
- status: VARCHAR(20), default 'new'
- assigned_to: UUID, foreign key to users.id
- course_interested: VARCHAR(255)
- notes: TEXT
- total_calls: INTEGER, default 0
- last_call_outcome: VARCHAR(50)
- last_call_at: TIMESTAMPTZ
- next_follow_up_at: TIMESTAMPTZ
- converted: BOOLEAN, default false
- converted_to: VARCHAR(20) (student, intern)
- converted_at: TIMESTAMPTZ
- converted_by: UUID
- created_at: TIMESTAMPTZ, default now()
- updated_at: TIMESTAMPTZ, default now()
- deleted_at: TIMESTAMPTZ

Indexes:
- idx_leads_email on email
- idx_leads_phone on phone
- idx_leads_assigned_to on assigned_to
- idx_leads_status on status
- idx_leads_type_id on type_id
- idx_leads_created_at on created_at

Constraints:
- email must be unique (per active lead)
- type_id must exist in lead_types table
```

#### Lead Types Table
```
Table: lead_types

Fields:
- id: UUID, primary key
- name: VARCHAR(100), not null
- description: TEXT
- icon: VARCHAR(50)
- color: VARCHAR(20)
- is_active: BOOLEAN, default true
- statuses: JSONB (array of {value, label, color})
- sources: JSONB (array of {value, label})
- fields: JSONB (array of field definitions)
- created_at: TIMESTAMPTZ, default now()
- updated_at: TIMESTAMPTZ, default now()

Constraints:
- name must be unique
```

#### Lead Call Records Table
```
Table: lead_calls

Fields:
- id: UUID, primary key
- lead_id: UUID, foreign key to leads.id, not null
- caller_id: UUID, foreign key to users.id, not null
- outcome: VARCHAR(50), not null
  - answered: Call answered
  - no_answer: No answer
  - busy: Busy
  - wrong_number: Wrong number
  - callback_requested: Callback requested
- duration_seconds: INTEGER
- notes: TEXT
- next_follow_up_at: TIMESTAMPTZ
- recording_url: VARCHAR(500)
- created_at: TIMESTAMPTZ, default now()

Indexes:
- idx_lead_calls_lead_id on lead_id
- idx_lead_calls_caller_id on caller_id
```

### Key Features
- Dynamic lead types with custom fields
- Call logging and tracking
- Follow-up scheduling
- Lead scoring
- Conversion workflow

---

## 2. Student Enrollment

### Database Schema

#### Students Table
```
Table: students

Fields:
- id: UUID, primary key
- name: VARCHAR(255), not null
- email: VARCHAR(255), unique, not null
- phone: VARCHAR(20), not null
- alternate_phone: VARCHAR(20)
- date_of_birth: DATE
- gender: VARCHAR(20)
- address: TEXT
- city: VARCHAR(100)
- state: VARCHAR(100)
- pincode: VARCHAR(10)
- education: VARCHAR(255)
- institution: VARCHAR(255)
- status: VARCHAR(20), default 'active'
  - active: Currently enrolled
  - completed: Course completed
  - dropped: Dropped out
  - on_hold: Temporarily paused
- lead_id: UUID, foreign key to leads.id
- converted_at: TIMESTAMPTZ
- converted_by: UUID
- created_at: TIMESTAMPTZ, default now()
- updated_at: TIMESTAMPTZ, default now()
- deleted_at: TIMESTAMPTZ

Constraints:
- email must be unique
```

#### Student Enrollments Table
```
Table: student_enrollments

Fields:
- id: UUID, primary key
- student_id: UUID, foreign key to students.id, not null
- batch_id: UUID, foreign key to batches.id
- course_id: UUID, foreign key to courses.id
- enrollment_date: DATE, not null
- status: VARCHAR(20), default 'active'
- total_fees: DECIMAL(10,2)
- paid_amount: DECIMAL(10,2), default 0
- total_due: DECIMAL(10,2)
- discount: DECIMAL(5,2)
- scholarship: DECIMAL(10,2)
- enrollment_source: VARCHAR(50)
- counselor_id: UUID, foreign key to users.id
- created_at: TIMESTAMPTZ, default now()
- updated_at: TIMESTAMPTZ, default now()

Indexes:
- idx_enrollments_student_id on student_id
- idx_enrollments_batch_id on batch_id
- idx_enrollments_course_id on course_id

Constraints:
- student_id must exist in students table
- batch_id must exist in batches table
```

### Key Features
- Student profile management
- Multiple course enrollment
- Fee tracking
- Progress tracking
- Certificate eligibility

---

## 3. Batch Management

### Database Schema

#### Batches Table
```
Table: batches

Fields:
- id: UUID, primary key
- name: VARCHAR(255), not null
- course_id: UUID, foreign key to courses.id
- batch_code: VARCHAR(50), unique
- description: TEXT
- start_date: DATE, not null
- end_date: DATE
- timing: VARCHAR(100)
  - morning: Morning batch
  - afternoon: Afternoon batch
  - evening: Evening batch
  - weekend: Weekend batch
  - self_paced: Self-paced
- mode: VARCHAR(20)
  - online: Online
  - offline: Offline
  - hybrid: Hybrid
- trainer_id: UUID, foreign key to users.id
- max_capacity: INTEGER, default 20
- enrolled_count: INTEGER, default 0
- status: VARCHAR(20), default 'upcoming'
  - upcoming: Not started
  - ongoing: Currently running
  - completed: Completed
  - cancelled: Cancelled
- syllabus: JSONB (array of topics)
- materials_url: VARCHAR(500)
- created_at: TIMESTAMPTZ, default now()
- updated_at: TIMESTAMPTZ, default now()
- deleted_at: TIMESTAMPTZ

Indexes:
- idx_batches_course_id on course_id
- idx_batches_trainer_id on trainer_id
- idx_batches_status on status

Constraints:
- batch_code must be unique
- end_date >= start_date
- enrolled_count <= max_capacity
```

#### Batch Attendance Table
```
Table: batch_attendance

Fields:
- id: UUID, primary key
- batch_id: UUID, foreign key to batches.id, not null
- student_id: UUID, foreign key to students.id, not null
- date: DATE, not null
- status: VARCHAR(20), not null
  - present: Present
  - absent: Absent
  - late: Late
  - excused: Excused
- notes: TEXT
- marked_by: UUID, foreign key to users.id
- created_at: TIMESTAMPTZ, default now()

Indexes:
- idx_batch_attendance_batch_id on batch_id
- idx_batch_attendance_student_id on student_id
- idx_batch_attendance_date on date

Constraints:
- unique (batch_id, student_id, date)
```

### Key Features
- Batch creation and scheduling
- Student enrollment in batches
- Attendance tracking
- Progress monitoring
- Batch reports

---

## 4. Payment Tracking

### Database Schema

#### Payments Table
```
Table: payments

Fields:
- id: UUID, primary key
- student_id: UUID, foreign key to students.id, not null
- enrollment_id: UUID, foreign key to student_enrollments.id
- receipt_number: VARCHAR(50), unique, not null
- amount: DECIMAL(10,2), not null
- payment_date: DATE, not null
- payment_method: VARCHAR(20), not null
  - cash: Cash
  - card: Credit/Debit Card
  - upi: UPI
  - bank_transfer: Bank Transfer
  - cheque: Cheque
- status: VARCHAR(20), default 'paid'
  - pending: Pending
  - paid: Paid
  - failed: Failed
  - refunded: Refunded
- transaction_id: VARCHAR(100)
- bank_reference: VARCHAR(100)
- cheque_number: VARCHAR(50)
- collected_by: UUID, foreign key to users.id
- notes: TEXT
- created_at: TIMESTAMPTZ, default now()
- updated_at: TIMESTAMPTZ, default now()
- deleted_at: TIMESTAMPTZ

Indexes:
- idx_payments_student_id on student_id
- idx_payments_enrollment_id on enrollment_id
- idx_payments_receipt_number on receipt_number
- idx_payments_payment_date on payment_date

Constraints:
- amount must be positive
- receipt_number must be unique
```

#### Payment Refunds Table
```
Table: payment_refunds

Fields:
- id: UUID, primary key
- payment_id: UUID, foreign key to payments.id, not null
- amount: DECIMAL(10,2), not null
- reason: TEXT, not null
- processed_by: UUID, foreign key to users.id
- processed_at: TIMESTAMPTZ, default now()
- status: VARCHAR(20), default 'processed'
- created_at: TIMESTAMPTZ, default now()

Constraints:
- payment_id must exist in payments table
- amount <= payment.amount
```

### Key Features
- Payment recording
- Multiple payment methods
- Receipt generation
- Refund processing
- Payment reports

---

## 5. Intern Management

### Database Schema

#### Interns Table
```
Table: interns

Fields:
- id: UUID, primary key
- name: VARCHAR(255), not null
- email: VARCHAR(255), unique, not null
- phone: VARCHAR(20), not null
- alternate_phone: VARCHAR(20)
- college: VARCHAR(255), not null
- degree: VARCHAR(255), not null
- year: VARCHAR(20)
- skills: TEXT[]
- department: VARCHAR(50), not null
  - training: Training department
  - sales: Sales department
  - marketing: Marketing department
  - content: Content development
- internship_type: VARCHAR(20), not null
  - paid: Paid internship
  - unpaid: Unpaid internship
- duration: VARCHAR(20), not null
  - 1_month: 1 month
  - 2_months: 2 months
  - 3_months: 3 months
  - 6_months: 6 months
- status: VARCHAR(20), default 'applied'
  - applied: Application received
  - shortlisted: Shortlisted for interview
  - offered: Offer extended
  - active: Currently interning
  - completed: Internship completed
  - dropped: Dropped out
  - rejected: Application rejected
- supervisor_id: UUID, foreign key to users.id
- start_date: DATE
- expected_end_date: DATE
- actual_end_date: DATE
- stipend: DECIMAL(10,2)
- resume_url: VARCHAR(500)
- linkedin_url: VARCHAR(500)
- portfolio_url: VARCHAR(500)
- lead_id: UUID, foreign key to leads.id
- converted_at: TIMESTAMPTZ
- converted_by: UUID
- performance_rating: DECIMAL(2,1)
- feedback: TEXT
- approval_status: VARCHAR(20), default 'pending'
  - pending: Pending approval
  - approved: Approved
  - rejected: Rejected
- approved_by: UUID
- approved_at: TIMESTAMPTZ
- rejection_reason: TEXT
- notes: TEXT
- created_at: TIMESTAMPTZ, default now()
- updated_at: TIMESTAMPTZ, default now()
- deleted_at: TIMESTAMPTZ

Indexes:
- idx_interns_email on email
- idx_interns_department on department
- idx_interns_status on status
- idx_interns_supervisor_id on supervisor_id

Constraints:
- email must be unique
- performance_rating between 1 and 5
```

### Key Features
- Intern application workflow
- Approval process
- Performance tracking
- Internship completion
- Certificate generation

---

## API Endpoints Summary

### Leads Endpoints
```
GET    /api/leads                    - List leads
POST   /api/leads                    - Create lead
GET    /api/leads/:id                - Get lead
PUT    /api/leads/:id                - Update lead
DELETE /api/leads/:id                - Delete lead
POST   /api/leads/:id/claim          - Claim lead
POST   /api/leads/:id/call           - Log call
POST   /api/leads/:id/convert        - Convert to student/intern
```

### Students Endpoints
```
GET    /api/students                 - List students
POST   /api/students                 - Create student
GET    /api/students/:id             - Get student
PUT    /api/students/:id             - Update student
DELETE /api/students/:id             - Delete student
POST   /api/students/:id/enroll      - Enroll in course
```

### Batches Endpoints
```
GET    /api/batches                  - List batches
POST   /api/batches                  - Create batch
GET    /api/batches/:id              - Get batch
PUT    /api/batches/:id              - Update batch
DELETE /api/batches/:id              - Delete batch
POST   /api/batches/:id/enroll       - Enroll student
GET    /api/batches/:id/attendance   - Get attendance
POST   /api/batches/:id/attendance   - Mark attendance
```

### Payments Endpoints
```
GET    /api/payments                 - List payments
POST   /api/payments                 - Record payment
GET    /api/payments/:id             - Get payment
POST   /api/payments/:id/refund      - Process refund
GET    /api/payments/reports         - Payment reports
```

### Interns Endpoints
```
GET    /api/interns                  - List interns
POST   /api/interns                  - Create intern
GET    /api/interns/:id              - Get intern
PUT    /api/interns/:id              - Update intern
DELETE /api/interns/:id              - Delete intern
POST   /api/interns/:id/approve      - Approve intern
POST   /api/interns/:id/reject       - Reject intern
POST   /api/interns/:id/complete     - Complete internship
```

---

## Implementation Order

### Week 6: Leads
1. Lead types setup
2. Lead CRUD
3. Call logging
4. Lead assignment
5. Basic reporting

### Week 7: Students & Batches
1. Student profiles
2. Enrollment workflow
3. Batch creation
4. Batch enrollment
5. Attendance

### Week 8: Payments
1. Payment recording
2. Receipt generation
3. Refund process
4. Financial reports

### Week 9: Interns
1. Intern application
2. Approval workflow
3. Internship tracking
4. Completion process

---

## Success Criteria

### Each Feature Must Have:
- [ ] Complete CRUD operations
- [ ] Proper permissions
- [ ] Input validation
- [ ] Error handling
- [ ] Loading states
- [ ] Responsive UI
- [ ] Tests passing
- [ ] Documentation updated

---

## Migration Strategy

### Per Feature:
1. Create database tables
2. Create query functions
3. Create API routes
4. Update UI components
5. Write tests
6. Deploy and test

### Data Migration:
- Keep mock data during development
- Migrate one feature at a time
- Test thoroughly before removing mock data
- Maintain backward compatibility

---

## Notes

- All features depend on Phases 1-4 being complete
- Implement in priority order
- Each feature should be fully functional before next
- Focus on security and permissions
- Maintain audit trails
- Consider scalability