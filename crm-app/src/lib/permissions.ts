import { User } from '@/types/user'
import { Task } from '@/types/task'
import { Leave } from '@/types/leave'
import { Timesheet } from '@/types/timesheet'
import { Lead } from '@/types/lead'
import { Student } from '@/types/student'
import { Batch } from '@/types/batch'
import { Payment } from '@/types/payment'

type Permission =
  | 'tasks.view_all'
  | 'tasks.create'
  | 'tasks.assign'
  | 'tasks.edit'
  | 'tasks.delete'
  | 'tasks.complete'
  | 'leads.view_all'
  | 'leads.view_assigned'
  | 'leads.create'
  | 'leads.edit'
  | 'leads.delete'
  | 'leads.claim'
  | 'leads.call'
  | 'leads.convert'
  | 'students.view_all'
  | 'students.view_assigned'
  | 'students.create'
  | 'students.edit'
  | 'students.enroll'
  | 'students.delete'
  | 'interns.view_all'
  | 'interns.view_assigned'
  | 'interns.manage_all'
  | 'interns.manage_assigned'
  | 'interns.delete'
  | 'batches.view'
  | 'batches.create'
  | 'batches.edit'
  | 'batches.manage'
  | 'batches.delete'
  | 'payments.view_all'
  | 'payments.view_assigned'
  | 'payments.create'
  | 'payments.process'
  | 'certificates.view_all'
  | 'certificates.issue'
  | 'reports.view'
  | 'leaves.apply'
  | 'leaves.approve'
  | 'leaves.cancel'
  | 'leaves.view_all'
  | 'leaves.manage_balances'
  | 'leaves.edit_all'
  | 'leaves.delete'
  | 'timesheets.submit'
  | 'timesheets.approve'
  | 'timesheets.view_all'
  | 'timesheets.edit_all'
  | 'timesheets.delete'
  | 'timesheet_entries.edit_all'
  | 'timesheet_entries.delete'
  | 'attendance.view_team'
  | 'attendance.manage_office_location'
  | 'attendance.manage_home_location_self'
  | 'attendance.manage_home_location_all'
  | 'attendance.view_warnings'
  | 'attendance.adjust_records'
  | 'attendance.view_adjustments'
  | 'attendance.delete'
  | 'payroll.view_all'
  | 'payroll.view_own'
  | 'payroll.process'
  | 'payroll.edit'
  | 'payroll.delete'
  | 'employees.view_all'
  | 'employees.manage'
  | 'employees.manage_assigned'
  | 'compensation.manage'
  | 'roles.manage'
  | 'settings.manage'

function listPermissions(user: User): string[] {
  return Array.isArray(user.permissions) ? user.permissions : []
}

export async function hasPermission(user: User, permission: Permission): Promise<boolean> {
  return listPermissions(user).includes(permission)
}

export function hasPermissionStatic(user: User, permission: Permission): boolean {
  return listPermissions(user).includes(permission)
}

export function canCreateTask(user: User): boolean {
  return hasPermissionStatic(user, 'tasks.create')
}

export function canAssignTask(user: User): boolean {
  return hasPermissionStatic(user, 'tasks.assign')
}

export function canEditTask(user: User): boolean {
  return hasPermissionStatic(user, 'tasks.edit')
}

export function canDeleteTask(user: User): boolean {
  return hasPermissionStatic(user, 'tasks.delete')
}

export function canCompleteTask(user: User, task: Task): boolean {
  return task.assignedTo === user.id && task.status !== 'done'
}

export function canViewAllTasks(user: User): boolean {
  return hasPermissionStatic(user, 'tasks.view_all')
}

/** Org-wide or team task list (API may return tasks for direct reports); workers without these see assignee-only. */
export function canSeeOrgOrTeamTaskBoard(user: User): boolean {
  return hasPermissionStatic(user, 'tasks.view_all') || hasPermissionStatic(user, 'tasks.assign')
}

export function getVisibleTasks(user: User, tasks: Task[]): Task[] {
  if (canViewAllTasks(user)) return tasks
  return tasks.filter((task) => task.assignedTo === user.id)
}

export function canCreateLead(user: User): boolean {
  return hasPermissionStatic(user, 'leads.create')
}

export function canEditLead(user: User): boolean {
  return hasPermissionStatic(user, 'leads.edit')
}

export function canDeleteLead(user: User): boolean {
  return hasPermissionStatic(user, 'leads.delete')
}

export function canViewAllLeads(user: User): boolean {
  return hasPermissionStatic(user, 'leads.view_all')
}

export function canViewAssignedLeads(user: User): boolean {
  return hasPermissionStatic(user, 'leads.view_assigned')
}

