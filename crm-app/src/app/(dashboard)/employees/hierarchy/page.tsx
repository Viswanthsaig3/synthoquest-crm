'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/context/auth-context'
import { Breadcrumb } from '@/components/layout/breadcrumb'
import { PageHeader, PermissionGuard } from '@/components/shared'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { SimpleOrgChart } from '@/components/employees/simple-org-chart'
import { canManageEmployees } from '@/lib/permissions'
import { getAccessToken } from '@/lib/api/client'
import { Loader2, RefreshCw, Network, Users } from 'lucide-react'
import { useToast } from '@/components/ui/toast'
import type { HierarchyNode } from '@/lib/db/queries/users'

export default function EmployeeHierarchyPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<HierarchyNode[]>([])
  const [allEmployees, setAllEmployees] = useState<HierarchyNode[]>([])

  const canEdit = user ? canManageEmployees(user) : false

  // Flatten hierarchy to get all employees
  const flattenHierarchy = useCallback((nodes: HierarchyNode[]): HierarchyNode[] => {
    return nodes.reduce<HierarchyNode[]>((acc, node) => {
      acc.push(node)
      if (node.reports.length > 0) {
        acc.push(...flattenHierarchy(node.reports))
      }
      return acc
    }, [])
  }, [])

  const loadHierarchy = useCallback(async () => {
    try {
      setLoading(true)
      const token = getAccessToken()

      const res = await fetch('/api/users/hierarchy', {
        headers: { Authorization: `Bearer ${token}` },
      })

      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Failed to load hierarchy')

      setData(result.data || [])
      setAllEmployees(flattenHierarchy(result.data || []))
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to load hierarchy',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [toast, flattenHierarchy])

  useEffect(() => {
    loadHierarchy()
  }, [loadHierarchy])

  const handleReassign = async (userId: string, newManagerId: string | null) => {
    try {
      const token = getAccessToken()
      const res = await fetch(`/api/users/${userId}/manager`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ managerId: newManagerId }),
      })

      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Failed to update manager')

      toast({
        title: 'Success',
        description: 'Employee has been reassigned successfully.',
      })

      await loadHierarchy()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update manager',
        variant: 'destructive',
      })
      throw error
    }
  }

  // Calculate stats
  const totalEmployees = allEmployees.length
  const managersCount = allEmployees.filter(e => e.reportCount > 0).length
  const rootCount = data.length

  if (!user) return null

  return (
    <PermissionGuard check={canManageEmployees}>
      <div className="space-y-6">
        <Breadcrumb />

        <PageHeader
          title="Employee Hierarchy"
          description="Manage team structure and reporting relationships"
          action={{
            label: 'Refresh',
            onClick: loadHierarchy,
          }}
        />

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Users className="h-8 w-8 text-blue-600" />
              <div>
                <div className="text-2xl font-bold">{totalEmployees}</div>
                <div className="text-sm text-muted-foreground">Total Employees</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Network className="h-8 w-8 text-purple-600" />
              <div>
                <div className="text-2xl font-bold text-purple-600">{managersCount}</div>
                <div className="text-sm text-muted-foreground">Managers</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Users className="h-8 w-8 text-green-600" />
              <div>
                <div className="text-2xl font-bold text-green-600">{rootCount}</div>
                <div className="text-sm text-muted-foreground">Root Level</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Users className="h-8 w-8 text-orange-600" />
              <div>
                <div className="text-2xl font-bold text-orange-600">{totalEmployees - managersCount}</div>
                <div className="text-sm text-muted-foreground">Team Members</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Organization Structure</CardTitle>
          </CardHeader>
          <CardContent>
            <SimpleOrgChart 
              data={data}
              allEmployees={allEmployees}
              onReassign={handleReassign}
              canEdit={canEdit}
              loading={loading}
            />
          </CardContent>
        </Card>
      </div>
    </PermissionGuard>
  )
}