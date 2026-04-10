-- Migration 029: Seed core business roles (intern, employee, hr, training) with permission maps
-- Idempotent: upserts roles and inserts role_permissions where missing.

INSERT INTO roles (key, name, description, is_system) VALUES
  ('intern', 'Intern', 'Internship access: tasks, timesheets, attendance, leave requests', FALSE),
  ('employee', 'Employee', 'Standard staff: tasks, timesheets, attendance, leave requests', FALSE),
  ('hr', 'HR', 'Human resources: employees, payroll, approvals, and org-wide HR workflows', FALSE),
  ('training', 'Training & Teaching', 'Instruction and delivery: batches, students, certificates, class operations', FALSE)
ON CONFLICT (key) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  is_system = FALSE,
  archived_at = NULL,
  updated_at = NOW();

-- Intern: baseline worker
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
INNER JOIN permissions p ON p.key IN (
  'tasks.complete',
  'timesheets.submit',
  'attendance.checkin',
  'attendance.checkout',
  'leaves.apply'
)
WHERE r.key = 'intern'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Employee: same baseline as typical staff (can extend independently)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
INNER JOIN permissions p ON p.key IN (
  'tasks.complete',
  'timesheets.submit',
  'attendance.checkin',
  'attendance.checkout',
  'leaves.apply'
)
WHERE r.key = 'employee'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- HR: broad HR / people operations (aligned with historical 009 hr profile)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
INNER JOIN permissions p ON p.key IN (
  'tasks.view_all', 'tasks.create', 'tasks.assign', 'tasks.edit',
  'leads.view_all', 'leads.create', 'leads.claim',
  'students.view_all', 'students.create', 'students.edit', 'students.enroll',
  'interns.view_all', 'interns.approve',
  'employees.view_all', 'employees.manage',
  'batches.view', 'batches.create', 'batches.edit',
  'payments.view_all', 'payments.create', 'payments.process',
  'certificates.view_all', 'certificates.issue',
  'reports.view',
  'leaves.approve',
  'timesheets.view_all', 'timesheets.approve',
  'attendance.view_team', 'attendance.checkin', 'attendance.checkout',
  'payroll.view_all', 'payroll.process'
)
WHERE r.key = 'hr'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Training & Teaching: delivery-focused (batches, students, certs) without employees.manage
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
INNER JOIN permissions p ON p.key IN (
  'tasks.view_all', 'tasks.create', 'tasks.assign', 'tasks.edit', 'tasks.complete',
  'students.view_all', 'students.create', 'students.edit', 'students.enroll',
  'batches.view', 'batches.create', 'batches.edit', 'batches.manage',
  'certificates.view_all', 'certificates.issue',
  'reports.view',
  'leaves.apply', 'leaves.approve',
  'timesheets.view_all', 'timesheets.approve',
  'attendance.view_team', 'attendance.checkin', 'attendance.checkout',
  'interns.view_all'
)
WHERE r.key = 'training'
ON CONFLICT (role_id, permission_id) DO NOTHING;
