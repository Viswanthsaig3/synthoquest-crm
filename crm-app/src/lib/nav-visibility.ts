/**
 * Phase-gated sidebar: only hrefs in this set are shown in the main nav.
 * Other routes may still exist for direct URLs / future work — add their href here when a phase ships.
 *
 * Keep in sync with `navGroups` in `components/layout/sidebar.tsx` and work-only items (tasks, timesheets, attendance).
 */
const SIDEBAR_IMPLEMENTED_HREFS = new Set<string>([
  '/',
  '/leads/pool',
  '/leads/mine',
  '/leads',
  '/leads/new',
  '/interns',
  '/interns/new',
  '/employees',
  '/employees/hierarchy',
  '/tasks',
  '/timesheets',
  '/attendance',
  '/attendance/history',
  '/attendance/team',
  '/attendance/warnings',
  '/attendance/security',
  '/settings',
  '/settings/profile',
  '/settings/organization',
  '/leaves',
  '/leaves/apply',
  '/leaves/approvals',
  '/leaves/calendar',
  '/leaves/balances',
  '/payroll',
  '/payroll/hours',
  '/payroll/run',
  '/bugs',
])

export function isSidebarNavImplemented(href: string): boolean {
  return SIDEBAR_IMPLEMENTED_HREFS.has(href)
}
