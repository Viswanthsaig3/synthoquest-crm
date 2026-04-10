import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/middleware'
import { hasPermission, isAdmin } from '@/lib/auth/authorization'
import { createAdminClient } from '@/lib/db/server-client'

export async function GET(request: NextRequest) {
  return withAuth(request, async (user) => {
    try {
      if (!(await hasPermission(user, 'leaves.manage_balances')) && !isAdmin(user)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      const { searchParams } = new URL(request.url)
      const year = parseInt(searchParams.get('year') || '') || new Date().getFullYear()
      const month = parseInt(searchParams.get('month') || '') || null

      const supabase = await createAdminClient()

      const { data: employees, error: empError } = await supabase
        .from('users')
        .select('id, name, email, role, department, avatar')
        .is('deleted_at', null)
        .order('name')

      if (empError) {
        throw empError
      }

      let balancesQuery = supabase
        .from('leave_balances')
        .select('*')
        .eq('year', year)
        .is('deleted_at', null)

      if (month) {
        balancesQuery = balancesQuery.eq('month', month)
      }

      const { data: balances, error: balError } = await balancesQuery

      if (balError) {
        throw balError
      }

      interface BalanceRecord {
        user_id: string
        sick_total: number
        sick_used: number
        sick_remaining: number
        casual_total: number
        casual_used: number
        casual_remaining: number
        paid_total: number
        paid_used: number
        paid_remaining: number
        month: number
      }

      const balanceMap = new Map<string, BalanceRecord[]>()
      for (const b of balances || []) {
        if (!balanceMap.has(b.user_id)) {
          balanceMap.set(b.user_id, [])
        }
        balanceMap.get(b.user_id)!.push(b)
      }

      const result = (employees || []).map(emp => {
        const empBalances = balanceMap.get(emp.id) || []
        
        if (month) {
          const bal = empBalances.find(b => b.month === month)
          return {
            id: emp.id,
            name: emp.name,
            email: emp.email,
            role: emp.role,
            department: emp.department,
            avatar: emp.avatar,
            balance: bal ? {
              month: bal.month,
              sick_total: bal.sick_total,
              sick_used: bal.sick_used,
              sick_remaining: bal.sick_remaining,
              casual_total: bal.casual_total,
              casual_used: bal.casual_used,
              casual_remaining: bal.casual_remaining,
              paid_total: bal.paid_total,
              paid_used: bal.paid_used,
              paid_remaining: bal.paid_remaining,
            } : null
          }
        }

        return {
          id: emp.id,
          name: emp.name,
          email: emp.email,
          role: emp.role,
          department: emp.department,
          avatar: emp.avatar,
          balances: empBalances.length > 0 ? empBalances.map(b => ({
            month: b.month,
            sick_total: b.sick_total,
            sick_used: b.sick_used,
            sick_remaining: b.sick_remaining,
            casual_total: b.casual_total,
            casual_used: b.casual_used,
            casual_remaining: b.casual_remaining,
            paid_total: b.paid_total,
            paid_used: b.paid_used,
            paid_remaining: b.paid_remaining,
          })) : null
        }
      })

      return NextResponse.json({ data: result, year, month })
    } catch (error) {
      console.error('Get leave balances error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  })
}