export function canClaimLead(user: User): boolean {
  return hasPermissionStatic(user, 'leads.claim')
}

export function canCallLead(user: User): boolean {
  return hasPermissionStatic(user, 'leads.call')
}

export function canConvertLead(user: User): boolean {
  return hasPermissionStatic(user, 'leads.convert')
}

export function getVisibleLeads(user: User, leads: Lead[]): Lead[] {
  if (canViewAllLeads(user)) return leads
  return leads.filter((lead) => lead.assignedTo === user.id)
}

export function getUnclaimedLeads(leads: Lead[]): Lead[] {
  return leads.filter((lead) => lead.assignedTo === null)
}

export function canViewAllStudents(user: User): boolean {
  return hasPermissionStatic(user, 'students.view_all')
}

export function canViewAssignedStudents(user: User): boolean {
  return hasPermissionStatic(user, 'students.view_assigned')
}

export function canCreateStudent(user: User): boolean {
  return hasPermissionStatic(user, 'students.create')
}

export function canEditStudent(user: User): boolean {
  return hasPermissionStatic(user, 'students.edit')
}

export function canEnrollStudent(user: User): boolean {
  return hasPermissionStatic(user, 'students.enroll')
}

export function canDeleteStudent(user: User): boolean {
  return hasPermissionStatic(user, 'students.delete')
}

export function getVisibleStudents(user: User, students: Student[]): Student[] {
  if (canViewAllStudents(user)) return students
  if (canViewAssignedStudents(user)) return students.filter((student) => student.convertedBy === user.id)
  return []
}

export function canViewInterns(user: User): boolean {
  return (
    hasPermissionStatic(user, 'interns.view_all') ||
    hasPermissionStatic(user, 'interns.view_assigned') ||
    hasPermissionStatic(user, 'interns.manage_all') ||
    hasPermissionStatic(user, 'interns.manage_assigned')
  )
}

export function canManageAllInterns(user: User): boolean {
  return hasPermissionStatic(user, 'interns.manage_all')
}

export function canManageAssignedInterns(user: User): boolean {
  return hasPermissionStatic(user, 'interns.manage_assigned')
}

export function canDeleteIntern(user: User): boolean {
  return hasPermissionStatic(user, 'interns.delete')
}

export function canViewBatches(user: User): boolean {
  return hasPermissionStatic(user, 'batches.view')
}

export function canCreateBatch(user: User): boolean {
  return hasPermissionStatic(user, 'batches.create')
}

export function canEditBatch(user: User): boolean {
  return hasPermissionStatic(user, 'batches.edit')
}

export function canManageBatch(user: User): boolean {
  return hasPermissionStatic(user, 'batches.manage')
}

export function canDeleteBatch(user: User): boolean {
  return hasPermissionStatic(user, 'batches.delete')
}

export function canViewAllPayments(user: User): boolean {
  return hasPermissionStatic(user, 'payments.view_all')
}

export function canViewAssignedPayments(user: User): boolean {
  return hasPermissionStatic(user, 'payments.view_assigned')
}

export function canCreatePayment(user: User): boolean {
  return hasPermissionStatic(user, 'payments.create')
}

export function canProcessPayment(user: User): boolean {
  return hasPermissionStatic(user, 'payments.process')
}

export function getVisiblePayments(user: User, payments: Payment[]): Payment[] {
  if (canViewAllPayments(user)) return payments
  return payments.filter((payment) => payment.collectedBy === user.id)
}

export function canViewAllCertificates(user: User): boolean {
  return hasPermissionStatic(user, 'certificates.view_all')
}

export function canIssueCertificate(user: User): boolean {
  return hasPermissionStatic(user, 'certificates.issue')
}

export function canViewReports(user: User): boolean {
  return hasPermissionStatic(user, 'reports.view')
}

export function canApplyLeave(user: User): boolean {
  return hasPermissionStatic(user, 'leaves.apply')
}

export function canApproveLeave(user: User): boolean {
  return hasPermissionStatic(user, 'leaves.approve')
}

export function canViewAllLeaves(user: User): boolean {
  return hasPermissionStatic(user, 'leaves.view_all')
}

export function canManageLeaveBalances(user: User): boolean {
  return hasPermissionStatic(user, 'leaves.manage_balances')
}

export function canEditAllLeaves(user: User): boolean {
  return hasPermissionStatic(user, 'leaves.edit_all')
}

export function canDeleteLeave(user: User): boolean {
  return hasPermissionStatic(user, 'leaves.delete')
}

