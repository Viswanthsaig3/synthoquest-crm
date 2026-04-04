-- Phase 2: Role-Based Access Control
-- Migration 008: Create Audit Tables

-- User Roles Audit Table
CREATE TABLE IF NOT EXISTS user_roles_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  old_role VARCHAR(50) NOT NULL,
  new_role VARCHAR(50) NOT NULL,
  changed_by UUID REFERENCES users(id),
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reason TEXT
);

-- Permission Checks Audit Table
CREATE TABLE IF NOT EXISTS permission_checks_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  permission VARCHAR(100) NOT NULL,
  resource VARCHAR(100),
  resource_id VARCHAR(255),
  granted BOOLEAN NOT NULL,
  checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address VARCHAR(50)
);

-- Create indexes for user_roles_audit
CREATE INDEX IF NOT EXISTS idx_user_roles_audit_user_id ON user_roles_audit(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_audit_changed_at ON user_roles_audit(changed_at);

-- Create indexes for permission_checks_audit
CREATE INDEX IF NOT EXISTS idx_permission_checks_user_id ON permission_checks_audit(user_id);
CREATE INDEX IF NOT EXISTS idx_permission_checks_checked_at ON permission_checks_audit(checked_at);
CREATE INDEX IF NOT EXISTS idx_permission_checks_granted ON permission_checks_audit(granted);

-- Add retention policy comment (implement with pg_cron or application logic)
COMMENT ON TABLE permission_checks_audit IS 'Audit log for permission checks. Consider implementing retention policy.';

-- Create function to cleanup old permission checks (optional - can be scheduled)
CREATE OR REPLACE FUNCTION cleanup_old_permission_checks(days_to_keep INTEGER DEFAULT 30)
RETURNS void AS $$
BEGIN
  DELETE FROM permission_checks_audit
  WHERE checked_at < NOW() - (days_to_keep || ' days')::INTERVAL;
END;
$$ LANGUAGE plpgsql;
