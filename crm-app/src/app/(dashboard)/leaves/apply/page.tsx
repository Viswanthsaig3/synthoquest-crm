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
import { getLeaveBalance } from '@/lib/mock-data'
import { LEAVE_TYPES } from '@/lib/constants'
import { ArrowLeft, Save, Loader2, Calendar } from 'lucide-react'
import Link from 'next/link'

export default function ApplyLeavePage() {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    type: 'casual',
    startDate: '',
    endDate: '',
    reason: '',
  })

  useEffect(() => {
    if (user && (user.role === 'admin' || user.role === 'hr' || user.role === 'team_lead')) {
      router.replace('/leaves/approvals')
    }
  }, [user, router])

  if (!user) return null

  if (user.role === 'admin' || user.role === 'hr' || user.role === 'team_lead') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  const leaveBalance = getLeaveBalance(user.id)

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
    setLoading(true)

    await new Promise(resolve => setTimeout(resolve, 1000))

    toast({
      title: 'Leave request submitted',
      description: 'Your leave request has been submitted for approval.',
    })

    router.push('/leaves')
  }

  const getAvailableBalance = () => {
    switch (formData.type) {
      case 'sick': return leaveBalance.sick
      case 'casual': return leaveBalance.casual
      case 'paid': return leaveBalance.paid
      default: return 0
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <Breadcrumb />
      
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

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Sick Leave</p>
            <p className="text-2xl font-bold">{leaveBalance.sick} days</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Casual Leave</p>
            <p className="text-2xl font-bold">{leaveBalance.casual} days</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Paid Leave</p>
            <p className="text-2xl font-bold">{leaveBalance.paid} days</p>
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
                <div className="flex items-center gap-2 h-10 px-3 rounded-md border bg-muted">
                  <Badge>{getAvailableBalance()} days</Badge>
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
                  required
                />
              </div>
            </div>

            {days > 0 && (
              <div className="p-3 rounded-lg bg-muted flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>Total: <strong>{days} day{days > 1 ? 's' : ''}</strong></span>
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
            <Button type="submit" disabled={loading || days > getAvailableBalance()}>
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