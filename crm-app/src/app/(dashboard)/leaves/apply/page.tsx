'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/auth-context'
import { Breadcrumb } from '@/components/layout/breadcrumb'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/toast'

import { LEAVE_TYPES } from '@/lib/constants'
import { hasPermission } from '@/lib/client-permissions'
import { ArrowLeft, Save, Loader2, Calendar, AlertCircle, Info } from 'lucide-react'
import Link from 'next/link'
import { LeavesSubNav } from '@/components/leaves/leaves-subnav'
import type { LeaveBalance } from '@/types/leave'

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

export default function ApplyLeavePage() {
  const { user, token } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)
  const [leaveBalance, setLeaveBalance] = useState<LeaveBalance>({ sick: 0, casual: 0, paid: 0 })
  const [selectedMonth, setSelectedMonth] = useState<{ month: number; year: number } | null>(null)
  const [formData, setFormData] = useState({
    type: 'casual',
    startDate: '',
    endDate: '',
    reason: '',
  })

  useEffect(() => {
    if (user && hasPermission(user, 'leaves.approve')) {
      router.replace('/leaves/approvals')
    }
  }, [user, router])

  useEffect(() => {
    if (!user || !token) return
    fetchBalance()
  }, [user, token])

  useEffect(() => {
    if (formData.startDate && token) {
      const startDate = new Date(formData.startDate)
      const month = startDate.getMonth() + 1
      const year = startDate.getFullYear()
      
      if (!selectedMonth || selectedMonth.month !== month || selectedMonth.year !== year) {
        setSelectedMonth({ month, year })
        fetchBalanceForMonth(month, year)
      }
    }
  }, [formData.startDate, token])

  async function fetchBalance() {
    try {
      const res = await fetch('/api/leaves/balance', {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      if (res.ok) {
        const data = await res.json()
        setLeaveBalance(data.data || { sick: 0, casual: 0, paid: 0 })
      }
    } catch (error) {
      console.error('Error fetching balance:', error)
    } finally {
      setPageLoading(false)
    }
  }

  async function fetchBalanceForMonth(month: number, year: number) {
    try {
      const res = await fetch(`/api/leaves/balance?month=${month}&year=${year}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      if (res.ok) {
        const data = await res.json()
        setLeaveBalance(data.data || { sick: 0, casual: 0, paid: 0 })
      }
    } catch (error) {
      console.error('Error fetching balance for month:', error)
    }
  }

  if (!user) return null

  if (pageLoading || hasPermission(user, 'leaves.approve')) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  const calculateDays = () => {
    if (!formData.startDate || !formData.endDate) return 0
    const start = new Date(formData.startDate)
    const end = new Date(formData.endDate)
    const diffTime = Math.abs(end.getTime() - start.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
    return diffDays
  }

  const days = calculateDays()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.startDate) {
      toast({
        title: 'Error',
        description: 'Please select a start date',
        variant: 'destructive',
      })
      return
    }
    
    setLoading(true)

    try {
      const res = await fetch('/api/leaves', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })

      const data = await res.json()

      if (!res.ok) {
        const errorMsg = data.details 
          ? data.details.map((d: { message: string; path: string[] }) => `${d.path.join('.')}: ${d.message}`).join(', ')
          : data.error || 'Failed to submit leave request'
        throw new Error(errorMsg)
      }

      toast({
        title: 'Leave request submitted',
        description: 'Your leave request has been submitted for approval.',
      })

      router.push('/leaves')
    } catch (error) {
      console.error('Submit leave error:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to submit leave request',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const getAvailableBalance = () => {
    switch (formData.type) {
      case 'sick': return leaveBalance.sick
      case 'casual': return leaveBalance.casual
      case 'paid': return leaveBalance.paid
      default: return 0
    }
  }

  const getMonthLabel = () => {
    if (!selectedMonth) return 'current month'
    return `${MONTHS[selectedMonth.month - 1]} ${selectedMonth.year}`
  }

  const isBalanceZero = getAvailableBalance() === 0 && formData.startDate

  return (
    <div className="space-y-6 max-w-2xl">
      <Breadcrumb />
      <LeavesSubNav />

      <div className="flex items-center gap-4">
        <Link href="/leaves">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Apply for Leave</h1>
          <p className="text-muted-foreground">Submit your leave request</p>
        </div>
      </div>

      <div className="p-4 rounded-lg bg-blue-50 border border-blue-200 flex items-start gap-3">
        <Info className="h-5 w-5 text-blue-600 mt-0.5" />
        <div className="text-sm text-blue-800">
          <p className="font-medium">Monthly Leave Allocation</p>
          <p>Leave balances are allocated monthly and do not carry over. Select your leave dates to see the balance for that month.</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card className={isBalanceZero && formData.type === 'sick' ? 'border-red-200 bg-red-50' : ''}>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Sick Leave</p>
            <p className="text-2xl font-bold">{leaveBalance.sick} days</p>
            {formData.startDate && (
              <p className="text-xs text-muted-foreground mt-1">for {getMonthLabel()}</p>
            )}
          </CardContent>
        </Card>
        <Card className={isBalanceZero && formData.type === 'casual' ? 'border-red-200 bg-red-50' : ''}>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Casual Leave</p>
            <p className="text-2xl font-bold">{leaveBalance.casual} days</p>
            {formData.startDate && (
              <p className="text-xs text-muted-foreground mt-1">for {getMonthLabel()}</p>
            )}
          </CardContent>
        </Card>
        <Card className={isBalanceZero && formData.type === 'paid' ? 'border-red-200 bg-red-50' : ''}>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Paid Leave</p>
            <p className="text-2xl font-bold">{leaveBalance.paid} days</p>
            {formData.startDate && (
              <p className="text-xs text-muted-foreground mt-1">for {getMonthLabel()}</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Leave Details</CardTitle>
            <CardDescription>Fill in your leave request details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Leave Type *</Label>
                <Select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                >
                  {LEAVE_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Available Balance</Label>
                <div className={`flex items-center gap-2 h-10 px-3 rounded-md border ${isBalanceZero ? 'bg-red-100 border-red-300' : 'bg-muted'}`}>
                  <Badge variant={isBalanceZero ? 'destructive' : 'default'}>{getAvailableBalance()} days</Badge>
                  {formData.startDate && (
                    <span className="text-xs text-muted-foreground">{getMonthLabel()}</span>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date *</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  min={formData.startDate || new Date().toISOString().split('T')[0]}
                  required
                />
              </div>
            </div>

            {days > 0 && (
              <div className={`p-3 rounded-lg flex items-center gap-2 ${days > getAvailableBalance() ? 'bg-red-100 text-red-800' : 'bg-muted'}`}>
                <Calendar className="h-4 w-4" />
                <span>Total: <strong>{days} day{days > 1 ? 's' : ''}</strong></span>
                {days > getAvailableBalance() && (
                  <span className="text-red-600 text-sm">(exceeds available balance)</span>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="reason">Reason *</Label>
              <Textarea
                id="reason"
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                placeholder="Explain the reason for your leave"
                rows={3}
                required
              />
            </div>
          </CardContent>

          <div className="flex justify-end gap-4 p-6 pt-0">
            <Link href="/leaves">
              <Button variant="outline" type="button">Cancel</Button>
            </Link>
            <Button 
              type="submit" 
              disabled={loading || days > getAvailableBalance() || getAvailableBalance() === 0}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Submit Request
                </>
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}