-- Phase 2: Role-Based Access Control
-- Migration 005: Create Permissions Table

CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  resource VARCHAR(100) NOT NULL,
  action VARCHAR(50) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_permissions_key ON permissions(key);
CREATE INDEX IF NOT EXISTS idx_permissions_resource ON permissions(resource);

-- Add constraint for key format
ALTER TABLE permissions ADD CONSTRAINT check_permission_key_format 
  CHECK (key ~* '^[a-z_]+\.[a-z_]+$');

COMMENT ON TABLE permissions IS 'Master permission definitions for RBAC system';
COMMENT ON COLUMN permissions.key IS 'Unique permission key in format {resource}.{action}';
