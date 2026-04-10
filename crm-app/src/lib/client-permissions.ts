import type { User } from '@/types/user'

export function hasPermission(user: User | null | undefined, permission: string): boolean {
  if (!user) return false
  return Array.isArray(user.permissions) && user.permissions.includes(permission)
}

export function hasAnyPermission(user: User | null | undefined, permissions: string[]): boolean {
  if (!user || !Array.isArray(user.permissions)) return false
  return permissions.some((permission) => user.permissions!.includes(permission))
}

/** View another user’s attendance history (employee profile tab). Mirrors GET /api/attendance/history rules. */
export function canViewEmployeeAttendanceHistory(
  viewer: User | null | undefined,
  employee: { id: string; managedBy?: string | null }
): boolean {
  if (!viewer) return false
  if (employee.id === viewer.id) return true
  const hr =
    hasPermission(viewer, 'employees.view_all') && hasPermission(viewer, 'attendance.view_team')
  if (hr) return true
  const managerScoped =
    (hasPermission(viewer, 'timesheets.approve') ||
      (hasPermission(viewer, 'attendance.view_team') &&
        !hasPermission(viewer, 'employees.view_all'))) &&
    employee.managedBy === viewer.id
  return Boolean(managerScoped)
}

/** Matches server gate for GET /api/attendance/team-today (manager or org-wide HR). */
export function canViewTeamAttendance(user: User | null | undefined): boolean {
  if (!user) return false
  return (
    hasPermission(user, 'attendance.view_team') || hasPermission(user, 'timesheets.approve')
  )
}

export function isWorkOnlyUser(user: User | null | undefined): boolean {
  if (!user || !Array.isArray(user.permissions)) return false
  const permissions = user.permissions
  return (
    permissions.includes('tasks.complete') &&
    permissions.includes('timesheets.submit') &&
    !permissions.some((p) =>
      [
        'employees.view_all',
        'employees.manage',
        'employees.manage_assigned',
        'interns.manage_all',
        'interns.manage_assigned',
        'compensation.manage',
        'roles.manage',
        'settings.manage',
        'leads.view_all',
        'leads.create',
        'tasks.view_all',
        'tasks.create',
        'timesheets.approve',
        'timesheets.view_all',
      ].includes(p)
    )
  )
}

export function canAdjustAttendanceRecords(user: User | null | undefined): boolean {
  return hasPermission(user, 'attendance.adjust_records')
}

export function canViewAttendanceAdjustments(user: User | null | undefined): boolean {
  return hasPermission(user, 'attendance.view_adjustments')
}

// Bug permissions
export function canViewAllBugs(user: User | null | undefined): boolean {
  return hasPermission(user, 'bugs.view_all')
}

export function canManageBugs(user: User | null | undefined): boolean {
  return hasPermission(user, 'bugs.manage')
}

export function canDeleteBugScreenshot(user: User | null | undefined): boolean {
  return hasPermission(user, 'bugs.delete_screenshot')
}

export function canCreateBugReport(user: User | null | undefined): boolean {
  return hasPermission(user, 'bugs.create')
}

// Student permissions
export function canDeleteStudent(user: User | null | undefined): boolean {
  return hasPermission(user, 'students.delete')
}

// Intern permissions
export function canDeleteIntern(user: User | null | undefined): boolean {
  return hasPermission(user, 'interns.delete')
}

// Batch permissions
export function canDeleteBatch(user: User | null | undefined): boolean {
  return hasPermission(user, 'batches.delete')
}

// Leave permissions
export function canViewAllLeaves(user: User | null | undefined): boolean {
  return hasPermission(user, 'leaves.view_all')
}

export function canManageLeaveBalances(user: User | null | undefined): boolean {
  return hasPermission(user, 'leaves.manage_balances')
}

export function canEditAllLeaves(user: User | null | undefined): boolean {
  return hasPermission(user, 'leaves.edit_all')
}

export function canDeleteLeave(user: User | null | undefined): boolean {
  return hasPermission(user, 'leaves.delete')
}

// Timesheet permissions
export function canEditAllTimesheets(user: User | null | undefined): boolean {
  return hasPermission(user, 'timesheets.edit_all')
}

export function canDeleteTimesheet(user: User | null | undefined): boolean {
  return hasPermission(user, 'timesheets.delete')
}

export function canEditAllTimeEntries(user: User | null | undefined): boolean {
  return hasPermission(user, 'timesheet_entries.edit_all')
}

export function canDeleteTimeEntry(user: User | null | undefined): boolean {
  return hasPermission(user, 'timesheet_entries.delete')
}

// Attendance permissions
export function canDeleteAttendance(user: User | null | undefined): boolean {
  return hasPermission(user, 'attendance.delete')
}

// Payroll permissions
export function canEditPayroll(user: User | null | undefined): boolean {
  return hasPermission(user, 'payroll.edit')
}

export function canDeletePayroll(user: User | null | undefined): boolean {
  return hasPermission(user, 'payroll.delete')
}
