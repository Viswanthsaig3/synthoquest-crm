'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/context/auth-context'
import { Breadcrumb } from '@/components/layout/breadcrumb'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/toast'
import { getTimesheetByDate } from '@/lib/mock-data/timesheets'
import { getVisibleTasks } from '@/lib/permissions'
import { mockTasks } from '@/lib/mock-data'
import { formatDate } from '@/lib/utils'
import { ArrowLeft, Save, Loader2, Plus, Trash2, Calendar, AlertCircle } from 'lucide-react'
import Link from 'next/link'

interface TimesheetEntryInput {
  taskId: string
  taskTitle: string
  hours: string
  description: string
}

export default function NewTimesheetPage() {
  const { user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  
  const dateParam = searchParams.get('date')
  const [selectedDate, setSelectedDate] = useState(() => {
    if (dateParam) return dateParam
    return new Date().toISOString().split('T')[0]
  })
  const [loading, setLoading] = useState(false)
  const [entries, setEntries] = useState<TimesheetEntryInput[]>([
    { taskId: '', taskTitle: '', hours: '', description: '' }
  ])

  const assignedTasks = user ? getVisibleTasks(user, mockTasks) : []

  useEffect(() => {
    if (selectedDate && user) {
      const existing = getTimesheetByDate(user.id, new Date(selectedDate))
      if (existing) {
        toast({
          title: 'Timesheet exists',
          description: 'A timesheet already exists for this date. Redirecting...',
          variant: 'destructive',
        })
        router.push(`/timesheets/${existing.id}`)
      }
    }
  }, [selectedDate, user, router, toast])

  if (!user) return null

  const addEntry = () => {
    setEntries([...entries, { taskId: '', taskTitle: '', hours: '', description: '' }])
  }

  const removeEntry = (index: number) => {
    if (entries.length > 1) {
      setEntries(entries.filter((_, i) => i !== index))
    }
  }

  const updateEntry = (index: number, field: keyof TimesheetEntryInput, value: string) => {
    const updated = [...entries]
    updated[index] = { ...updated[index], [field]: value }
    
    if (field === 'taskId') {
      const task = assignedTasks.find(t => t.id === value)
      updated[index].taskTitle = task?.title || ''
    }
    
    setEntries(updated)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const validEntries = entries.filter(e => e.taskId && parseFloat(e.hours) > 0)
    
    if (validEntries.length === 0) {
      toast({
        title: 'Invalid entries',
        description: 'Please add at least one valid task entry with hours.',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)
    await new Promise(resolve => setTimeout(resolve, 1000))

    toast({
      title: 'Timesheet submitted',
      description: `Your timesheet for ${formatDate(new Date(selectedDate))} has been submitted for approval.`,
    })

    router.push('/timesheets')
  }

  const totalHours = entries.reduce((sum, e) => sum + (parseFloat(e.hours) || 0), 0)
  const selectedDateObj = new Date(selectedDate)
  const isWeekend = [0, 6].includes(selectedDateObj.getDay())
  const isFuture = selectedDateObj > new Date()

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
          <h1 className="text-2xl font-bold">Log Daily Timesheet</h1>
          <p className="text-muted-foreground">Record your work hours for a specific day</p>
        </div>
      </div>

      {isWeekend && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="flex items-center gap-3 py-4">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            <p className="text-yellow-800">The selected date is a weekend. Are you sure you want to log hours?</p>
          </CardContent>
        </Card>
      )}

      {isFuture && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="flex items-center gap-3 py-4">
            <AlertCircle className="h-5 w-5 text-blue-600" />
            <p className="text-blue-800">You are logging hours for a future date.</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Daily Timesheet</CardTitle>
                <CardDescription>Add your work entries for the selected date</CardDescription>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Total Hours</p>
                <p className="text-2xl font-bold">{totalHours}h</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatDate(new Date(selectedDate))} - {selectedDateObj.toLocaleDateString('en-US', { weekday: 'long' })}
              </p>
            </div>

            <div className="space-y-4">
              <Label>Task Entries</Label>
              {entries.map((entry, index) => (
                <div key={index} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline">Entry {index + 1}</Badge>
                    {entries.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeEntry(index)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="space-y-2">
                      <Label>Task *</Label>
                      <Select
                        value={entry.taskId}
                        onChange={(e) => updateEntry(index, 'taskId', e.target.value)}
                      >
                        <option value="">Select task</option>
                        {assignedTasks.map(t => (
                          <option key={t.id} value={t.id}>{t.title}</option>
                        ))}
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Hours *</Label>
                      <Input
                        type="number"
                        step="0.5"
                        min="0.5"
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
                Add Another Task
              </Button>
            </div>
          </CardContent>

          <div className="flex justify-end gap-4 p-6 pt-0">
            <Link href="/timesheets">
              <Button variant="outline" type="button">Cancel</Button>
            </Link>
            <Button type="submit" disabled={loading || totalHours === 0}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Submit Timesheet
                </>
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}