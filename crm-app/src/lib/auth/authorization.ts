import { AuthenticatedUser } from '@/lib/auth/middleware'
import { getUserPermissions } from '@/lib/db/queries/permissions'
import { canAssignTaskTo } from '@/lib/db/queries/users'
import { permissionCache } from '@/lib/permissions-cache'

export async function getAuthUserPermissions(user: AuthenticatedUser): Promise<string[]> {
  // SECURITY: CRIT-05 — Pass current role + updatedAt for staleness detection.
  // If user's role or record changed since cache was set, cache returns null → re-fetch.
  const cached = permissionCache.get(user.userId, user.role, user.updatedAt)
  if (cached) return cached

  const permissions = await getUserPermissions(user.userId)
  permissionCache.set(user.userId, permissions, user.role, user.updatedAt)
  return permissions
}

export async function hasPermission(user: AuthenticatedUser, permission: string): Promise<boolean> {
  const permissions = await getAuthUserPermissions(user)
  return permissions.includes(permission)
}

export async function hasAnyPermission(user: AuthenticatedUser, required: string[]): Promise<boolean> {
  const permissions = await getAuthUserPermissions(user)
  return required.some((permission) => permissions.includes(permission))
}

export function isAdmin(user: AuthenticatedUser): boolean {
  return user.role === 'admin'
}

/** Org-wide task list: requires view_all plus oversight (assign) or admin — avoids mistaken view_all-only grants. */
export async function canListTasksOrgWide(user: AuthenticatedUser): Promise<boolean> {
  if (!(await hasPermission(user, 'tasks.view_all'))) return false
  return isAdmin(user) || (await hasPermission(user, 'tasks.assign'))
}

/** Org-wide timesheet list on dashboard: view_all plus approval scope or admin. */
export async function canListTimesheetsOrgWide(user: AuthenticatedUser): Promise<boolean> {
  if (!(await hasPermission(user, 'timesheets.view_all'))) return false
  return isAdmin(user) || (await hasPermission(user, 'timesheets.approve'))
}

/** Org-wide lead list: view_all plus a CRM action permission or admin. */
export async function canListLeadsOrgWide(user: AuthenticatedUser): Promise<boolean> {
  if (!(await hasPermission(user, 'leads.view_all'))) return false
  if (isAdmin(user)) return true
  return await hasAnyPermission(user, ['leads.create', 'leads.edit', 'leads.claim'])
}

/** Lead types / lead metadata readable by CRM users or settings admins (lead type config UI). */
export async function canAccessLeadTypes(user: AuthenticatedUser): Promise<boolean> {
  if (await hasPermission(user, 'settings.manage')) return true
  return await hasAnyPermission(user, [
    'leads.view_all',
    'leads.view_assigned',
    'leads.create',
    'leads.edit',
    'leads.delete',
    'leads.claim',
    'leads.call',
    'leads.convert',
  ])
}

/** GET /api/leads — must have at least one lead-related permission. */
export async function canAccessLeadsList(user: AuthenticatedUser): Promise<boolean> {
  return await hasAnyPermission(user, [
    'leads.view_all',
    'leads.view_assigned',
    'leads.create',
    'leads.edit',
    'leads.delete',
    'leads.claim',
    'leads.call',
    'leads.convert',
  ])
}

export async function canManageAllWorkforce(user: AuthenticatedUser): Promise<boolean> {
  if (isAdmin(user)) return true
  return (await hasPermission(user, 'employees.manage')) || (await hasPermission(user, 'interns.manage_all'))
}

export async function canManageAssignedWorkforce(user: AuthenticatedUser): Promise<boolean> {
  return (
    (await hasPermission(user, 'employees.manage_assigned')) ||
    (await hasPermission(user, 'interns.manage_assigned'))
  )
}

/** Check if user can assign a task to target user (hierarchy + department validation). */
export async function canAssignTaskToTarget(
  user: AuthenticatedUser,
  targetUserId: string
): Promise<boolean> {
  if (!(await hasPermission(user, 'tasks.assign'))) return false
  
  return canAssignTaskTo(user.userId, targetUserId)
}

/** Check if user can reassign a task to a new target user. */
export async function canReassignTaskToTarget(
  user: AuthenticatedUser,
  currentAssigneeId: string | null,
  newAssigneeId: string
): Promise<boolean> {
  if (!(await hasPermission(user, 'tasks.assign'))) return false
  
  if (currentAssigneeId === newAssigneeId) return true
  
  return canAssignTaskTo(user.userId, newAssigneeId)
}

/** Check if user is admin or HR (can assign to anyone in department). */
export function isAdminOrHR(user: AuthenticatedUser): boolean {
  return user.role === 'admin' || user.role === 'hr'
}
