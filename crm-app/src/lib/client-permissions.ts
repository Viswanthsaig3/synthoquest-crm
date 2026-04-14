import type { User } from '@/types/user'
import {
  canViewTeamAttendance as canViewTeamAttendanceBase,
  canAdjustAttendanceRecords as canAdjustAttendanceRecordsBase,
  canViewAttendanceAdjustments as canViewAttendanceAdjustmentsBase,
  canDeleteStudent as canDeleteStudentBase,
  canDeleteIntern as canDeleteInternBase,
  canDeleteBatch as canDeleteBatchBase,
  canViewAllLeaves as canViewAllLeavesBase,
  canManageLeaveBalances as canManageLeaveBalancesBase,
  canEditAllLeaves as canEditAllLeavesBase,
  canDeleteLeave as canDeleteLeaveBase,
  canEditAllTimesheets as canEditAllTimesheetsBase,
  canDeleteTimesheet as canDeleteTimesheetBase,
  canEditAllTimeEntries as canEditAllTimeEntriesBase,
  canDeleteTimeEntry as canDeleteTimeEntryBase,
  canDeleteAttendance as canDeleteAttendanceBase,
  canEditPayroll as canEditPayrollBase,
  canDeletePayroll as canDeletePayrollBase,
} from '@/lib/permissions'

export function hasPermission(user: User | null | undefined, permission: string): boolean {
  if (!user) return false
  return Array.isArray(user.permissions) && user.permissions.includes(permission)
}

export function hasAnyPermission(user: User | null | undefined, permissions: string[]): boolean {
  if (!user || !Array.isArray(user.permissions)) return false
  return permissions.some((permission) => user.permissions!.includes(permission))
}

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

export function canViewTeamAttendance(user: User | null | undefined): boolean {
  if (!user) return false
  return canViewTeamAttendanceBase(user)
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
  if (!user) return false
  return canAdjustAttendanceRecordsBase(user)
}

export function canViewAttendanceAdjustments(user: User | null | undefined): boolean {
  if (!user) return false
  return canViewAttendanceAdjustmentsBase(user)
}

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

export function canDeleteStudent(user: User | null | undefined): boolean {
  if (!user) return false
  return canDeleteStudentBase(user)
}

export function canDeleteIntern(user: User | null | undefined): boolean {
  if (!user) return false
  return canDeleteInternBase(user)
}

export function canDeleteBatch(user: User | null | undefined): boolean {
  if (!user) return false
  return canDeleteBatchBase(user)
}

export function canViewAllLeaves(user: User | null | undefined): boolean {
  if (!user) return false
  return canViewAllLeavesBase(user)
}

export function canManageLeaveBalances(user: User | null | undefined): boolean {
  if (!user) return false
  return canManageLeaveBalancesBase(user)
}

export function canEditAllLeaves(user: User | null | undefined): boolean {
  if (!user) return false
  return canEditAllLeavesBase(user)
}

export function canDeleteLeave(user: User | null | undefined): boolean {
  if (!user) return false
  return canDeleteLeaveBase(user)
}

export function canEditAllTimesheets(user: User | null | undefined): boolean {
  if (!user) return false
  return canEditAllTimesheetsBase(user)
}

export function canDeleteTimesheet(user: User | null | undefined): boolean {
  if (!user) return false
  return canDeleteTimesheetBase(user)
}

export function canEditAllTimeEntries(user: User | null | undefined): boolean {
  if (!user) return false
  return canEditAllTimeEntriesBase(user)
}

export function canDeleteTimeEntry(user: User | null | undefined): boolean {
  if (!user) return false
  return canDeleteTimeEntryBase(user)
}

export function canDeleteAttendance(user: User | null | undefined): boolean {
  if (!user) return false
  return canDeleteAttendanceBase(user)
}

export function canEditPayroll(user: User | null | undefined): boolean {
  if (!user) return false
  return canEditPayrollBase(user)
}

export function canDeletePayroll(user: User | null | undefined): boolean {
  if (!user) return false
  return canDeletePayrollBase(user)
}