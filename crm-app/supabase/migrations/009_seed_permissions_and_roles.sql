-- Phase 2: Role-Based Access Control
-- Migration 009: Seed Permissions and Roles

-- Insert Permissions
INSERT INTO permissions (key, name, description, resource, action) VALUES
-- Tasks
('tasks.view_all', 'View All Tasks', 'View all tasks in the system', 'tasks', 'view_all'),
('tasks.create', 'Create Tasks', 'Create new tasks', 'tasks', 'create'),
('tasks.assign', 'Assign Tasks', 'Assign tasks to others', 'tasks', 'assign'),
('tasks.edit', 'Edit Tasks', 'Edit existing tasks', 'tasks', 'edit'),
('tasks.delete', 'Delete Tasks', 'Delete tasks', 'tasks', 'delete'),
('tasks.complete', 'Complete Tasks', 'Mark tasks as complete', 'tasks', 'complete'),

-- Leads
('leads.view_all', 'View All Leads', 'View all leads', 'leads', 'view_all'),
('leads.view_assigned', 'View Assigned Leads', 'View only assigned leads', 'leads', 'view_assigned'),
('leads.create', 'Create Leads', 'Create new leads', 'leads', 'create'),
('leads.edit', 'Edit Leads', 'Edit leads', 'leads', 'edit'),
('leads.delete', 'Delete Leads', 'Delete leads', 'leads', 'delete'),
('leads.claim', 'Claim Leads', 'Claim unassigned leads', 'leads', 'claim'),
('leads.call', 'Call Leads', 'Make calls to leads', 'leads', 'call'),
('leads.convert', 'Convert Leads', 'Convert leads to students/interns', 'leads', 'convert'),

-- Students
('students.view_all', 'View All Students', 'View all students', 'students', 'view_all'),
('students.view_assigned', 'View Assigned Students', 'View only assigned students', 'students', 'view_assigned'),
('students.create', 'Create Students', 'Create new students', 'students', 'create'),
('students.edit', 'Edit Students', 'Edit students', 'students', 'edit'),
('students.enroll', 'Enroll Students', 'Enroll students in courses', 'students', 'enroll'),

-- Interns
('interns.view_all', 'View All Interns', 'View all interns', 'interns', 'view_all'),
('interns.view_assigned', 'View Assigned Interns', 'View only assigned interns', 'interns', 'view_assigned'),
('interns.approve', 'Approve Interns', 'Approve intern applications', 'interns', 'approve'),

-- Employees
('employees.view_all', 'View All Employees', 'View all employees', 'employees', 'view_all'),
('employees.manage', 'Manage Employees', 'Create, edit, delete employees', 'employees', 'manage'),

-- Timesheets
('timesheets.view_all', 'View All Timesheets', 'View all timesheets', 'timesheets', 'view_all'),
('timesheets.submit', 'Submit Timesheets', 'Submit own timesheets', 'timesheets', 'submit'),
('timesheets.approve', 'Approve Timesheets', 'Approve timesheets', 'timesheets', 'approve'),

-- Attendance
('attendance.view_team', 'View Team Attendance', 'View team attendance', 'attendance', 'view_team'),

-- Leaves
('leaves.apply', 'Apply for Leave', 'Apply for leave', 'leaves', 'apply'),
('leaves.approve', 'Approve Leave', 'Approve leave requests', 'leaves', 'approve'),

-- Payroll
('payroll.view_all', 'View All Payroll', 'View all payroll', 'payroll', 'view_all'),
('payroll.view_own', 'View Own Payroll', 'View own payroll only', 'payroll', 'view_own'),
('payroll.process', 'Process Payroll', 'Process payroll', 'payroll', 'process'),

-- Batches
('batches.view', 'View Batches', 'View batches', 'batches', 'view'),
('batches.create', 'Create Batches', 'Create batches', 'batches', 'create'),
('batches.edit', 'Edit Batches', 'Edit batches', 'batches', 'edit'),
('batches.manage', 'Manage Batches', 'Manage batch students', 'batches', 'manage'),

-- Payments
('payments.view_all', 'View All Payments', 'View all payments', 'payments', 'view_all'),
('payments.view_assigned', 'View Assigned Payments', 'View assigned payments', 'payments', 'view_assigned'),
('payments.create', 'Create Payments', 'Record payments', 'payments', 'create'),
('payments.process', 'Process Payments', 'Process refunds', 'payments', 'process'),

-- Certificates
('certificates.view_all', 'View All Certificates', 'View all certificates', 'certificates', 'view_all'),
('certificates.issue', 'Issue Certificates', 'Issue certificates', 'certificates', 'issue'),

-- System
('reports.view', 'View Reports', 'View reports', 'reports', 'view'),
('settings.manage', 'Manage Settings', 'Manage system settings', 'settings', 'manage'),
('roles.manage', 'Manage Roles', 'Manage roles and permissions', 'roles', 'manage')
ON CONFLICT (key) DO NOTHING;

-- Insert Roles
INSERT INTO roles (key, name, description, is_system) VALUES
('admin', 'Administrator', 'Full system access with all permissions', TRUE),
('hr', 'HR Manager', 'Human resources management', TRUE),
('team_lead', 'Team Lead', 'Team management and approvals', TRUE),
('sales_rep', 'Sales Representative', 'Sales and lead management', TRUE),
('employee', 'Employee', 'Basic employee access', TRUE)
ON CONFLICT (key) DO NOTHING;

-- Map permissions to admin role (all permissions)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.key = 'admin'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Map permissions to hr role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.key = 'hr' AND p.key IN (
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
  'attendance.view_team',
  'payroll.view_all', 'payroll.process'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Map permissions to team_lead role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.key = 'team_lead' AND p.key IN (
  'tasks.view_all', 'tasks.create', 'tasks.assign', 'tasks.edit',
  'leads.view_all', 'leads.create', 'leads.edit', 'leads.claim', 'leads.call', 'leads.convert',
  'students.view_assigned',
  'interns.view_all',
  'payments.view_assigned',
  'reports.view',
  'leaves.approve',
  'timesheets.view_all', 'timesheets.approve',
  'attendance.view_team'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Map permissions to sales_rep role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.key = 'sales_rep' AND p.key IN (
  'leads.view_assigned', 'leads.create', 'leads.edit', 'leads.claim', 'leads.call', 'leads.convert',
  'students.view_assigned',
  'payments.view_assigned',
  'tasks.complete',
  'leaves.apply',
  'timesheets.submit'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Map permissions to employee role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.key = 'employee' AND p.key IN (
  'tasks.complete',
  'leaves.apply',
  'timesheets.submit',
  'payroll.view_own'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;
