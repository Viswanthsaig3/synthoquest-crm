-- Migration 023: RBAC scalability + data integrity hardening

-- 1) Allow custom role keys by moving users.role from enum to text
INSERT INTO roles (key, name, description, is_system)
VALUES
  ('admin', 'Administrator', 'Super administrator with full system access', TRUE),
  ('employee', 'Employee', 'Baseline employee role', FALSE)
ON CONFLICT (key) DO NOTHING;

ALTER TABLE users
  ALTER COLUMN role DROP DEFAULT;

ALTER TABLE users
  ALTER COLUMN role TYPE text
  USING role::text;

ALTER TABLE users
  ADD CONSTRAINT users_role_fk
  FOREIGN KEY (role) REFERENCES roles(key);

ALTER TABLE users
  ALTER COLUMN role SET DEFAULT 'employee';

-- 2) Ensure intern exists in enum-less RBAC model
INSERT INTO roles (key, name, description, is_system)
VALUES ('intern', 'Intern', 'Task and timesheet access only', FALSE)
ON CONFLICT (key) DO NOTHING;

-- 3) Add role lifecycle metadata for custom role management
ALTER TABLE roles
  ADD COLUMN IF NOT EXISTS archived_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_roles_archived_at ON roles(archived_at);

-- 4) Add missing FK for timesheet entry to task relationship
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE table_schema = 'public'
      AND table_name = 'timesheet_entries'
      AND constraint_name = 'timesheet_entries_task_id_fkey'
  ) THEN
    ALTER TABLE timesheet_entries
      ADD CONSTRAINT timesheet_entries_task_id_fkey
      FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 5) Add high-value indexes for approval filters
CREATE INDEX IF NOT EXISTS idx_timesheets_approved_by ON timesheets(approved_by);
CREATE INDEX IF NOT EXISTS idx_timesheets_rejected_by ON timesheets(rejected_by);
CREATE INDEX IF NOT EXISTS idx_timesheets_submitted_by ON timesheets(submitted_by);
CREATE INDEX IF NOT EXISTS idx_time_entries_approved_by ON time_entries(approved_by);
CREATE INDEX IF NOT EXISTS idx_time_entries_rejected_by ON time_entries(rejected_by);
CREATE INDEX IF NOT EXISTS idx_users_managed_by ON users(managed_by);
CREATE INDEX IF NOT EXISTS idx_attendance_records_manual_entry_by ON attendance_records(manual_entry_by);

-- 6) Harden function search_path
ALTER FUNCTION public.auto_calculate_hours() SET search_path = public;
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;
ALTER FUNCTION public.cleanup_expired_tokens() SET search_path = public;
ALTER FUNCTION public.cleanup_old_permission_checks() SET search_path = public;
