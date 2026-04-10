-- Migration 047: Admin/HR Full Control - Permission Expansion
-- Adds missing permissions for complete admin/HR control over all entities
-- Addresses gaps in timesheet, leave, payroll, student, intern, batch management

-- ============================================================================
-- PART 1: NEW PERMISSIONS - Students, Interns, Batches
-- ============================================================================

INSERT INTO permissions (key, name, description, resource, action) VALUES
  -- Students delete
  ('students.delete', 'Delete Students', 'Delete student records', 'students', 'delete'),

  -- Interns delete
  ('interns.delete', 'Delete Interns', 'Delete intern records', 'interns', 'delete'),

  -- Batches delete
  ('batches.delete', 'Delete Batches', 'Delete or archive training batches', 'batches', 'delete')
ON CONFLICT (key) DO NOTHING;

-- ============================================================================
-- PART 2: LEAVE MANAGEMENT - Edit All & Delete
-- ============================================================================

INSERT INTO permissions (key, name, description, resource, action) VALUES
  -- Leave edit (admin/HR can edit any leave request)
  ('leaves.edit_all', 'Edit All Leaves', 'Edit any leave request regardless of owner or status', 'leaves', 'edit_all'),

  -- Leave delete
  ('leaves.delete', 'Delete Leaves', 'Delete any leave request', 'leaves', 'delete')
ON CONFLICT (key) DO NOTHING;

-- ============================================================================
-- PART 3: TIMESHEET MANAGEMENT - Edit All & Delete
-- ============================================================================

INSERT INTO permissions (key, name, description, resource, action) VALUES
  -- Timesheet edit (admin/HR can edit anyone's timesheet)
  ('timesheets.edit_all', 'Edit All Timesheets', 'Edit any timesheet regardless of owner', 'timesheets', 'edit_all'),

  -- Timesheet delete
  ('timesheets.delete', 'Delete Timesheets', 'Delete any timesheet', 'timesheets', 'delete')
ON CONFLICT (key) DO NOTHING;

-- ============================================================================
-- PART 4: TIMESHEET ENTRY MANAGEMENT - Edit All & Delete
-- ============================================================================

INSERT INTO permissions (key, name, description, resource, action) VALUES
  -- Timesheet entry edit (admin/HR can edit anyone's time entries)
  ('timesheet_entries.edit_all', 'Edit All Time Entries', 'Edit any time entry regardless of owner', 'timesheet_entries', 'edit_all'),

  -- Timesheet entry delete
  ('timesheet_entries.delete', 'Delete Time Entries', 'Delete any time entry', 'timesheet_entries', 'delete')
ON CONFLICT (key) DO NOTHING;

-- ============================================================================
-- PART 5: PAYROLL MANAGEMENT - Edit & Delete
-- ============================================================================

INSERT INTO permissions (key, name, description, resource, action) VALUES
  -- Payroll edit (full editing of payroll calculations)
  ('payroll.edit', 'Edit Payroll', 'Edit payroll calculations and amounts', 'payroll', 'edit'),

  -- Payroll delete
  ('payroll.delete', 'Delete Payroll', 'Delete payroll records', 'payroll', 'delete')
ON CONFLICT (key) DO NOTHING;

-- ============================================================================
-- PART 6: ATTENDANCE MANAGEMENT - Delete
-- ============================================================================

INSERT INTO permissions (key, name, description, resource, action) VALUES
  -- Attendance delete
  ('attendance.delete', 'Delete Attendance', 'Delete attendance records', 'attendance', 'delete')
ON CONFLICT (key) DO NOTHING;

-- ============================================================================
-- PART 7: ADMIN ROLE - Assign ALL permissions
-- ============================================================================

-- Admin gets all new permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
INNER JOIN permissions p ON p.key IN (
  'students.delete',
  'interns.delete',
  'batches.delete',
  'leaves.edit_all',
  'leaves.delete',
  'timesheets.edit_all',
  'timesheets.delete',
  'timesheet_entries.edit_all',
  'timesheet_entries.delete',
  'payroll.edit',
  'payroll.delete',
  'attendance.delete'
)
WHERE r.key = 'admin'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ============================================================================
-- PART 8: HR ROLE - Full management permissions
-- ============================================================================

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
INNER JOIN permissions p ON p.key IN (
  -- Students
  'students.view_all', 'students.create', 'students.edit', 'students.enroll', 'students.delete',
  
  -- Interns
  'interns.view_all', 'interns.approve', 'interns.manage_all', 'interns.delete',
  
  -- Batches
  'batches.view', 'batches.create', 'batches.edit', 'batches.manage', 'batches.delete',
  
  -- Leaves - Full control
  'leaves.view_all', 'leaves.approve', 'leaves.cancel', 'leaves.manage_balances', 'leaves.edit_all', 'leaves.delete',
  
  -- Timesheets - Full control
  'timesheets.view_all', 'timesheets.approve', 'timesheets.edit_all', 'timesheets.delete',
  
  -- Timesheet Entries - Full control
  'timesheet_entries.edit_all', 'timesheet_entries.delete',
  
  -- Payroll - Full control
  'payroll.view_all', 'payroll.process', 'payroll.edit', 'payroll.delete',
  
  -- Attendance - Full control
  'attendance.view_team', 'attendance.adjust_records', 'attendance.view_adjustments', 'attendance.delete',
  'attendance.manage_office_location', 'attendance.manage_home_location_all', 'attendance.view_warnings'
)
WHERE r.key = 'hr'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ============================================================================
-- PART 9: TEAM_LEAD ROLE - Limited management for team
-- ============================================================================

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
INNER JOIN permissions p ON p.key IN (
  -- Can view and approve, but limited edit capabilities for team
  'timesheets.edit_all',
  'timesheet_entries.edit_all',
  'leaves.edit_all'
)
WHERE r.key = 'team_lead'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ============================================================================
-- PART 10: TRAINING ROLE - Batch and student management
-- ============================================================================

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
INNER JOIN permissions p ON p.key IN (
  'students.delete',
  'interns.delete',
  'batches.delete'
)
WHERE r.key = 'training'
ON CONFLICT (role_id, permission_id) DO NOTHING;