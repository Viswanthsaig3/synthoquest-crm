-- Migration: Create Bugs Reporting System
-- Creates bugs table, bug_history for audit trail, permissions, and developer role

-- ============================================================================
-- BUGS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS bugs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Core fields
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  severity VARCHAR(20) NOT NULL DEFAULT 'medium',
  status VARCHAR(20) NOT NULL DEFAULT 'open',

  -- Reporter info (auto-captured)
  reported_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reporter_name VARCHAR(255),
  reporter_email VARCHAR(255),
  reporter_role VARCHAR(50),
  page_url TEXT NOT NULL,
  error_context TEXT, -- Any detected error popups/messages
  user_agent TEXT, -- Browser info

  -- Screenshot storage (Supabase Storage URL)
  screenshot_url TEXT,
  screenshot_filename VARCHAR(255),
  screenshot_size INTEGER, -- in bytes

  -- Assignment
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  assigned_to_name VARCHAR(255),
  assigned_at TIMESTAMPTZ,
  assigned_by UUID REFERENCES users(id),

  -- Resolution
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES users(id),
  resolution_notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ -- Soft delete for bug reports
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_bugs_reported_by ON bugs(reported_by);
CREATE INDEX IF NOT EXISTS idx_bugs_assigned_to ON bugs(assigned_to);
CREATE INDEX IF NOT EXISTS idx_bugs_status ON bugs(status);
CREATE INDEX IF NOT EXISTS idx_bugs_severity ON bugs(severity);
CREATE INDEX IF NOT EXISTS idx_bugs_created_at ON bugs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bugs_deleted_at ON bugs(deleted_at);

-- Constraints
ALTER TABLE bugs ADD CONSTRAINT check_bug_status
  CHECK (status IN ('open', 'in_progress', 'closed'));

ALTER TABLE bugs ADD CONSTRAINT check_bug_severity
  CHECK (severity IN ('low', 'medium', 'high', 'critical'));

-- ============================================================================
-- BUG HISTORY TABLE (Audit Trail)
-- ============================================================================

CREATE TABLE IF NOT EXISTS bug_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bug_id UUID NOT NULL REFERENCES bugs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  user_name VARCHAR(255),
  action VARCHAR(50) NOT NULL, -- 'created', 'status_changed', 'assigned', 'screenshot_deleted', 'resolved'
  old_value TEXT,
  new_value TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bug_history_bug_id ON bug_history(bug_id);
CREATE INDEX IF NOT EXISTS idx_bug_history_created_at ON bug_history(created_at DESC);

-- ============================================================================
-- PERMISSIONS
-- ============================================================================

INSERT INTO permissions (key, name, description, resource, action) VALUES
  ('bugs.view_all', 'View All Bugs', 'View all bug reports', 'bugs', 'view_all'),
  ('bugs.create', 'Create Bug Reports', 'Report bugs from the application', 'bugs', 'create'),
  ('bugs.manage', 'Manage Bugs', 'Update status, assign bugs, resolve bugs', 'bugs', 'manage'),
  ('bugs.delete_screenshot', 'Delete Bug Screenshots', 'Remove screenshots to save storage', 'bugs', 'delete_screenshot')
ON CONFLICT (key) DO NOTHING;

-- ============================================================================
-- DEVELOPER ROLE
-- ============================================================================

INSERT INTO roles (key, name, description, is_system) VALUES
  ('developer', 'Developer', 'Bug management and limited CRM access', FALSE)
ON CONFLICT (key) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description;

-- Assign bug permissions to developer role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.key = 'developer'
  AND p.key IN ('bugs.view_all', 'bugs.manage', 'bugs.delete_screenshot', 'bugs.create')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Also allow admin to manage bugs
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.key = 'admin'
  AND p.key IN ('bugs.view_all', 'bugs.manage', 'bugs.delete_screenshot', 'bugs.create')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Allow all authenticated users to report bugs
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.key IN ('hr', 'team_lead', 'sales_rep', 'employee', 'intern')
  AND p.key = 'bugs.create'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE bugs IS 'Bug reports from CRM users for internal tracking';
COMMENT ON TABLE bug_history IS 'Audit trail for bug status and assignment changes';
COMMENT ON COLUMN bugs.error_context IS 'Any detected error popups, console errors, or stack traces';
COMMENT ON COLUMN bugs.user_agent IS 'Browser and device information from reporter';