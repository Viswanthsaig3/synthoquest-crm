'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/context/auth-context'
import { Breadcrumb } from '@/components/layout/breadcrumb'
import { PageHeader, EmptyState, PermissionGuard } from '@/components/shared'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'

import { getInitials } from '@/lib/utils'
import { hasPermission } from '@/lib/client-permissions'
import { Users, Edit, Loader2, Search, ChevronLeft, ChevronRight } from 'lucide-react'
import { LeavesSubNav } from '@/components/leaves/leaves-subnav'
import { useToast } from '@/components/ui/toast'

const MONTHS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
]

interface EmployeeBalance {
  id: string
  name: string
  email: string
  department: string | null
  avatar: string | null
  role: string
  balance: {
    month: number
    sick_total: number
    sick_used: number
    sick_remaining: number
    casual_total: number
    casual_used: number
    casual_remaining: number
    paid_total: number
    paid_used: number
    paid_remaining: number
  } | null
}

export default function LeaveBalancesPage() {
  const { user, token } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [employees, setEmployees] = useState<EmployeeBalance[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [editDialog, setEditDialog] = useState<{ open: boolean; employee: EmployeeBalance | null }>({
    open: false,
    employee: null,
  })
  const [editForm, setEditForm] = useState({
    sick_total: 0,
    casual_total: 0,
    paid_total: 0,
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!user || !token) return
    fetchBalances()
  }, [user, token, selectedYear, selectedMonth])

  async function fetchBalances() {
    setLoading(true)
    try {
      const res = await fetch(`/api/leaves/balances?year=${selectedYear}&month=${selectedMonth}`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (res.ok) {
        const data = await res.json()
        setEmployees(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching balances:', error)
      toast({
        title: 'Error',
        description: 'Failed to load leave balances',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  function openEditDialog(employee: EmployeeBalance) {
    setEditDialog({ open: true, employee })
    setEditForm({
      sick_total: employee.balance?.sick_total || 2,
      casual_total: employee.balance?.casual_total || 1,
      paid_total: employee.balance?.paid_total || 1,
    })
  }

  async function handleSaveBalance() {
    if (!editDialog.employee) return

    setSaving(true)
    try {
      const url = '/api/leaves/balance'
      const method = editDialog.employee.balance ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          employeeId: editDialog.employee.id,
          year: selectedYear,
          month: selectedMonth,
          sickTotal: editForm.sick_total,
          casualTotal: editForm.casual_total,
          paidTotal: editForm.paid_total,
        })
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to update balance')
      }

      toast({
        title: 'Balance updated',
        description: `Leave balance for ${editDialog.employee.name} has been updated.`,
      })

      setEditDialog({ open: false, employee: null })
      fetchBalances()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update balance',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  function navigateMonth(direction: 'prev' | 'next') {
    if (direction === 'next') {
      if (selectedMonth === 12) {
        setSelectedMonth(1)
        setSelectedYear(selectedYear + 1)
      } else {
        setSelectedMonth(selectedMonth + 1)
      }
    } else {
      if (selectedMonth === 1) {
        setSelectedMonth(12)
        setSelectedYear(selectedYear - 1)
      } else {
        setSelectedMonth(selectedMonth - 1)
      }
    }
  }

  if (!user) return null

  const canManage = hasPermission(user, 'leaves.manage_balances')

  const filteredEmployees = employees.filter(emp =>
    emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const yearOptions = []
  const currentYear = new Date().getFullYear()
  for (let y = currentYear; y >= currentYear - 2; y--) {
    yearOptions.push({ value: y, label: y.toString() })
  }

  const monthLabel = MONTHS.find(m => m.value === selectedMonth)?.label || ''

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <PermissionGuard check={(u) => hasPermission(u, 'leaves.manage_balances')} fallbackMessage="You don't have permission to manage leave balances.">
      <div className="space-y-6">
        <Breadcrumb />
        <LeavesSubNav />

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <PageHeader
            title="Leave Balances"
            description="Manage monthly leave allocations for employees"
          />
        </div>

        <Card>
          <CardHeader className="pb-4">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={() => navigateMonth('prev')}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="flex items-center gap-2 min-w-[200px]">
                  <Select
                    value={selectedMonth.toString()}
                    onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                    className="w-32"
                  >
                    {MONTHS.map(m => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </Select>
                  <Select
                    value={selectedYear.toString()}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    className="w-24"
                  >
                    {yearOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </Select>
                </div>
                <Button variant="outline" size="icon" onClick={() => navigateMonth('next')}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search employees..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {filteredEmployees.length === 0 ? (
              <EmptyState
                icon={Users}
                title="No employees found"
                description="No employees match your search criteria."
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="text-center">Sick Leave</TableHead>
                    <TableHead className="text-center">Casual Leave</TableHead>
                    <TableHead className="text-center">Paid Leave</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEmployees.map((emp) => (
                    <TableRow key={emp.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={emp.avatar || undefined} />
                            <AvatarFallback>{getInitials(emp.name)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{emp.name}</p>
                            <p className="text-xs text-muted-foreground">{emp.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">{emp.role}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {emp.balance ? (
                          <div className="text-sm">
                            <span className="font-medium">{emp.balance.sick_remaining}</span>
                            <span className="text-muted-foreground">/{emp.balance.sick_total}</span>
                            {emp.balance.sick_used > 0 && (
                              <span className="text-xs text-muted-foreground ml-1">({emp.balance.sick_used} used)</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">Not set</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {emp.balance ? (
                          <div className="text-sm">
                            <span className="font-medium">{emp.balance.casual_remaining}</span>
                            <span className="text-muted-foreground">/{emp.balance.casual_total}</span>
                            {emp.balance.casual_used > 0 && (
                              <span className="text-xs text-muted-foreground ml-1">({emp.balance.casual_used} used)</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">Not set</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {emp.balance ? (
                          <div className="text-sm">
                            <span className="font-medium">{emp.balance.paid_remaining}</span>
                            <span className="text-muted-foreground">/{emp.balance.paid_total}</span>
                            {emp.balance.paid_used > 0 && (
                              <span className="text-xs text-muted-foreground ml-1">({emp.balance.paid_used} used)</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">Not set</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditDialog(emp)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Dialog open={editDialog.open} onOpenChange={(open) => setEditDialog({ open, employee: null })}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Leave Balance - {monthLabel} {selectedYear}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={editDialog.employee?.avatar || undefined} />
                  <AvatarFallback>{editDialog.employee ? getInitials(editDialog.employee.name) : ''}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{editDialog.employee?.name}</p>
                  <p className="text-sm text-muted-foreground">{editDialog.employee?.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sick">Sick Leave (days)</Label>
                  <Input
                    id="sick"
                    type="number"
                    min="0"
                    value={editForm.sick_total}
                    onChange={(e) => setEditForm({ ...editForm, sick_total: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="casual">Casual Leave (days)</Label>
                  <Input
                    id="casual"
                    type="number"
                    min="0"
                    value={editForm.casual_total}
                    onChange={(e) => setEditForm({ ...editForm, casual_total: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="paid">Paid Leave (days)</Label>
                  <Input
                    id="paid"
                    type="number"
                    min="0"
                    value={editForm.paid_total}
                    onChange={(e) => setEditForm({ ...editForm, paid_total: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <p className="text-sm text-muted-foreground">
                These are the leave days allocated for <strong>{monthLabel} {selectedYear}</strong>. 
                Unused days will not carry over to the next month.
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDialog({ open: false, employee: null })}>
                Cancel
              </Button>
              <Button onClick={handleSaveBalance} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PermissionGuard>
  )
}