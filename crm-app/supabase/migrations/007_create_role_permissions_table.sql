-- Phase 2: Role-Based Access Control
-- Migration 007: Create Role Permissions Table

CREATE TABLE IF NOT EXISTS role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON role_permissions(permission_id);

-- Add unique constraint
ALTER TABLE role_permissions ADD CONSTRAINT unique_role_permission 
  UNIQUE (role_id, permission_id);

COMMENT ON TABLE role_permissions IS 'Many-to-many mapping between roles and permissions';
