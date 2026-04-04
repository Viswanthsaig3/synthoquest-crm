'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/auth-context'
import { Breadcrumb } from '@/components/layout/breadcrumb'
import { PermissionGuard } from '@/components/shared'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/toast'
import { getActiveLeadTypes, getInitialStatus, STUDENT_TYPE_ID } from '@/lib/mock-data/lead-types'
import { mockUsers } from '@/lib/mock-data/users'
import { LEAD_PRIORITIES } from '@/lib/constants'
import { generateId } from '@/lib/utils'
import { canCreateLead } from '@/lib/permissions'
import { CustomFieldsData, LeadType, LeadTypeField } from '@/types/lead-type'
import { ArrowLeft, Save, Loader2, GraduationCap, Briefcase, FileText, Users, Building, Handshake, UserPlus, Star } from 'lucide-react'
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

export default function NewLeadPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  
  const leadTypes = getActiveLeadTypes()
  const [selectedTypeId, setSelectedTypeId] = useState(STUDENT_TYPE_ID)
  const selectedLeadType = useMemo(() => 
    leadTypes.find(lt => lt.id === selectedTypeId), 
    [leadTypes, selectedTypeId]
  )
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    alternatePhone: '',
    notes: '',
    priority: 'warm',
    assignedTo: '',
  })
  
  const [customFields, setCustomFields] = useState<CustomFieldsData>({})

  useEffect(() => {
    if (selectedLeadType) {
      const initialCustomFields: CustomFieldsData = {}
      selectedLeadType.fields.forEach(field => {
        initialCustomFields[field.id] = field.defaultValue ?? null
      })
      setCustomFields(initialCustomFields)
    }
  }, [selectedTypeId])

  const employees = mockUsers.filter(u => u.status === 'active')

  const handleCustomFieldChange = (fieldId: string, value: string | number | boolean | string[] | null) => {
    setCustomFields(prev => ({ ...prev, [fieldId]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim() || !formData.email.trim() || !formData.phone.trim()) {
      toast({
        title: 'Required fields missing',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)
    
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    toast({
      title: 'Lead created',
      description: `"${formData.name}" has been added successfully.`,
    })
    
    router.push('/leads')
  }

  const getIconComponent = (iconName: string) => {
    return iconMap[iconName] || FileText
  }

  const renderDynamicField = (field: LeadTypeField) => {
    const value = customFields[field.id] ?? ''
    
    switch (field.type) {
      case 'text':
      case 'email':
      case 'phone':
      case 'url':
      case 'number':
        return (
          <Input
            id={field.id}
            type={field.type}
            value={value as string}
            onChange={(e) => handleCustomFieldChange(field.id, field.type === 'number' ? parseFloat(e.target.value) || '' : e.target.value)}
            placeholder={field.placeholder}
          />
        )
      
      case 'textarea':
        return (
          <Textarea
            id={field.id}
            value={value as string}
            onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            rows={3}
          />
        )
      
      case 'select':
        return (
          <Select
            value={value as string}
            onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
          >
            <option value="">{field.placeholder || 'Select an option'}</option>
            {field.options?.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </Select>
        )
      
      case 'date':
        return (
          <Input
            id={field.id}
            type="date"
            value={value as string}
            onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
          />
        )
      
      case 'checkbox':
        return (
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id={field.id}
              checked={value as boolean}
              onChange={(e) => handleCustomFieldChange(field.id, e.target.checked)}
              className="h-4 w-4"
            />
            <Label htmlFor={field.id} className="font-normal">{field.label}</Label>
          </div>
        )
      
      default:
        return (
          <Input
            id={field.id}
            value={value as string}
            onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder}
          />
        )
    }
  }

  return (
    <PermissionGuard check={canCreateLead} fallbackMessage="You don't have permission to create leads.">
      <div className="space-y-6 max-w-4xl">
        <Breadcrumb />
      
      <div className="flex items-center gap-4">
        <Link href="/leads">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Add New Lead</h1>
          <p className="text-muted-foreground">Create a new lead entry</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Lead Type</CardTitle>
                <CardDescription>Select the type of lead you're adding</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {leadTypes.map((lt) => {
                    const IconComponent = getIconComponent(lt.icon)
                    const isSelected = selectedTypeId === lt.id
                    return (
                      <button
                        key={lt.id}
                        type="button"
                        onClick={() => setSelectedTypeId(lt.id)}
                        className={`p-4 rounded-lg border-2 text-left transition-all ${
                          isSelected 
                            ? 'border-primary bg-primary/5' 
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <div 
                            className="h-10 w-10 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: `${lt.color}20` }}
                          >
                            <IconComponent className="h-5 w-5" style={{ color: lt.color }} />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">{lt.name}</p>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">{lt.description}</p>
                      </button>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
                <CardDescription>Basic contact details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter full name"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="email@example.com"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone *</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+91 98765 43210"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="alternatePhone">Alternate Phone</Label>
                  <Input
                    id="alternatePhone"
                    value={formData.alternatePhone}
                    onChange={(e) => setFormData({ ...formData, alternatePhone: e.target.value })}
                    placeholder="+91 98765 43210"
                  />
                </div>
              </CardContent>
            </Card>

            {selectedLeadType && selectedLeadType.fields.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>{selectedLeadType.name} Details</CardTitle>
                  <CardDescription>Type-specific information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedLeadType.fields
                    .sort((a, b) => a.order - b.order)
                    .map((field) => (
                      <div key={field.id} className="space-y-2">
                        {field.type !== 'checkbox' && (
                          <Label htmlFor={field.id}>
                            {field.label}
                            {field.required && <span className="text-red-500 ml-1">*</span>}
                          </Label>
                        )}
                        {renderDynamicField(field)}
                      </div>
                    ))}
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Additional Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Select
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    >
                      {LEAD_PRIORITIES.map(p => (
                        <option key={p.value} value={p.value}>{p.label}</option>
                      ))}
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="source">Source</Label>
                    <Select
                      value={customFields['_source'] as string || ''}
                      onChange={(e) => handleCustomFieldChange('_source', e.target.value)}
                    >
                      <option value="">Select source</option>
                      {selectedLeadType?.sources.map(s => (
                        <option key={s.id} value={s.value}>{s.label}</option>
                      ))}
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="assignedTo">Assign To</Label>
                  <Select
                    value={formData.assignedTo}
                    onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                  >
                    <option value="">Leave unassigned</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.name} - {emp.department}</option>
                    ))}
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Any additional notes..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Lead Type Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedLeadType && (
                  <>
                    <div>
                      <p className="text-sm text-muted-foreground">Conversion Target</p>
                      <p className="font-medium capitalize">{selectedLeadType.conversionTarget}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Workflow Statuses</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedLeadType.statuses.slice(0, 4).map(s => (
                          <Badge key={s.id} variant="outline" className="text-xs">{s.label}</Badge>
                        ))}
                        {selectedLeadType.statuses.length > 4 && (
                          <Badge variant="secondary" className="text-xs">+{selectedLeadType.statuses.length - 4}</Badge>
                        )}
                      </div>
                    </div>
                    {selectedLeadType.approvalRequired && (
                      <div className="p-3 rounded-lg bg-yellow-50 border border-yellow-200">
                        <p className="text-sm text-yellow-800">
                          This lead type requires HR approval before conversion.
                        </p>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            <div className="flex flex-col gap-2">
              <Link href="/leads">
                <Button variant="outline" className="w-full">Cancel</Button>
              </Link>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Create Lead
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </form>
      </div>
    </PermissionGuard>
  )
}