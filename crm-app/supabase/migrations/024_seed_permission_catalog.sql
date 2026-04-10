-- Migration 024: Seed permission catalog only (safe for all environments)

INSERT INTO permissions (key, name, description, resource, action) VALUES
-- Tasks
('tasks.view_all', 'View All Tasks', 'View all tasks in the system', 'tasks', 'view_all'),
('tasks.view_own', 'View Own Tasks', 'View own assigned tasks', 'tasks', 'view_own'),
('tasks.create', 'Create Tasks', 'Create new tasks', 'tasks', 'create'),
('tasks.assign', 'Assign Tasks', 'Assign tasks to others', 'tasks', 'assign'),
('tasks.edit', 'Edit Tasks', 'Edit existing tasks', 'tasks', 'edit'),
('tasks.delete', 'Delete Tasks', 'Delete tasks', 'tasks', 'delete'),
('tasks.complete', 'Complete Tasks', 'Mark tasks as complete', 'tasks', 'complete'),

-- Timesheets
('timesheets.view_all', 'View All Timesheets', 'View all timesheets', 'timesheets', 'view_all'),
('timesheets.submit', 'Submit Timesheets', 'Submit own timesheets', 'timesheets', 'submit'),
('timesheets.approve', 'Approve Timesheets', 'Approve timesheets', 'timesheets', 'approve'),

-- Attendance
('attendance.view_team', 'View Team Attendance', 'View team attendance', 'attendance', 'view_team'),
('attendance.checkin', 'Check In', 'Create own attendance check-in', 'attendance', 'checkin'),
('attendance.checkout', 'Check Out', 'Create own attendance check-out', 'attendance', 'checkout'),

-- Leaves
('leaves.apply', 'Apply for Leave', 'Apply for leave', 'leaves', 'apply'),
('leaves.approve', 'Approve Leave', 'Approve leave requests', 'leaves', 'approve'),

-- Employees / Roles
('employees.view_all', 'View All Employees', 'View all employees', 'employees', 'view_all'),
('employees.manage', 'Manage Employees', 'Create, edit, delete employees', 'employees', 'manage'),
('roles.manage', 'Manage Roles', 'Manage roles and permissions', 'roles', 'manage'),

-- System
('reports.view', 'View Reports', 'View reports', 'reports', 'view'),
('settings.manage', 'Manage Settings', 'Manage system settings', 'settings', 'manage')
ON CONFLICT (key) DO NOTHING;
