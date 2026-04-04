-- Phase 2: Role-Based Access Control
-- Migration 006: Create Roles Table

CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  is_system BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_roles_key ON roles(key);

-- Create updated_at trigger
CREATE TRIGGER update_roles_updated_at
  BEFORE UPDATE ON roles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add constraint for key format
ALTER TABLE roles ADD CONSTRAINT check_role_key_format 
  CHECK (key ~* '^[a-z_]+$');

COMMENT ON TABLE roles IS 'Role definitions for RBAC system';
COMMENT ON COLUMN roles.is_system IS 'System roles cannot be deleted';