export function canManageTeamLeaves(user: User, leave: Leave, teamMemberIds: string[]): boolean {
  if (!canApproveLeave(user)) return false
  if (canViewEmployees(user)) return true
  return teamMemberIds.includes(leave.employeeId)
}

export function canSubmitTimesheet(user: User): boolean {
  return hasPermissionStatic(user, 'timesheets.submit')
}

export function canApproveTimesheet(user: User): boolean {
  return hasPermissionStatic(user, 'timesheets.approve')
}

export function canViewAllTimesheets(user: User): boolean {
  return hasPermissionStatic(user, 'timesheets.view_all')
}

export function canEditAllTimesheets(user: User): boolean {
  return hasPermissionStatic(user, 'timesheets.edit_all')
}

export function canDeleteTimesheet(user: User): boolean {
  return hasPermissionStatic(user, 'timesheets.delete')
}

export function canEditAllTimeEntries(user: User): boolean {
  return hasPermissionStatic(user, 'timesheet_entries.edit_all')
}

export function canDeleteTimeEntry(user: User): boolean {
  return hasPermissionStatic(user, 'timesheet_entries.delete')
}

export function canManageTeamTimesheets(user: User, timesheet: Timesheet, teamMemberIds: string[]): boolean {
  if (!canApproveTimesheet(user)) return false
  if (canViewEmployees(user)) return true
  return teamMemberIds.includes(timesheet.employeeId)
}

export function canViewTeamAttendance(user: User): boolean {
  return hasPermissionStatic(user, 'attendance.view_team')
}

export function canManageOfficeLocation(user: User): boolean {
  return hasPermissionStatic(user, 'attendance.manage_office_location')
}

export function canManageOwnHomeLocation(user: User): boolean {
  return hasPermissionStatic(user, 'attendance.manage_home_location_self')
}

export function canManageAllHomeLocations(user: User): boolean {
  return hasPermissionStatic(user, 'attendance.manage_home_location_all')
}

export function canViewAttendanceWarnings(user: User): boolean {
  return hasPermissionStatic(user, 'attendance.view_warnings')
}

export function canAdjustAttendanceRecords(user: User): boolean {
  return hasPermissionStatic(user, 'attendance.adjust_records')
}

export function canViewAttendanceAdjustments(user: User): boolean {
  return hasPermissionStatic(user, 'attendance.view_adjustments')
}

export function canDeleteAttendance(user: User): boolean {
  return hasPermissionStatic(user, 'attendance.delete')
}

export function canViewAllPayroll(user: User): boolean {
  return hasPermissionStatic(user, 'payroll.view_all')
}

export function canViewOwnPayroll(user: User): boolean {
  return hasPermissionStatic(user, 'payroll.view_own')
}

export function canProcessPayroll(user: User): boolean {
  return hasPermissionStatic(user, 'payroll.process')
}

export function canEditPayroll(user: User): boolean {
  return hasPermissionStatic(user, 'payroll.edit')
}

export function canDeletePayroll(user: User): boolean {
  return hasPermissionStatic(user, 'payroll.delete')
}

export function canViewEmployees(user: User): boolean {
  return hasPermissionStatic(user, 'employees.view_all') || hasPermissionStatic(user, 'employees.manage_assigned')
}

export function canManageEmployees(user: User): boolean {
  return hasPermissionStatic(user, 'employees.manage')
}

export function canManageAssignedEmployees(user: User): boolean {
  return hasPermissionStatic(user, 'employees.manage_assigned')
}

export function canManageCompensation(user: User): boolean {
  return hasPermissionStatic(user, 'compensation.manage')
}

export function canManageSettings(user: User): boolean {
  return hasPermissionStatic(user, 'settings.manage')
}

export function canManageLeadTypes(user: User): boolean {
  return hasPermissionStatic(user, 'settings.manage')
}

export function canManageRoles(user: User): boolean {
  return hasPermissionStatic(user, 'roles.manage')
}

export function getTeamMemberIds(managerId: string, users: User[]): string[] {
  return users.filter((user) => user.managedBy === managerId).map((user) => user.id)
}

export function getManagedUsers(manager: User, users: User[]): User[] {
  if (canManageEmployees(manager)) {
    return users.filter((user) => user.id !== manager.id)
  }
  if (canAssignTask(manager)) {
    return users.filter((user) => user.managedBy === manager.id)
  }
  return []
}

export function isSalesRole(user: User): boolean {
  const permissions = listPermissions(user)
  return (
    permissions.includes('leads.view_assigned') ||
    permissions.includes('leads.claim') ||
    permissions.includes('leads.call') ||
    permissions.includes('leads.convert')
  )
}

export type { Permission }
