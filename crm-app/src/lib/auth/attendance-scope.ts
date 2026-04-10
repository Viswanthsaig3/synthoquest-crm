import type { AuthenticatedUser } from '@/lib/auth/middleware'
import { hasPermission } from '@/lib/auth/authorization'
import { getManagerScopedUserIds, listActiveUserIds } from '@/lib/db/queries/users'

/**
 * Team-today / org attendance: allowed user IDs for the requester.
 * - employees.view_all + attendance.view_team → all active users (optional department)
 * - timesheets.approve OR (attendance.view_team && !view_all) → self + direct reports
 * - else → forbidden
 */
export async function resolveTeamTodayUserIds(
  user: AuthenticatedUser,
  department?: string | null
): Promise<{ ok: true; userIds: string[] } | { ok: false; status: number; message: string }> {
  const viewAll = await hasPermission(user, 'employees.view_all')
  const viewTeam = await hasPermission(user, 'attendance.view_team')
  const canApprove = await hasPermission(user, 'timesheets.approve')

  if (viewTeam && viewAll) {
    const userIds = await listActiveUserIds({
      department: department || undefined,
    })
    return { ok: true, userIds }
  }

  if (canApprove || (viewTeam && !viewAll)) {
    const userIds = await getManagerScopedUserIds(user.userId)
    return { ok: true, userIds }
  }

  return { ok: false, status: 403, message: 'Forbidden' }
}

export async function canAccessTeamAttendance(user: AuthenticatedUser): Promise<boolean> {
  const viewAll = await hasPermission(user, 'employees.view_all')
  const viewTeam = await hasPermission(user, 'attendance.view_team')
  const canApprove = await hasPermission(user, 'timesheets.approve')
  if (viewTeam && viewAll) return true
  if (canApprove || (viewTeam && !viewAll)) return true
  return false
}
