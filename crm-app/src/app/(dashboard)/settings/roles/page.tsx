'use client'

import React from 'react'
import { useAuth } from '@/context/auth-context'
import { Breadcrumb } from '@/components/layout/breadcrumb'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ROLES } from '@/lib/constants'
import { Shield, Plus, Edit, Trash2 } from 'lucide-react'

const permissions = [
  { module: 'Dashboard', view: true, edit: true, delete: false, approve: false },
  { module: 'Leads', view: true, edit: true, delete: true, approve: true },
  { module: 'Employees', view: true, edit: true, delete: true, approve: false },
  { module: 'Tasks', view: true, edit: true, delete: false, approve: false },
  { module: 'Timesheets', view: true, edit: false, delete: false, approve: true },
  { module: 'Attendance', view: true, edit: false, delete: false, approve: false },
  { module: 'Leaves', view: true, edit: false, delete: false, approve: true },
  { module: 'Payroll', view: true, edit: true, delete: false, approve: false },
  { module: 'Settings', view: true, edit: true, delete: false, approve: false },
]

const rolePermissions: Record<string, typeof permissions> = {
  admin: permissions.map(p => ({ ...p, view: true, edit: true, delete: true, approve: true })),
  hr: permissions.map(p => ({ ...p, delete: p.module === 'Leads' || p.module === 'Employees' ? true : false })),
  team_lead: permissions.map(p => ({ 
    ...p, 
    view: true, 
    edit: ['Tasks', 'Leads'].includes(p.module),
    delete: false,
    approve: ['Timesheets', 'Leaves'].includes(p.module)
  })),
  employee: permissions.map(p => ({ 
    ...p, 
    view: true, 
    edit: false,
    delete: false,
    approve: false
  })),
}

export default function RolesPage() {
  const { user } = useAuth()

  if (!user || user.role !== 'admin') {
    return (
      <div className="space-y-6">
        <Breadcrumb />
        <Card>
          <CardContent className="py-12 text-center">
            <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Access denied. Admin only.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Breadcrumb />
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Role Management</h1>
          <p className="text-muted-foreground">Manage roles and permissions</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Role
        </Button>
      </div>

      <div className="grid gap-6">
        {ROLES.map((role) => (
          <Card key={role.value}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-muted-foreground" />
                  <CardTitle>{role.label}</CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon">
                    <Edit className="h-4 w-4" />
                  </Button>
                  {role.value !== 'admin' && (
                    <Button variant="ghost" size="icon">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 font-medium">Module</th>
                      <th className="text-center py-2 font-medium">View</th>
                      <th className="text-center py-2 font-medium">Edit</th>
                      <th className="text-center py-2 font-medium">Delete</th>
                      <th className="text-center py-2 font-medium">Approve</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rolePermissions[role.value]?.map((perm, i) => (
                      <tr key={i} className="border-b">
                        <td className="py-2">{perm.module}</td>
                        <td className="text-center py-2">
                          {perm.view ? (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">✓</Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="text-center py-2">
                          {perm.edit ? (
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">✓</Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="text-center py-2">
                          {perm.delete ? (
                            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">✓</Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="text-center py-2">
                          {perm.approve ? (
                            <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">✓</Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}