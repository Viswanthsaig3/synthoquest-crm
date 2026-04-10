-- Migration 022: Add intern role to users enum and RBAC mappings

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'user_role' AND e.enumlabel = 'intern'
  ) THEN
    ALTER TYPE user_role ADD VALUE 'intern';
  END IF;
END $$;

DO $$
DECLARE
  app_env text := COALESCE(current_setting('app.env', true), 'production');
BEGIN
  IF app_env IN ('development', 'staging', 'test', 'local') THEN
    INSERT INTO roles (key, name, description, is_system)
    VALUES ('intern', 'Intern', 'Task and timesheet access only', FALSE)
    ON CONFLICT (key) DO UPDATE
    SET is_system = FALSE;

    DELETE FROM role_permissions
    WHERE role_id = (SELECT id FROM roles WHERE key = 'employee')
      AND permission_id IN (
        SELECT id FROM permissions WHERE key IN ('leaves.apply', 'payroll.view_own')
      );

    INSERT INTO role_permissions (role_id, permission_id)
    SELECT r.id, p.id
    FROM roles r
    JOIN permissions p ON p.key IN ('tasks.complete', 'timesheets.submit', 'attendance.checkin', 'attendance.checkout')
    WHERE r.key = 'intern'
    ON CONFLICT (role_id, permission_id) DO NOTHING;
  END IF;
END $$;
