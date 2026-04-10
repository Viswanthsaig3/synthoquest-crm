-- RBAC invariant checks for worker roles (intern, employee).
-- Run against Postgres (e.g. Supabase SQL editor or: psql "$DIRECT_URL" -f scripts/rbac-invariants.sql)
-- Expect: each query returns 0 rows. Any rows indicate permission drift or bad grants.

-- Worker roles must not hold org-wide "*.view_all" permissions (defense-in-depth vs API unscoped branches)
SELECT r.key AS role, p.key AS forbidden_permission
FROM roles r
JOIN role_permissions rp ON rp.role_id = r.id
JOIN permissions p ON p.id = rp.permission_id
WHERE r.key IN ('intern', 'employee')
  AND p.key LIKE '%.view_all'
ORDER BY r.key, p.key;

-- Intern must not have tasks.view_all (common mis-grant)
SELECT r.key AS role, p.key AS forbidden_permission
FROM roles r
JOIN role_permissions rp ON rp.role_id = r.id
JOIN permissions p ON p.id = rp.permission_id
WHERE r.key = 'intern'
  AND p.key = 'tasks.view_all';
