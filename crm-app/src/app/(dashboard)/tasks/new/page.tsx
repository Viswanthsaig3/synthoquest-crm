'use client'

import React, { useState, useMemo } from 'react'
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useToast } from '@/components/ui/toast'
import { mockUsers } from '@/lib/mock-data'
import { TASK_PRIORITIES, COURSES } from '@/lib/constants'
import { getInitials } from '@/lib/utils'
import { canAssignTask, getManagedUsers } from '@/lib/permissions'
import { ArrowLeft, Save, Loader2, Users, User } from 'lucide-react'
import Link from 'next/link'

export default function NewTaskPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    assignedTo: '',
    deadline: '',
    relatedLead: '',
  })

  const canAssign = user && canAssignTask(user)
  const managedUsers = user ? getManagedUsers(user, mockUsers) : []
  
  const assignableEmployees = useMemo(() => {
    if (!user) return []
    if (user.role === 'admin' || user.role === 'hr') {
      return mockUsers.filter(u => u.status === 'active' && u.id !== user.id)
    }
    if (user.role === 'team_lead') {
      return managedUsers.filter(u => u.status === 'active')
    }
    return []
  }, [user, managedUsers])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    await new Promise(resolve => setTimeout(resolve, 1000))

    toast({
      title: 'Task created',
      description: `"${formData.title}" has been created successfully.`,
    })

    router.push('/tasks')
  }

  if (!user) return null

  return (
    <div className="space-y-6 max-w-3xl">
      <Breadcrumb />
      
      <div className="flex items-center gap-4">
        <Link href="/tasks">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Create New Task</h1>
          <p className="text-muted-foreground">Fill in the task details below</p>
        </div>
      </div>

      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Task Details</CardTitle>
            <CardDescription>Provide information about the task</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter task title"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter task description"
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                >
                  {TASK_PRIORITIES.map((p) => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="deadline">Deadline *</Label>
                <Input
                  id="deadline"
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  required
                />
              </div>
            </div>
          </CardContent>

          {canAssign && assignableEmployees.length > 0 && (
            <CardContent className="space-y-4 border-t">
              <div>
                <Label className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Assign To Team Member
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Select a team member to assign this task to
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {assignableEmployees.map((emp) => (
                  <div
                    key={emp.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      formData.assignedTo === emp.id
                        ? 'border-primary bg-primary/5'
                        : 'hover:border-primary/50'
                    }`}
                    onClick={() => setFormData({ ...formData, assignedTo: emp.id })}
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={emp.avatar || undefined} />
                      <AvatarFallback>{getInitials(emp.name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium">{emp.name}</p>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs capitalize">{emp.department}</Badge>
                        <Badge className="text-xs capitalize">{emp.role.replace('_', ' ')}</Badge>
                      </div>
                    </div>
                    {formData.assignedTo === emp.id && (
                      <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                        <svg className="h-3 w-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {formData.assignedTo && (
                <div className="flex items-center gap-2 pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setFormData({ ...formData, assignedTo: '' })}
                  >
                    Clear Selection
                  </Button>
                </div>
              )}
            </CardContent>
          )}

          <CardContent className="space-y-4 border-t">
            <div className="space-y-2">
              <Label htmlFor="relatedLead">Related Course (Optional)</Label>
              <Select
                value={formData.relatedLead}
                onChange={(e) => setFormData({ ...formData, relatedLead: e.target.value })}
              >
                <option value="">Select course</option>
                {COURSES.map((course) => (
                  <option key={course} value={course}>{course}</option>
                ))}
              </Select>
            </div>
          </CardContent>

          <div className="flex justify-end gap-4 p-6 pt-0">
            <Link href="/tasks">
              <Button variant="outline" type="button">Cancel</Button>
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
                  Create Task
                </>
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}