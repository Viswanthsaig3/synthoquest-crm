-- Migration 040: Add Leave Management Permissions
-- Additional permissions for leave balance management

INSERT INTO permissions (key, name, description, resource, action) VALUES
-- Leave viewing
('leaves.view_all', 'View All Leaves', 'View all employee leave requests', 'leaves', 'view_all'),

-- Leave balance management
('leaves.manage_balances', 'Manage Leave Balances', 'Allocate and adjust monthly leave balances for employees', 'leaves', 'manage_balances'),

-- Leave cancellation
('leaves.cancel', 'Cancel Leaves', 'Cancel approved leave requests', 'leaves', 'cancel')
ON CONFLICT (key) DO NOTHING;

-- Note: 'leaves.apply' and 'leaves.approve' already exist from migration 024