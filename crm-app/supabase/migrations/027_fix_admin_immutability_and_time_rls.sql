-- Migration 027: Final RBAC governance + time-table RLS hardening

-- Ensure admin is the only system role.
UPDATE roles
SET is_system = CASE WHEN key = 'admin' THEN TRUE ELSE FALSE END;

-- Ensure attendance action permissions are present for active working roles.
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.key IN ('attendance.checkin', 'attendance.checkout')
WHERE r.key IN ('hr', 'team_lead', 'sales_rep', 'employee', 'intern')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- If a user's role was archived, downgrade to baseline employee.
UPDATE users u
SET role = 'employee'
WHERE EXISTS (
  SELECT 1
  FROM roles r
  WHERE r.key = u.role
    AND r.archived_at IS NOT NULL
);

DO $$
DECLARE
  tbl text;
  tables text[] := ARRAY[
    'time_entries',
    'attendance_records',
    'work_schedules',
    'organization_settings'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables
  LOOP
    EXECUTE format('ALTER TABLE IF EXISTS public.%I ENABLE ROW LEVEL SECURITY', tbl);
    EXECUTE format('ALTER TABLE IF EXISTS public.%I FORCE ROW LEVEL SECURITY', tbl);
    EXECUTE format('DROP POLICY IF EXISTS deny_client_access ON public.%I', tbl);
    EXECUTE format(
      'CREATE POLICY deny_client_access ON public.%I FOR ALL TO anon, authenticated USING (false) WITH CHECK (false)',
      tbl
    );
  END LOOP;
END $$;

-- Drop legacy role-name-based policies from original time logging migration.
DROP POLICY IF EXISTS "Users can view own time entries" ON public.time_entries;
DROP POLICY IF EXISTS "Users can create own time entries" ON public.time_entries;
DROP POLICY IF EXISTS "Users can update own pending entries" ON public.time_entries;
DROP POLICY IF EXISTS "Admins can manage all entries" ON public.time_entries;

DROP POLICY IF EXISTS "Users can view own attendance" ON public.attendance_records;
DROP POLICY IF EXISTS "Users can create own attendance" ON public.attendance_records;
DROP POLICY IF EXISTS "Users can update own attendance" ON public.attendance_records;

DROP POLICY IF EXISTS "All authenticated users can view work schedules" ON public.work_schedules;
DROP POLICY IF EXISTS "Only admins can manage work schedules" ON public.work_schedules;

DROP POLICY IF EXISTS "All authenticated users can view org settings" ON public.organization_settings;
DROP POLICY IF EXISTS "Only admins can update org settings" ON public.organization_settings;
