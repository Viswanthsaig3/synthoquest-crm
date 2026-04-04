'use client'

import React, { useState } from 'react'
import { useAuth } from '@/context/auth-context'
import { Breadcrumb } from '@/components/layout/breadcrumb'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/components/ui/toast'
import { mockLeadTypes, getLeadTypeStats } from '@/lib/mock-data/lead-types'
import { LEAD_TYPE_ICONS, LEAD_TYPE_COLORS } from '@/lib/constants'
import { canManageSettings } from '@/lib/permissions'
import { 
  Settings, 
  Plus, 
  Edit, 
  Trash2, 
  GraduationCap, 
  Briefcase, 
  Users, 
  Building, 
  Handshake, 
  FileText, 
  UserPlus, 
  Star,
  Eye,
  Copy
} from 'lucide-react'
import Link from 'next/link'

const iconMap: Record<string, React.ElementType> = {
  GraduationCap,
  Briefcase,
  Users,
  Building,
  Handshake,
  FileText,
  UserPlus,
  Star,
}

export default function LeadTypesPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [leadTypes, setLeadTypes] = useState(mockLeadTypes)

  if (!user) return null

  const canManage = canManageSettings(user)

  if (!canManage) {
    return (
      <div className="space-y-6">
        <Breadcrumb />
        <Card>
          <CardContent className="py-12 text-center">
            <Settings className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Access denied. Admin or HR only.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const stats = getLeadTypeStats()

  const handleToggleActive = (typeId: string, currentStatus: boolean) => {
    setLeadTypes(prev => prev.map(lt => 
      lt.id === typeId ? { ...lt, isActive: !currentStatus } : lt
    ))
    toast({
      title: currentStatus ? 'Lead type deactivated' : 'Lead type activated',
      description: `Lead type has been ${currentStatus ? 'deactivated' : 'activated'}.`,
    })
  }

  const handleDuplicate = (typeId: string) => {
    toast({
      title: 'Lead type duplicated',
      description: 'A copy has been created as a draft.',
    })
  }

  const handleDelete = (typeId: string) => {
    const typeToDelete = leadTypes.find(lt => lt.id === typeId)
    if (typeToDelete?.isSystem) {
      toast({
        title: 'Cannot delete system type',
        description: 'System lead types cannot be deleted.',
        variant: 'destructive',
      })
      return
    }
    toast({
      title: 'Lead type deleted',
      description: 'The lead type has been removed.',
    })
  }

  const getIconComponent = (iconName: string) => {
    return iconMap[iconName] || FileText
  }

  return (
    <div className="space-y-6">
      <Breadcrumb />
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Lead Types</h1>
          <p className="text-muted-foreground">Manage lead categories and their configurations</p>
        </div>
        <Link href="/settings/lead-types/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Lead Type
          </Button>
        </Link>
      </div>

      <div className="grid gap-6">
        {leadTypes.map((leadType) => {
          const IconComponent = getIconComponent(leadType.icon)
          const typeStats = stats[leadType.id] || { total: 0, active: 0, converted: 0 }
          
          return (
            <Card key={leadType.id} className={!leadType.isActive ? 'opacity-60' : ''}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div 
                      className="h-12 w-12 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${leadType.color}20` }}
                    >
                      <IconComponent 
                        className="h-6 w-6" 
                        style={{ color: leadType.color }} 
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle>{leadType.name}</CardTitle>
                        {leadType.isSystem && (
                          <Badge variant="outline">System</Badge>
                        )}
                        {!leadType.isActive && (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </div>
                      <CardDescription>{leadType.description}</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={leadType.isActive}
                      onCheckedChange={() => handleToggleActive(leadType.id, leadType.isActive)}
                    />
                    <Link href={`/settings/lead-types/${leadType.id}`}>
                      <Button variant="ghost" size="icon">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>
                    {!leadType.isSystem && (
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleDelete(leadType.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-4">
                  <div className="p-3 rounded-lg bg-muted">
                    <p className="text-xs text-muted-foreground">Total Leads</p>
                    <p className="text-xl font-bold">{typeStats.total}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted">
                    <p className="text-xs text-muted-foreground">Active</p>
                    <p className="text-xl font-bold text-blue-600">{typeStats.active}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted">
                    <p className="text-xs text-muted-foreground">Converted</p>
                    <p className="text-xl font-bold text-green-600">{typeStats.converted}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted">
                    <p className="text-xs text-muted-foreground">Custom Fields</p>
                    <p className="text-xl font-bold">{leadType.fields.length}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted">
                    <p className="text-xs text-muted-foreground">Statuses</p>
                    <p className="text-xl font-bold">{leadType.statuses.length}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted">
                    <p className="text-xs text-muted-foreground">Sources</p>
                    <p className="text-xl font-bold">{leadType.sources.length}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium mb-2">Workflow Statuses</p>
                    <div className="flex flex-wrap gap-2">
                      {leadType.statuses.map((status) => (
                        <Badge 
                          key={status.id} 
                          variant="outline"
                          style={{ 
                            borderColor: status.color,
                            backgroundColor: `${status.color}15`,
                            color: status.color
                          }}
                        >
                          {status.label}
                          {status.isInitial && ' (Start)'}
                          {status.isFinal && ' (End)'}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium mb-2">Sources</p>
                    <div className="flex flex-wrap gap-2">
                      {leadType.sources.map((source) => (
                        <Badge key={source.id} variant="secondary">
                          {source.label}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 pt-2 text-sm text-muted-foreground">
                    {leadType.approvalRequired && (
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        Requires approval
                      </span>
                    )}
                    {leadType.conversionTarget !== 'none' && (
                      <span className="flex items-center gap-1">
                        <UserPlus className="h-4 w-4" />
                        Converts to: {leadType.conversionTarget}
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}