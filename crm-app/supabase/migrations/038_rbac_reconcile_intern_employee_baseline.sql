-- Migration 038: Reconcile intern + employee role_permissions to worker baseline
-- Sources: 029_seed_roles_intern_employee_hr_training + 033 (manage_home_location_self)
--
-- Removes mistaken org-wide or elevated permissions (e.g. tasks.view_all on intern,
-- employees.view_all / timesheets.view_all on employee) so API *.view_all branches cannot
-- be triggered by worker roles.

-- Allowed permission keys for baseline worker roles
-- (tasks.complete, timesheets, attendance, leaves, WFH self geofence)
DELETE FROM role_permissions rp
USING roles r
WHERE rp.role_id = r.id
  AND r.key IN ('intern', 'employee')
  AND rp.permission_id NOT IN (
    SELECT id
    FROM permissions
    WHERE key IN (
      'tasks.complete',
      'timesheets.submit',
      'attendance.checkin',
      'attendance.checkout',
      'leaves.apply',
      'attendance.manage_home_location_self'
    )
  );

-- Ensure full baseline is present (idempotent)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
INNER JOIN permissions p ON p.key IN (
  'tasks.complete',
  'timesheets.submit',
  'attendance.checkin',
  'attendance.checkout',
  'leaves.apply',
  'attendance.manage_home_location_self'
)
WHERE r.key IN ('intern', 'employee')
ON CONFLICT (role_id, permission_id) DO NOTHING;
