'use client'

import React, { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useToast } from '@/components/ui/toast'
import { useAuth } from '@/context/auth-context'
import { canManageEmployees } from '@/lib/permissions'
import {
  getDepartments,
  createDepartment,
  updateDepartment,
  type DepartmentRecord,
} from '@/lib/api/departments'
import { ArrowLeft, Building2, Loader2, Plus, RotateCcw } from 'lucide-react'

export default function DepartmentsSettingsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [rows, setRows] = useState<DepartmentRecord[]>([])
  const [newDept, setNewDept] = useState({ key: '', name: '', sortOrder: 0 })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getDepartments(true)
      setRows(res.data || [])
    } catch (e) {
      toast({
        title: 'Error',
        description: e instanceof Error ? e.message : 'Failed to load departments',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    load()
  }, [load])

  if (!user) return null

  if (!canManageEmployees(user)) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">You need employees.manage to manage departments.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const handleCreate = async () => {
    if (!newDept.key.trim() || !newDept.name.trim()) {
      toast({ title: 'Key and name required', variant: 'destructive' })
      return
    }
    setSaving(true)
    try {
      const { data } = await createDepartment({
        key: newDept.key.trim(),
        name: newDept.name.trim(),
        sortOrder: newDept.sortOrder,
      })
      setRows((prev) => [...prev, data].sort((a, b) => a.sortOrder - b.sortOrder))
      setNewDept({ key: '', name: '', sortOrder: 0 })
      toast({ title: 'Department created' })
    } catch (e) {
      toast({
        title: 'Error',
        description: e instanceof Error ? e.message : 'Create failed',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const patchRow = async (key: string, patch: Partial<{ name: string; sortOrder: number; archived: boolean }>) => {
    setSaving(true)
    try {
      const { data } = await updateDepartment(key, patch)
      setRows((prev) => {
        const next = prev.map((r) => (r.key === key ? data : r))
        return next.sort((a, b) => a.sortOrder - b.sortOrder)
      })
      toast({ title: 'Saved' })
    } catch (e) {
      toast({
        title: 'Error',
        description: e instanceof Error ? e.message : 'Update failed',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Link href="/settings/organization">
          <Button variant="ghost" size="icon" type="button">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Departments</h1>
          <p className="text-muted-foreground">Add, rename, order, or archive departments</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>New department</CardTitle>
          <CardDescription>Key must be lowercase letters and underscores only (e.g. sales_ops).</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="space-y-2 flex-1">
            <Label htmlFor="new-key">Key</Label>
            <Input
              id="new-key"
              value={newDept.key}
              onChange={(e) => setNewDept({ ...newDept, key: e.target.value })}
              placeholder="sales_ops"
            />
          </div>
          <div className="space-y-2 flex-1">
            <Label htmlFor="new-name">Display name</Label>
            <Input
              id="new-name"
              value={newDept.name}
              onChange={(e) => setNewDept({ ...newDept, name: e.target.value })}
              placeholder="Sales Operations"
            />
          </div>
          <div className="space-y-2 w-full sm:w-28">
            <Label htmlFor="new-sort">Sort</Label>
            <Input
              id="new-sort"
              type="number"
              value={newDept.sortOrder}
              onChange={(e) => setNewDept({ ...newDept, sortOrder: parseInt(e.target.value, 10) || 0 })}
            />
          </div>
          <Button type="button" onClick={handleCreate} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
            Add
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All departments</CardTitle>
          <CardDescription>Archived departments are hidden from employee dropdowns.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Key</TableHead>
                  <TableHead className="w-28">Sort</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <DepartmentRow
                    key={row.id}
                    row={row}
                    disabled={saving}
                    onSave={(patch) => patchRow(row.key, patch)}
                  />
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function DepartmentRow({
  row,
  disabled,
  onSave,
}: {
  row: DepartmentRecord
  disabled: boolean
  onSave: (patch: Partial<{ name: string; sortOrder: number; archived: boolean }>) => void
}) {
  const [name, setName] = useState(row.name)
  const [sortOrder, setSortOrder] = useState(row.sortOrder)

  useEffect(() => {
    setName(row.name)
    setSortOrder(row.sortOrder)
  }, [row.name, row.sortOrder])

  const archived = !!row.archivedAt

  return (
    <TableRow>
      <TableCell>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={disabled}
          className="max-w-xs"
        />
      </TableCell>
      <TableCell>
        <code className="text-sm bg-muted px-2 py-1 rounded">{row.key}</code>
      </TableCell>
      <TableCell>
        <Input
          type="number"
          className="w-20"
          value={sortOrder}
          onChange={(e) => setSortOrder(parseInt(e.target.value, 10) || 0)}
          disabled={disabled}
        />
      </TableCell>
      <TableCell>
        {archived ? (
          <Badge variant="secondary">Archived</Badge>
        ) : (
          <Badge variant="outline">Active</Badge>
        )}
      </TableCell>
      <TableCell className="text-right space-x-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={disabled || (name === row.name && sortOrder === row.sortOrder)}
          onClick={() => onSave({ name, sortOrder })}
        >
          Save
        </Button>
        {archived ? (
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={disabled}
            onClick={() => onSave({ archived: false })}
          >
            <RotateCcw className="h-3 w-3 mr-1" />
            Restore
          </Button>
        ) : (
          <Button
            type="button"
            size="sm"
            variant="destructive"
            disabled={disabled}
            onClick={() => onSave({ archived: true })}
          >
            Archive
          </Button>
        )}
      </TableCell>
    </TableRow>
  )
}
