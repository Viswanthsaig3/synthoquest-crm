'use client'

import React, { useMemo, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/context/auth-context'
import { Breadcrumb } from '@/components/layout/breadcrumb'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/toast'
import { createTimesheet, createTimesheetEntry, getTimesheets } from '@/lib/api/timesheets'
import { getAccessToken } from '@/lib/api/client'
import {
  compareTimeKeys,
  formatLongDateFromYmd,
  isFutureTimeForToday,
  minutesFromTimeKey,
} from '@/lib/date-utils'
import { getErrorMessage } from '@/lib/utils'
import { ArrowLeft, Loader2, Plus, Trash2, Calendar, Save } from 'lucide-react'
import Link from 'next/link'
import type { Timesheet } from '@/types/timesheet'
import { TimesheetsSubNav } from '@/components/timesheets/timesheets-subnav'
interface TimesheetEntryInput {
  startTime: string
  endTime: string
  description: string
  billable: boolean
  isBreak?: boolean
}

interface ServerClockData {
  timezone: string
  todayKey: string
  nowTime: string
}

export default function NewTimesheetPage() {
  const { user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  const dateParam = searchParams.get('date')
  const [serverClock, setServerClock] = useState<ServerClockData | null>(null)
  const [existingTodayTimesheet, setExistingTodayTimesheet] = useState<Timesheet | null>(null)

  const [loading, setLoading] = useState(false)

  const getDefaultEntry = (now: string, prevEndTime?: string): TimesheetEntryInput => {
    const nowMin = minutesFromTimeKey(now)
    const defaultStartMin = Math.max(0, nowMin - 60)
    const priorEnd = prevEndTime ? minutesFromTimeKey(prevEndTime) : Number.NaN
    const startMin = Number.isFinite(priorEnd) && priorEnd < nowMin ? priorEnd : defaultStartMin

    const hh = String(Math.floor(startMin / 60)).padStart(2, '0')
    const mm = String(startMin % 60).padStart(2, '0')

    return {
      startTime: `${hh}:${mm}`,
      endTime: now,
      description: '',
      billable: true,
      isBreak: false,
    }
  }

  const formatTimeFromMinutes = (value: number): string => {
    const bounded = Math.min(23 * 60 + 59, Math.max(0, value))
    const hh = String(Math.floor(bounded / 60)).padStart(2, '0')
    const mm = String(bounded % 60).padStart(2, '0')
    return `${hh}:${mm}`
  }

  const getPrefilledBreakEntry = (baseStart?: string): TimesheetEntryInput => {
    const nowMin = minutesFromTimeKey(currentNowTime)
    const fallbackStart = Number.isNaN(nowMin) ? '00:00' : formatTimeFromMinutes(Math.max(0, nowMin - 30))
    const startTime = baseStart || fallbackStart
    const startMin = minutesFromTimeKey(startTime)
    const safeStartMin = Number.isNaN(startMin) ? Math.max(0, nowMin - 30) : startMin
    const targetEndMin = Number.isNaN(nowMin) ? safeStartMin + 30 : Math.min(nowMin, safeStartMin + 30)
    const endTime = formatTimeFromMinutes(targetEndMin)

    return {
      startTime: compareTimeKeys(startTime, endTime) < 0 ? startTime : fallbackStart,
      endTime: compareTimeKeys(startTime, endTime) < 0 ? endTime : currentNowTime,
      description: 'Break',
      billable: false,
      isBreak: true,
    }
  }

  const [entries, setEntries] = useState<TimesheetEntryInput[]>([])

  useEffect(() => {
    if (!user) return
    const token = getAccessToken()
    if (!token) return

    const loadServerClock = async () => {
      try {
        const response = await fetch('/api/time/now', {
          headers: { Authorization: `Bearer ${token}` },
        })
        const result = await response.json()
        if (!response.ok) throw new Error(result.error || 'Failed to load server time')
        const clock = result.data as ServerClockData
        setServerClock(clock)
        setEntries((prev) => (prev.length > 0 ? prev : [getDefaultEntry(clock.nowTime)]))
      } catch (error: unknown) {
        toast({
          title: 'Error',
          description: getErrorMessage(error, 'Failed to load server time'),
          variant: 'destructive',
        })
      }
    }

    void loadServerClock()
  }, [toast, user])

  const todayKey = serverClock?.todayKey || ''
  const currentNowTime = serverClock?.nowTime || ''
  const currentTimezone = serverClock?.timezone || 'Asia/Kolkata'

  useEffect(() => {
    if (!todayKey || !user) return
    const loadTodayTimesheet = async () => {
      try {
        const response = await getTimesheets({ workDate: todayKey, limit: 5 })
        const own = (response.data || []).find((ts) => ts.employeeId === user.id) || null
        setExistingTodayTimesheet(own)
      } catch (error) {
        console.error('Failed to load today timesheet:', error)
      }
    }
    void loadTodayTimesheet()
  }, [todayKey, user])

  useEffect(() => {
    if (!todayKey) return
    if (dateParam !== todayKey) {
      if (dateParam) {
        toast({
          title: 'Only today can be logged',
          description: `You can only log hours for today (${todayKey}).`,
        })
      }
      router.replace(`/timesheets/new?date=${todayKey}`)
    }
  }, [dateParam, todayKey, router, toast])

  const addEntry = () => {
    const last = entries[entries.length - 1]
    setEntries([
      ...entries,
      getDefaultEntry(currentNowTime, last?.endTime),
    ])
  }

  const addBreakAfterEntry = (index: number) => {
    const current = entries[index]
    const updated = [...entries]
    updated.splice(index + 1, 0, getPrefilledBreakEntry(current?.endTime))
    setEntries(updated)
  }

  const removeEntry = (index: number) => {
    if (entries.length > 1) {
      setEntries(entries.filter((_, i) => i !== index))
    }
  }

  const updateEntry = (index: number, field: keyof TimesheetEntryInput, value: string | boolean) => {
    const updated = [...entries]
    updated[index] = { ...updated[index], [field]: value }
    setEntries(updated)
  }

  const calculateHours = (entry: TimesheetEntryInput): number => {
    if (!entry.startTime || !entry.endTime) return 0
    const [startH, startM] = entry.startTime.split(':').map(Number)
    const [endH, endM] = entry.endTime.split(':').map(Number)
    const startMinutes = startH * 60 + startM
    const endMinutes = endH * 60 + endM
    if (entry.isBreak) return 0
    return Math.max(0, (endMinutes - startMinutes) / 60)
  }

  const totalHours = entries.reduce((sum, e) => sum + calculateHours(e), 0)

  const entryErrors = useMemo(() => {
    const errors = entries.map(() => [] as string[])

    for (let i = 0; i < entries.length; i += 1) {
      const entry = entries[i]
      if (!entry.startTime || !entry.endTime) {
        errors[i].push('Start and end time are required.')
        continue
      }
      if (compareTimeKeys(entry.startTime, entry.endTime) >= 0) {
        errors[i].push('Start time must be earlier than end time.')
      }
      if (compareTimeKeys(entry.endTime, currentNowTime) > 0 || isFutureTimeForToday(entry.endTime, currentTimezone)) {
        errors[i].push(`End time cannot be later than current time (${currentNowTime}).`)
      }
    }

    for (let i = 0; i < entries.length; i += 1) {
      for (let j = i + 1; j < entries.length; j += 1) {
        const a = entries[i]
        const b = entries[j]
        if (!a.startTime || !a.endTime || !b.startTime || !b.endTime) continue
        const aStart = minutesFromTimeKey(a.startTime)
        const aEnd = minutesFromTimeKey(a.endTime)
        const bStart = minutesFromTimeKey(b.startTime)
        const bEnd = minutesFromTimeKey(b.endTime)
        if (Number.isNaN(aStart) || Number.isNaN(aEnd) || Number.isNaN(bStart) || Number.isNaN(bEnd)) continue
        if (aStart < bEnd && bStart < aEnd) {
          errors[i].push('Time block overlaps with another block.')
          errors[j].push('Time block overlaps with another block.')
        }
      }
    }

    return errors
  }, [entries, currentNowTime, currentTimezone])

  const hasErrors = entryErrors.some((e) => e.length > 0)
  const validEntries = entries.filter((entry, index) => entry.startTime && entry.endTime && entryErrors[index].length === 0)

  if (!user) return null
  if (!serverClock) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (dateParam !== todayKey) {
    return null
  }

  const runAction = async () => {
    if (validEntries.length === 0) {
      toast({
        title: 'Add a time block',
        description: 'Fix entry errors before saving.',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)
    try {
      let ts = existingTodayTimesheet
      if (!ts) {
        const created = await createTimesheet({
          employeeId: user.id,
          workDate: todayKey,
          notes: '',
        })
        ts = created.data
        setExistingTodayTimesheet(ts)
      }

      for (const entry of validEntries) {
        const startMin = minutesFromTimeKey(entry.startTime)
        const endMin = minutesFromTimeKey(entry.endTime)
        const breakMinutes =
          entry.isBreak && !Number.isNaN(startMin) && !Number.isNaN(endMin)
            ? Math.max(0, endMin - startMin)
            : 0

        await createTimesheetEntry(ts.id, {
          date: todayKey,
          startTime: entry.startTime,
          endTime: entry.endTime,
          breakMinutes,
          description: entry.description,
          billable: entry.billable,
        })
      }

      toast({
        title: 'Log saved',
        description: 'Your time entries have been saved. Entries are pending approval.',
      })
      setEntries([getDefaultEntry(currentNowTime, validEntries[validEntries.length - 1]?.endTime)])
      const latest = await getTimesheets({ workDate: todayKey, limit: 5 })
      const own = (latest.data || []).find((item) => item.employeeId === user.id) || ts
      setExistingTodayTimesheet(own)
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to save timesheet'
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const longToday = formatLongDateFromYmd(todayKey)

  const actionButtons = (
    <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:justify-end sm:gap-3">
      <Link href="/timesheets">
        <Button variant="outline" type="button" disabled={loading}>
          Cancel
        </Button>
      </Link>
      <Button
        type="button"
        variant="secondary"
        disabled={loading || totalHours === 0 || hasErrors}
        onClick={runAction}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving…
          </>
        ) : (
          <>
            <Save className="mr-2 h-4 w-4" />
            Save log
          </>
        )}
      </Button>
    </div>
  )

  return (
    <div className="space-y-6 max-w-3xl pb-28 md:pb-8">
      <Breadcrumb />
      <TimesheetsSubNav />

      <div className="flex items-start gap-4">
        <Link href="/timesheets">
          <Button variant="ghost" size="icon" className="shrink-0 mt-0.5">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="min-w-0 space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Log today&apos;s hours</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Submit one daily timesheet for your work done today.
          </p>
          {existingTodayTimesheet && (
            <p className="text-xs text-muted-foreground">
              Today&apos;s sheet: <span className="font-medium">{existingTodayTimesheet.totalHours}h</span> logged.
            </p>
          )}
        </div>
      </div>

      <section
        className="rounded-xl border bg-card px-5 py-5 shadow-sm"
        aria-labelledby="today-heading"
      >
        <p id="today-heading" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Today
        </p>
        <p className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl">{longToday}</p>
        <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4 shrink-0" aria-hidden />
          <span>Date: {longToday}</span>
        </p>
      </section>

      <Card>
        <CardHeader className="space-y-1 pb-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle>Time blocks</CardTitle>
              <CardDescription>
                Each block is for today only. Add another if you split your day (e.g. morning and afternoon).
              </CardDescription>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Today total
              </p>
              <p className="text-2xl font-bold tabular-nums">{totalHours.toFixed(1)}h</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-5">
            {entries.map((entry, index) => (
              <div
                key={index}
                className="space-y-4 rounded-lg border p-4 shadow-sm"
              >
                <div className="flex items-center justify-between gap-2">
                  <Badge variant={entry.isBreak ? 'outline' : 'secondary'} className="font-normal">
                    {entry.isBreak ? `Break block ${index + 1}` : `Time block ${index + 1}`}
                  </Badge>
                  <div className="flex items-center gap-1">
                    {!entry.isBreak && (
                      <Button type="button" variant="outline" size="sm" onClick={() => addBreakAfterEntry(index)}>
                        Add 30m break
                      </Button>
                    )}
                    {entries.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => removeEntry(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Remove block</span>
                      </Button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor={`start-${index}`}>Start *</Label>
                    <Input
                      id={`start-${index}`}
                      type="time"
                      value={entry.startTime}
                      onChange={(e) => updateEntry(index, 'startTime', e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`end-${index}`}>End *</Label>
                    <Input
                      id={`end-${index}`}
                      type="time"
                      value={entry.endTime}
                      onChange={(e) => updateEntry(index, 'endTime', e.target.value)}
                      max={currentNowTime}
                      required
                    />
                  </div>
                </div>
                {entryErrors[index].length > 0 && (
                  <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                    {entryErrors[index][0]}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor={`desc-${index}`}>Description</Label>
                  <Textarea
                    id={`desc-${index}`}
                    value={entry.description}
                    onChange={(e) => updateEntry(index, 'description', e.target.value)}
                    placeholder={entry.isBreak ? 'Break notes (optional)' : 'What did you work on?'}
                    rows={2}
                  />
                </div>

                <div className="flex flex-wrap items-center gap-3 border-t pt-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id={`billable-${index}`}
                      checked={entry.billable}
                      onChange={(e) => updateEntry(index, 'billable', e.target.checked)}
                      className="h-4 w-4 rounded border-input"
                    />
                    <Label htmlFor={`billable-${index}`} className="text-sm font-normal">
                      Billable
                    </Label>
                  </div>
                  <span className="ml-auto text-sm tabular-nums text-muted-foreground">
                    Block: <span className="font-medium text-foreground">{calculateHours(entry).toFixed(1)}h</span>
                  </span>
                </div>
              </div>
            ))}
          </div>

          <Button type="button" variant="outline" onClick={addEntry} className="w-full">
            <Plus className="mr-2 h-4 w-4" />
            Add another block for today
          </Button>
        </CardContent>

        <div className="hidden flex-col gap-4 border-t p-6 sm:flex sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{totalHours.toFixed(1)}h</span> logged for today
          </p>
          {actionButtons}
        </div>
      </Card>

      {/* Mobile sticky summary */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 p-4 shadow-[0_-4px_24px_rgba(0,0,0,0.08)] backdrop-blur md:hidden pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto flex max-w-3xl flex-col gap-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Today total</span>
            <span className="text-lg font-bold tabular-nums">{totalHours.toFixed(1)}h</span>
          </div>
          <div className="flex flex-col gap-2">{actionButtons}</div>
        </div>
      </div>
    </div>
  )
}
