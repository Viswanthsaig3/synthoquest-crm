import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/middleware'
import { hasPermission } from '@/lib/auth/authorization'
import { getUsers } from '@/lib/db/queries/users'
import { classifyWorker, isWorkerPayrollEligible } from '@/lib/payroll/worker-type'
import { createAdminClient } from '@/lib/db/server-client'

export async function GET(request: NextRequest) {
  return withAuth(request, async (user) => {
    try {
      if (!(await hasPermission(user, 'payroll.process'))) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      const { data: allUsers } = await getUsers({ limit: 1000, status: 'active' })
      const supabase = await createAdminClient()

      const employees = []

      for (const u of allUsers) {
        const classification = classifyWorker(u)
        const eligible = isWorkerPayrollEligible(u)

        if (!eligible) continue

        // Resolve salary: use compensation_amount, or intern stipend for interns
        let compensationAmount = u.compensationAmount ?? null
        if (classification.isIntern) {
          const { data: internProfile } = await supabase
            .from('intern_profiles')
            .select('stipend')
            .eq('user_id', u.id)
            .single()
          compensationAmount = internProfile?.stipend ?? u.compensationAmount ?? null
        }

        employees.push({
          id: u.id,
          name: u.name,
          email: u.email,
          department: u.department,
          role: u.role,
          avatar: u.avatar,
          workerType: classification.workerType,
          label: classification.label,
          compensationAmount,
          // Salary is configured if compensation_amount is set and > 0
          hasSalaryStructure: compensationAmount !== null && compensationAmount > 0,
        })
      }

      return NextResponse.json({ data: employees })
    } catch (error) {
      console.error('GET /api/payroll/employees error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  })
}
