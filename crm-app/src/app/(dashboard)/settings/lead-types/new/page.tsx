'use client'

import React, { useState } from 'react'
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
import { LEAD_TYPE_ICONS, LEAD_TYPE_COLORS, FIELD_TYPES, CONVERSION_TARGETS } from '@/lib/constants'
import { createLeadType, mockLeadTypes } from '@/lib/mock-data/lead-types'
import { generateId } from '@/lib/utils'
import { 
  ArrowLeft, 
  Save, 
  Loader2, 
  Plus, 
  Trash2, 
  GripVertical,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import Link from 'next/link'
import { LeadTypeField, LeadTypeStatus, LeadTypeSource } from '@/types/lead-type'

export default function NewLeadTypePage() {
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [activeSection, setActiveSection] = useState<'basic' | 'fields' | 'statuses' | 'sources'>('basic')
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: 'FileText',
    color: '#3b82f6',
    conversionTarget: 'none',
    approvalRequired: false,
    approverRoles: [] as string[],
    assignToRoles: [] as string[],
  })
  
  const [fields, setFields] = useState<LeadTypeField[]>([])
  const [statuses, setStatuses] = useState<LeadTypeStatus[]>([
    { id: generateId(), value: 'new', label: 'New', color: 'blue', order: 1, isInitial: true },
    { id: generateId(), value: 'contacted', label: 'Contacted', color: 'purple', order: 2 },
    { id: generateId(), value: 'converted', label: 'Converted', color: 'green', order: 3, isFinal: true },
    { id: generateId(), value: 'lost', label: 'Lost', color: 'red', order: 4, isFinal: true },
  ])
  const [sources, setSources] = useState<LeadTypeSource[]>([
    { id: generateId(), value: 'direct', label: 'Direct' },
    { id: generateId(), value: 'referral', label: 'Referral' },
  ])

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast({
        title: 'Name required',
        description: 'Please enter a name for the lead type.',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)
    
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const newLeadType = createLeadType({
      ...formData,
      fields,
      statuses,
      sources,
      createdBy: user?.id || '',
      conversionTarget: formData.conversionTarget as any,
    })
    
    toast({
      title: 'Lead type created',
      description: `"${formData.name}" has been created successfully.`,
    })
    
    router.push('/settings/lead-types')
  }

  const addField = () => {
    const newField: LeadTypeField = {
      id: generateId(),
      name: `field_${fields.length + 1}`,
      label: `Field ${fields.length + 1}`,
      type: 'text',
      required: false,
      order: fields.length + 1,
    }
    setFields([...fields, newField])
  }

  const updateField = (id: string, updates: Partial<LeadTypeField>) => {
    setFields(fields.map(f => f.id === id ? { ...f, ...updates } : f))
  }

  const removeField = (id: string) => {
    setFields(fields.filter(f => f.id !== id))
  }

  const addStatus = () => {
    const newStatus: LeadTypeStatus = {
      id: generateId(),
      value: `status_${statuses.length + 1}`,
      label: `Status ${statuses.length + 1}`,
      color: 'gray',
      order: statuses.length + 1,
    }
    setStatuses([...statuses, newStatus])
  }

  const updateStatus = (id: string, updates: Partial<LeadTypeStatus>) => {
    setStatuses(statuses.map(s => s.id === id ? { ...s, ...updates } : s))
  }

  const removeStatus = (id: string) => {
    setStatuses(statuses.filter(s => s.id !== id))
  }

  const addSource = () => {
    const newSource: LeadTypeSource = {
      id: generateId(),
      value: `source_${sources.length + 1}`,
      label: `Source ${sources.length + 1}`,
    }
    setSources([...sources, newSource])
  }

  const updateSource = (id: string, updates: Partial<LeadTypeSource>) => {
    setSources(sources.map(s => s.id === id ? { ...s, ...updates } : s))
  }

  const removeSource = (id: string) => {
    setSources(sources.filter(s => s.id !== id))
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <Breadcrumb />
      
      <div className="flex items-center gap-4">
        <Link href="/settings/lead-types">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Create Lead Type</h1>
          <p className="text-muted-foreground">Define a new category of leads</p>
        </div>
      </div>

      <div className="flex gap-4 border-b pb-4">
        <Button 
          variant={activeSection === 'basic' ? 'default' : 'ghost'}
          onClick={() => setActiveSection('basic')}
        >
          Basic Info
        </Button>
        <Button 
          variant={activeSection === 'fields' ? 'default' : 'ghost'}
          onClick={() => setActiveSection('fields')}
        >
          Custom Fields ({fields.length})
        </Button>
        <Button 
          variant={activeSection === 'statuses' ? 'default' : 'ghost'}
          onClick={() => setActiveSection('statuses')}
        >
          Statuses ({statuses.length})
        </Button>
        <Button 
          variant={activeSection === 'sources' ? 'default' : 'ghost'}
          onClick={() => setActiveSection('sources')}
        >
          Sources ({sources.length})
        </Button>
      </div>

      {activeSection === 'basic' && (
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>General settings for this lead type</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Corporate Training Lead"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of this lead type"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="icon">Icon</Label>
                <Select
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                >
                  {LEAD_TYPE_ICONS.map(icon => (
                    <option key={icon.value} value={icon.value}>{icon.label}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="color">Color</Label>
                <Select
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                >
                  {LEAD_TYPE_COLORS.map(color => (
                    <option key={color.value} value={color.value}>{color.label}</option>
                  ))}
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="conversionTarget">Conversion Target</Label>
              <Select
                value={formData.conversionTarget}
                onChange={(e) => setFormData({ ...formData, conversionTarget: e.target.value })}
              >
                {CONVERSION_TARGETS.map(target => (
                  <option key={target.value} value={target.value}>{target.label}</option>
                ))}
              </Select>
            </div>

            <div className="flex items-center gap-2 pt-4">
              <input
                type="checkbox"
                id="approvalRequired"
                checked={formData.approvalRequired}
                onChange={(e) => setFormData({ ...formData, approvalRequired: e.target.checked })}
                className="h-4 w-4"
              />
              <Label htmlFor="approvalRequired">Requires approval before conversion</Label>
            </div>
          </CardContent>
        </Card>
      )}

      {activeSection === 'fields' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Custom Fields</CardTitle>
                <CardDescription>Define fields to capture type-specific information</CardDescription>
              </div>
              <Button onClick={addField} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Field
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {fields.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No custom fields defined.</p>
                <p className="text-sm">Click "Add Field" to create custom fields for this lead type.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {fields.map((field, index) => (
                  <div key={field.id} className="p-4 border rounded-lg space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Field {index + 1}</span>
                      <Button variant="ghost" size="sm" onClick={() => removeField(field.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Label</Label>
                        <Input
                          value={field.label}
                          onChange={(e) => updateField(field.id, { label: e.target.value })}
                          placeholder="Field label"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Name (key)</Label>
                        <Input
                          value={field.name}
                          onChange={(e) => updateField(field.id, { name: e.target.value.replace(/\s+/g, '_').toLowerCase() })}
                          placeholder="field_name"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Type</Label>
                        <Select
                          value={field.type}
                          onChange={(e) => updateField(field.id, { type: e.target.value as any })}
                        >
                          {FIELD_TYPES.map(ft => (
                            <option key={ft.value} value={ft.value}>{ft.label}</option>
                          ))}
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Placeholder</Label>
                        <Input
                          value={field.placeholder || ''}
                          onChange={(e) => updateField(field.id, { placeholder: e.target.value })}
                          placeholder="Enter placeholder text"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`required-${field.id}`}
                        checked={field.required}
                        onChange={(e) => updateField(field.id, { required: e.target.checked })}
                        className="h-4 w-4"
                      />
                      <Label htmlFor={`required-${field.id}`}>Required field</Label>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeSection === 'statuses' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Status Workflow</CardTitle>
                <CardDescription>Define the status stages for this lead type</CardDescription>
              </div>
              <Button onClick={addStatus} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Status
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {statuses.map((status, index) => (
                <div key={status.id} className="flex items-center gap-3 p-3 border rounded-lg">
                  <div className="flex-1 grid grid-cols-3 gap-3">
                    <Input
                      value={status.value}
                      onChange={(e) => updateStatus(status.id, { value: e.target.value.replace(/\s+/g, '_').toLowerCase() })}
                      placeholder="value"
                      className="font-mono text-sm"
                    />
                    <Input
                      value={status.label}
                      onChange={(e) => updateStatus(status.id, { label: e.target.value })}
                      placeholder="Label"
                    />
                    <Select
                      value={status.color}
                      onChange={(e) => updateStatus(status.id, { color: e.target.value })}
                    >
                      <option value="blue">Blue</option>
                      <option value="green">Green</option>
                      <option value="red">Red</option>
                      <option value="orange">Orange</option>
                      <option value="purple">Purple</option>
                      <option value="gray">Gray</option>
                      <option value="teal">Teal</option>
                      <option value="cyan">Cyan</option>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id={`initial-${status.id}`}
                      checked={status.isInitial || false}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setStatuses(statuses.map(s => ({ ...s, isInitial: s.id === status.id })))
                        }
                      }}
                      className="h-4 w-4"
                      title="Initial status"
                    />
                    <input
                      type="checkbox"
                      id={`final-${status.id}`}
                      checked={status.isFinal || false}
                      onChange={(e) => updateStatus(status.id, { isFinal: e.target.checked })}
                      className="h-4 w-4"
                      title="Final status"
                    />
                    <Button variant="ghost" size="sm" onClick={() => removeStatus(status.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              Check the first checkbox for the initial status and the second for final statuses (like Converted/Lost).
            </p>
          </CardContent>
        </Card>
      )}

      {activeSection === 'sources' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Lead Sources</CardTitle>
                <CardDescription>Define where leads of this type come from</CardDescription>
              </div>
              <Button onClick={addSource} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Source
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {sources.map((source) => (
                <div key={source.id} className="flex items-center gap-3">
                  <Input
                    value={source.value}
                    onChange={(e) => updateSource(source.id, { value: e.target.value.replace(/\s+/g, '_').toLowerCase() })}
                    placeholder="value"
                    className="font-mono text-sm w-1/3"
                  />
                  <Input
                    value={source.label}
                    onChange={(e) => updateSource(source.id, { label: e.target.value })}
                    placeholder="Label"
                    className="flex-1"
                  />
                  <Button variant="ghost" size="sm" onClick={() => removeSource(source.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end gap-4">
        <Link href="/settings/lead-types">
          <Button variant="outline">Cancel</Button>
        </Link>
        <Button onClick={handleSubmit} disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Create Lead Type
            </>
          )}
        </Button>
      </div>
    </div>
  )
}