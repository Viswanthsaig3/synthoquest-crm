import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/middleware'
import {
  canListTasksOrgWide,
  canListTimesheetsOrgWide,
  hasPermission,
} from '@/lib/auth/authorization'
import { createAdminClient } from '@/lib/db/server-client'
import { getUsers } from '@/lib/db/queries/users'
import { getTasks } from '@/lib/db/queries/tasks'
import { getTimesheets } from '@/lib/db/queries/timesheets'
import type { User } from '@/types/user'

const LIMIT = 100

export async function GET(request: NextRequest) {
  return withAuth(request, async (user) => {
    try {
      let employees: User[] = []

      const canEmployees =
        (await hasPermission(user, 'employees.view_all')) ||
        (await hasPermission(user, 'employees.manage_assigned'))
      if (canEmployees) {
        const managedBy =
          (await hasPermission(user, 'employees.view_all'))
            ? undefined
            : user.userId
        const empRes = await getUsers({
          page: 1,
          limit: LIMIT,
          managedBy,
        })
        employees = empRes.data
      }

      let taskFilters: Parameters<typeof getTasks>[0] = {
        page: 1,
        limit: LIMIT,
      }
      if (await canListTasksOrgWide(user)) {
        taskFilters.assignedTo = undefined
      } else if (await hasPermission(user, 'tasks.assign')) {
        const supabase = await createAdminClient()
        const { data: teamMembers } = await supabase
          .from('users')
          .select('id')
          .eq('managed_by', user.userId)
          .is('deleted_at', null)
        const allowedIds = [user.userId, ...(teamMembers || []).map((m: { id: string }) => m.id)]
        taskFilters.assignedToIds = allowedIds
      } else {
        taskFilters.assignedTo = user.userId
      }

      const taskResult = await getTasks(taskFilters)

      let tsFilters: Parameters<typeof getTimesheets>[0] = {
        page: 1,
        limit: LIMIT,
      }
      if (await canListTimesheetsOrgWide(user)) {
        // org-wide
      } else if (await hasPermission(user, 'timesheets.approve')) {
        const supabase = await createAdminClient()
        const { data: teamMembers } = await supabase
          .from('users')
          .select('id')
          .eq('managed_by', user.userId)
          .is('deleted_at', null)
        const allowedIds = [user.userId, ...(teamMembers || []).map((m: { id: string }) => m.id)]
        tsFilters.employeeIds = allowedIds
      } else {
        tsFilters.employeeId = user.userId
      }

      const timesheetResult = await getTimesheets(tsFilters)

      return NextResponse.json({
        data: {
          employees,
          tasks: taskResult.data,
          timesheets: timesheetResult.data,
        },
      })
    } catch (error) {
      console.error('GET /api/dashboard/summary error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  })
}
