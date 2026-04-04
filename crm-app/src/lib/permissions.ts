import { User, Role } from '@/types/user'
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
  | 'interns.view_all'
  | 'interns.view_assigned'
  | 'batches.view'
  | 'batches.create'
  | 'batches.edit'
  | 'batches.manage'
  | 'payments.view_all'
  | 'payments.view_assigned'
  | 'payments.create'
  | 'payments.process'
  | 'certificates.view_all'
  | 'certificates.issue'
  | 'reports.view'
  | 'leaves.apply'
  | 'leaves.approve'
  | 'timesheets.submit'
  | 'timesheets.approve'
  | 'attendance.view_team'
  | 'payroll.view_all'
  | 'payroll.view_own'
  | 'payroll.process'
  | 'employees.view_all'
  | 'employees.manage'

const rolePermissions: Record<Role, Permission[]> = {
  admin: [
    'tasks.view_all',
    'tasks.create',
    'tasks.assign',
    'tasks.edit',
    'tasks.delete',
    'leads.view_all',
    'leads.create',
    'leads.edit',
    'leads.delete',
    'leads.claim',
    'leads.call',
    'leads.convert',
    'students.view_all',
    'students.create',
    'students.edit',
    'students.enroll',
    'interns.view_all',
    'batches.view',
    'batches.create',
    'batches.edit',
    'batches.manage',
    'payments.view_all',
    'payments.create',
    'payments.process',
    'certificates.view_all',
    'certificates.issue',
    'reports.view',
    'leaves.approve',
    'timesheets.approve',
    'attendance.view_team',
    'payroll.view_all',
    'payroll.process',
    'employees.view_all',
    'employees.manage',
  ],
  hr: [
    'tasks.view_all',
    'tasks.create',
    'tasks.assign',
    'tasks.edit',
    'leads.view_all',
    'leads.claim',
    'students.view_all',
    'students.create',
    'students.edit',
    'students.enroll',
    'interns.view_all',
    'batches.view',
    'batches.create',
    'batches.edit',
    'payments.view_all',
    'payments.create',
    'payments.process',
    'certificates.view_all',
    'certificates.issue',
    'reports.view',
    'leaves.approve',
    'timesheets.approve',
    'attendance.view_team',
    'payroll.view_all',
    'payroll.process',
    'employees.view_all',
    'employees.manage',
  ],
  team_lead: [
    'tasks.view_all',
    'tasks.create',
    'tasks.assign',
    'tasks.edit',
    'leads.view_all',
    'leads.create',
    'leads.edit',
    'leads.claim',
    'leads.call',
    'leads.convert',
    'students.view_assigned',
    'interns.view_all',
    'payments.view_assigned',
    'reports.view',
    'leaves.approve',
    'timesheets.approve',
    'attendance.view_team',
  ],
  sales_rep: [
    'leads.view_assigned',
    'leads.create',
    'leads.edit',
    'leads.claim',
    'leads.call',
    'leads.convert',
    'students.view_assigned',
    'payments.view_assigned',
    'tasks.complete',
    'leaves.apply',
    'timesheets.submit',
  ],
  employee: [
    'tasks.complete',
    'leaves.apply',
    'timesheets.submit',
    'payroll.view_own',
  ],
}

export function hasPermission(user: User, permission: Permission): boolean {
  return rolePermissions[user.role]?.includes(permission) ?? false
}

export function canCreateTask(user: User): boolean {
  return hasPermission(user, 'tasks.create')
}

export function canAssignTask(user: User): boolean {
  return hasPermission(user, 'tasks.assign')
}

export function canEditTask(user: User): boolean {
  return hasPermission(user, 'tasks.edit')
}

export function canDeleteTask(user: User): boolean {
  return hasPermission(user, 'tasks.delete')
}

export function canCompleteTask(user: User, task: Task): boolean {
  return task.assignedTo === user.id && task.status !== 'done'
}

export function canViewAllTasks(user: User): boolean {
  return hasPermission(user, 'tasks.view_all')
}

export function getVisibleTasks(user: User, tasks: Task[]): Task[] {
  if (canViewAllTasks(user)) {
    return tasks
  }
  return tasks.filter(t => t.assignedTo === user.id)
}

export function canCreateLead(user: User): boolean {
  return hasPermission(user, 'leads.create')
}

export function canEditLead(user: User): boolean {
  return hasPermission(user, 'leads.edit')
}

export function canDeleteLead(user: User): boolean {
  return hasPermission(user, 'leads.delete')
}

export function canViewAllLeads(user: User): boolean {
  return hasPermission(user, 'leads.view_all')
}

export function canViewAssignedLeads(user: User): boolean {
  return hasPermission(user, 'leads.view_assigned')
}

export function canClaimLead(user: User): boolean {
  return hasPermission(user, 'leads.claim')
}

export function canCallLead(user: User): boolean {
  return hasPermission(user, 'leads.call')
}

export function canConvertLead(user: User): boolean {
  return hasPermission(user, 'leads.convert')
}

