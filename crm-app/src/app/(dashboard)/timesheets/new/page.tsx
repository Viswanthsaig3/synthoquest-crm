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
import { useToast } from '@/components/ui/toast'
import { mockTasks } from '@/lib/mock-data'
import { ArrowLeft, Save, Loader2, Plus, Trash2 } from 'lucide-react'
import Link from 'next/link'

interface TimesheetEntry {
  task: string
  hours: string
  description: string
}

export default function NewTimesheetPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [entries, setEntries] = useState<TimesheetEntry[]>([
    { task: '', hours: '', description: '' }
  ])

  useEffect(() => {
    if (user && user.role === 'admin') {
      router.replace('/timesheets')
    }
  }, [user, router])

  if (!user) return null

  if (user.role === 'admin') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  const addEntry = () => {
    setEntries([...entries, { task: '', hours: '', description: '' }])
  }

  const removeEntry = (index: number) => {
    setEntries(entries.filter((_, i) => i !== index))
  }

  const updateEntry = (index: number, field: keyof TimesheetEntry, value: string) => {
    const updated = [...entries]
    updated[index] = { ...updated[index], [field]: value }
    setEntries(updated)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    await new Promise(resolve => setTimeout(resolve, 1000))

    toast({
      title: 'Timesheet submitted',
      description: 'Your timesheet has been submitted for approval.',
    })

    router.push('/timesheets')
  }

  const totalHours = entries.reduce((sum, e) => sum + (parseFloat(e.hours) || 0), 0)

  return (
    <div className="space-y-6 max-w-3xl">
      <Breadcrumb />
      
      <div className="flex items-center gap-4">
        <Link href="/timesheets">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Submit Timesheet</h1>
          <p className="text-muted-foreground">Log your work hours for this week</p>
        </div>
      </div>

      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Weekly Timesheet</CardTitle>
                <CardDescription>Add your daily work entries</CardDescription>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Total Hours</p>
                <p className="text-2xl font-bold">{totalHours}h</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {entries.map((entry, index) => (
              <div key={index} className="p-4 border rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Entry {index + 1}</span>
                  {entries.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeEntry(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <Label>Task</Label>
                    <Select
                      value={entry.task}
                      onChange={(e) => updateEntry(index, 'task', e.target.value)}
                    >
                      <option value="">Select task</option>
                      {mockTasks.map(t => (
                        <option key={t.id} value={t.id}>{t.title}</option>
                      ))}
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Hours</Label>
                    <Input
                      type="number"
                      step="0.5"
                      min="0"
                      max="12"
                      value={entry.hours}
                      onChange={(e) => updateEntry(index, 'hours', e.target.value)}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Input
                      value={entry.description}
                      onChange={(e) => updateEntry(index, 'description', e.target.value)}
                      placeholder="What did you work on?"
                    />
                  </div>
                </div>
              </div>
            ))}

            <Button type="button" variant="outline" onClick={addEntry} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add Entry
            </Button>
          </CardContent>

          <div className="flex justify-end gap-4 p-6 pt-0">
            <Link href="/timesheets">
              <Button variant="outline" type="button">Cancel</Button>
            </Link>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Submit for Approval
                </>
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}