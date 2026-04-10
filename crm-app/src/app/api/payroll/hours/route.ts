import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/middleware'
import { hasPermission } from '@/lib/auth/authorization'
import { getUsers } from '@/lib/db/queries/users'
import { getPayrollSettings, getAttendanceSummaryForMonth } from '@/lib/db/queries/payroll'
import { getAttendanceRecords } from '@/lib/db/queries/attendance'
import { classifyWorker } from '@/lib/payroll/worker-type'
import { calculatePayroll } from '@/lib/payroll/calculator'
import { createAdminClient } from '@/lib/db/server-client'

export async function GET(request: NextRequest) {
  return withAuth(request, async (user) => {
    try {
      const canViewAll = await hasPermission(user, 'payroll.view_all')
      if (!canViewAll) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      const { searchParams } = new URL(request.url)
      const month = parseInt(searchParams.get('month') || '') || (new Date().getMonth() + 1)
      const year = parseInt(searchParams.get('year') || '') || new Date().getFullYear()
      const departmentFilter = searchParams.get('department') || undefined
      const workerTypeFilter = searchParams.get('workerType') || undefined

      const settings = await getPayrollSettings()
      if (!settings) {
        return NextResponse.json({ error: 'Payroll settings not configured' }, { status: 400 })
      }

      // Get ALL active users (not just payroll-eligible)
      const { data: allUsers } = await getUsers({ limit: 1000, status: 'active' })
      const supabase = await createAdminClient()

      let filteredUsers = allUsers
      if (departmentFilter) {
        filteredUsers = filteredUsers.filter(u => u.department === departmentFilter)
      }
      if (workerTypeFilter) {
        filteredUsers = filteredUsers.filter(u => classifyWorker(u).workerType === workerTypeFilter)
      }

      const startDate = `${year}-${String(month).padStart(2, '0')}-01`
      const endDate = `${year}-${String(month).padStart(2, '0')}-${new Date(year, month, 0).getDate()}`

      const employees = []

      for (const emp of filteredUsers) {
        const classification = classifyWorker(emp)
        const attendance = await getAttendanceSummaryForMonth(emp.id, month, year)
        
        // Get daily breakdown
        const records = await getAttendanceRecords({
          userId: emp.id,
          fromDate: startDate,
          toDate: endDate,
        })

        // Group records by date
        const dailyMap = new Map<string, {
          date: string
          sessions: Array<{
            checkIn: string | null
            checkOut: string | null
            hours: number
          }>
          totalHours: number
          status: string
        }>()

        for (const rec of records) {
          const date = rec.date
          if (!dailyMap.has(date)) {
            dailyMap.set(date, {
              date,
              sessions: [],
              totalHours: 0,
              status: rec.status,
            })
          }
          const day = dailyMap.get(date)!
          day.sessions.push({
            checkIn: rec.checkInTime,
            checkOut: rec.checkOutTime,
            hours: rec.totalHours || 0,
          })
          day.totalHours += rec.totalHours || 0
          // Use the "worst" status for the day
          if (rec.status === 'absent') day.status = 'absent'
          else if (rec.status === 'late' && day.status !== 'absent') day.status = 'late'
          else if (rec.status === 'half_day' && day.status === 'present') day.status = 'half_day'
        }

        const dailyBreakdown = Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date))
        const daysPresent = dailyMap.size

        const avgDailyHours = daysPresent > 0
          ? Math.round((attendance.totalHoursWorked / daysPresent) * 100) / 100
          : 0

        const completionPercentage = settings.expectedHoursPerMonth > 0
          ? Math.round((attendance.totalHoursWorked / settings.expectedHoursPerMonth) * 10000) / 100
          : 0

        // Get salary/stipend for paid workers using compensation_amount directly
        let monthlySalary = 0
        let calculatedSalary = 0

        if (classification.isPaid) {
          // For interns, prefer intern_profiles.stipend; else use compensation_amount
          let salary = emp.compensationAmount ?? 0
          if (classification.isIntern) {
            const { data: internProfile } = await supabase
              .from('intern_profiles')
              .select('stipend')
              .eq('user_id', emp.id)
              .single()
            salary = internProfile?.stipend ?? emp.compensationAmount ?? 0
          }

          const calcResult = calculatePayroll({
            workerType: classification.workerType,
            monthlySalary: salary,
            settings,
            attendance,
          })

          monthlySalary = calcResult.monthlySalary
          calculatedSalary = calcResult.calculatedSalary
        }

        employees.push({
          id: emp.id,
          name: emp.name,
          email: emp.email,
          avatar: emp.avatar,
          department: emp.department,
          role: emp.role,
          workerType: classification.workerType,
          workerLabel: classification.label,
          isPaid: classification.isPaid,
          expectedHours: settings.expectedHoursPerMonth,
          totalHoursWorked: attendance.totalHoursWorked,
          completionPercentage,
          avgDailyHours,
          daysPresent,
          totalDays: attendance.totalDays,
          absentDays: attendance.absentDays,
          paidLeaves: attendance.paidLeaves,
          unpaidLeaves: attendance.unpaidLeaves,
          halfDays: attendance.halfDays,
          overtimeHours: attendance.overtimeHours,
          monthlySalary,
          calculatedSalary,
          dailyBreakdown,
        })
      }

      // Sort: paid first, then by name
      employees.sort((a, b) => {
        if (a.isPaid !== b.isPaid) return a.isPaid ? -1 : 1
        return a.name.localeCompare(b.name)
      })

      const totals = {
        totalExpectedHours: employees.length * settings.expectedHoursPerMonth,
        totalHoursWorked: Math.round(employees.reduce((sum, e) => sum + e.totalHoursWorked, 0) * 100) / 100,
        avgHoursPerEmployee: employees.length > 0
          ? Math.round((employees.reduce((sum, e) => sum + e.totalHoursWorked, 0) / employees.length) * 100) / 100
          : 0,
        totalDeficit: 0,
        employeeCount: employees.length,
      }
      totals.totalDeficit = Math.round((totals.totalExpectedHours - totals.totalHoursWorked) * 100) / 100

      return NextResponse.json({
        settings: {
          expectedHoursPerMonth: settings.expectedHoursPerMonth,
          standardWorkingHours: settings.standardWorkingHours,
        },
        employees,
        totals,
      })
    } catch (error) {
      console.error('GET /api/payroll/hours error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  })
}