export function getVisibleLeads(user: User, leads: Lead[]): Lead[] {
  if (canViewAllLeads(user)) {
    return leads
  }
  return leads.filter(l => l.assignedTo === user.id)
}

export function getUnclaimedLeads(leads: Lead[]): Lead[] {
  return leads.filter(l => l.assignedTo === null)
}

export function canViewAllStudents(user: User): boolean {
  return hasPermission(user, 'students.view_all')
}

export function canViewAssignedStudents(user: User): boolean {
  return hasPermission(user, 'students.view_assigned')
}

export function canCreateStudent(user: User): boolean {
  return hasPermission(user, 'students.create')
}

export function canEditStudent(user: User): boolean {
  return hasPermission(user, 'students.edit')
}

export function canEnrollStudent(user: User): boolean {
  return hasPermission(user, 'students.enroll')
}

export function getVisibleStudents(user: User, students: Student[]): Student[] {
  if (canViewAllStudents(user)) {
    return students
  }
  return students.filter(s => {
    if (user.role === 'sales_rep' || user.role === 'team_lead') {
      return s.convertedBy === user.id
    }
    return false
  })
}

export function canViewInterns(user: User): boolean {
  return hasPermission(user, 'interns.view_all') || hasPermission(user, 'interns.view_assigned')
}

export function canViewAllInterns(user: User): boolean {
  return hasPermission(user, 'interns.view_all')
}

export function canViewBatches(user: User): boolean {
  return hasPermission(user, 'batches.view')
}

export function canCreateBatch(user: User): boolean {
  return hasPermission(user, 'batches.create')
}

export function canEditBatch(user: User): boolean {
  return hasPermission(user, 'batches.edit')
}

export function canManageBatch(user: User): boolean {
  return hasPermission(user, 'batches.manage')
}

export function canViewAllPayments(user: User): boolean {
  return hasPermission(user, 'payments.view_all')
}

export function canViewAssignedPayments(user: User): boolean {
  return hasPermission(user, 'payments.view_assigned')
}

export function canCreatePayment(user: User): boolean {
  return hasPermission(user, 'payments.create')
}

export function canProcessPayment(user: User): boolean {
  return hasPermission(user, 'payments.process')
}

export function getVisiblePayments(user: User, payments: Payment[]): Payment[] {
  if (canViewAllPayments(user)) {
    return payments
  }
  return payments.filter(p => p.collectedBy === user.id)
}

export function canViewAllCertificates(user: User): boolean {
  return hasPermission(user, 'certificates.view_all')
}

export function canIssueCertificate(user: User): boolean {
  return hasPermission(user, 'certificates.issue')
}

export function canViewReports(user: User): boolean {
  return hasPermission(user, 'reports.view')
}

export function canApplyLeave(user: User): boolean {
  return hasPermission(user, 'leaves.apply')
}

export function canApproveLeave(user: User): boolean {
  return hasPermission(user, 'leaves.approve')
}

export function canManageTeamLeaves(user: User, leave: Leave, teamMemberIds: string[]): boolean {
  if (!canApproveLeave(user)) return false
  if (user.role === 'admin' || user.role === 'hr') return true
  return teamMemberIds.includes(leave.employeeId)
}

export function canSubmitTimesheet(user: User): boolean {
  return hasPermission(user, 'timesheets.submit')
}

export function canApproveTimesheet(user: User): boolean {
  return hasPermission(user, 'timesheets.approve')
}

export function canManageTeamTimesheets(user: User, timesheet: Timesheet, teamMemberIds: string[]): boolean {
  if (!canApproveTimesheet(user)) return false
  if (user.role === 'admin' || user.role === 'hr') return true
  return teamMemberIds.includes(timesheet.employeeId)
}

export function canViewTeamAttendance(user: User): boolean {
  return hasPermission(user, 'attendance.view_team')
}

export function canViewAllPayroll(user: User): boolean {
  return hasPermission(user, 'payroll.view_all')
}

export function canViewOwnPayroll(user: User): boolean {
  return hasPermission(user, 'payroll.view_own')
}

export function canProcessPayroll(user: User): boolean {
  return hasPermission(user, 'payroll.process')
}

export function canViewEmployees(user: User): boolean {
  return hasPermission(user, 'employees.view_all')
}

export function canManageEmployees(user: User): boolean {
  return hasPermission(user, 'employees.manage')
}

export function canManageSettings(user: User): boolean {
  return user.role === 'admin' || user.role === 'hr'
}

export function canManageLeadTypes(user: User): boolean {
  return user.role === 'admin'
}

export function getTeamMemberIds(managerId: string, users: User[]): string[] {
  return users
    .filter(u => u.managedBy === managerId)
    .map(u => u.id)
}

export function getManagedUsers(manager: User, users: User[]): User[] {
  if (manager.role === 'admin' || manager.role === 'hr') {
    return users.filter(u => u.role === 'employee' || u.role === 'sales_rep')
  }
  if (manager.role === 'team_lead') {
    return users.filter(u => u.managedBy === manager.id)
  }
  return []
}

export function isSalesRole(user: User): boolean {
  return user.role === 'sales_rep' || user.role === 'team_lead' || user.role === 'admin'
}