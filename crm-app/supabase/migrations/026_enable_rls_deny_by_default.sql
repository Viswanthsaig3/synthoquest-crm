-- Migration 026: Enable RLS and deny direct client access by default
-- API layer uses service role key; this migration prevents accidental PostgREST exposure.

DO $$
DECLARE
  tbl text;
  tables text[] := ARRAY[
    'users',
    'permissions',
    'roles',
    'role_permissions',
    'login_logs',
    'refresh_tokens',
    'user_roles_audit',
    'permission_checks_audit',
    'leads',
    'lead_activities',
    'lead_types',
    'call_records',
    'tasks',
    'task_comments',
    'task_history',
    'task_time_logs',
    'time_entries',
    'attendance_records',
    'work_schedules',
    'organization_settings',
    'timesheets',
    'timesheet_entries',
    'timesheet_approvals'
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
