'use client'

import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/toast'
import { Loader2, AlertCircle, Clock } from 'lucide-react'
import type { AttendanceRecord, AdjustmentType } from '@/types/time-entry'
import { formatTime } from '@/lib/utils'
import { getAccessToken } from '@/lib/api/client'

interface AttendanceAdjustmentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  record: AttendanceRecord | null
  userName?: string
  onSuccess: () => void
}

const ADJUSTMENT_TYPES: { value: AdjustmentType; label: string }[] = [
  { value: 'manual_correction', label: 'Manual Correction' },
  { value: 'auto_checkout_reversal', label: 'Reverse Auto-Checkout' },
  { value: 'time_added', label: 'Time Added' },
  { value: 'time_removed', label: 'Time Removed' },
  { value: 'status_change', label: 'Status Change' },
]

export function AttendanceAdjustmentModal({
  open,
  onOpenChange,
  record,
  userName,
  onSuccess,
}: AttendanceAdjustmentModalProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [fieldName, setFieldName] = useState<'check_in_time' | 'check_out_time' | 'total_hours' | 'status'>('check_out_time')
  const [newValue, setNewValue] = useState('')
  const [adjustmentReason, setAdjustmentReason] = useState('')
  const [adjustmentType, setAdjustmentType] = useState<AdjustmentType>('manual_correction')

  React.useEffect(() => {
    if (record && open) {
      if (record.autoCheckout) {
        setAdjustmentType('auto_checkout_reversal')
        setFieldName('check_out_time')
        if (record.checkOutTime) {
          setNewValue('')
        }
      } else {
        setAdjustmentType('manual_correction')
        setFieldName('check_out_time')
        setNewValue('')
      }
      setAdjustmentReason('')
    }
  }, [record, open])

  const handleSubmit = async () => {
    if (!record) return
    if (!adjustmentReason.trim() || adjustmentReason.length < 5) {
      toast({
        title: 'Error',
        description: 'Please provide a reason (at least 5 characters).',
        variant: 'destructive',
      })
      return
    }
    if (!newValue.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a new value.',
        variant: 'destructive',
      })
      return
    }

    try {
      setLoading(true)
      const token = getAccessToken()

      const response = await fetch(`/api/attendance/${record.id}/adjust`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fieldName,
          newValue,
          adjustmentReason,
          adjustmentType,
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Failed to adjust record')
      }

      toast({
        title: 'Record adjusted',
        description: 'Attendance record has been updated successfully.',
      })

      onSuccess()
      onOpenChange(false)
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to adjust record',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  if (!record) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Adjust Attendance Record</DialogTitle>
          <DialogDescription>
            {userName ? `${userName} - ` : ''}{record.date}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {record.autoCheckout && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-sm flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-orange-600 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-orange-700">Auto-checkout detected</p>
                <p className="text-orange-600">
                  Reason: {record.autoCheckoutReason?.replace(/_/g, ' ') || 'Unknown'}
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Check In</p>
              <p className="font-medium">
                {record.checkInTime ? formatTime(new Date(record.checkInTime)) : '—'}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Check Out</p>
              <p className="font-medium flex items-center gap-2">
                {record.checkOutTime ? formatTime(new Date(record.checkOutTime)) : '—'}
                {record.autoCheckout && (
                  <Badge variant="outline" className="text-xs">Auto</Badge>
                )}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Total Hours</p>
              <p className="font-medium">{record.totalHours?.toFixed(2) || '—'}h</p>
            </div>
            <div>
              <p className="text-muted-foreground">Status</p>
              <p className="font-medium capitalize">{record.status}</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="adjustmentType">Adjustment Type</Label>
            <Select
              value={adjustmentType}
              onChange={(e) => setAdjustmentType(e.target.value as AdjustmentType)}
            >
              {ADJUSTMENT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fieldName">Field to Adjust</Label>
            <Select
              value={fieldName}
              onChange={(e) => setFieldName(e.target.value as typeof fieldName)}
            >
              <option value="check_in_time">Check-in Time</option>
              <option value="check_out_time">Check-out Time</option>
              <option value="total_hours">Total Hours</option>
              <option value="status">Status</option>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="newValue">
              {fieldName === 'check_in_time' || fieldName === 'check_out_time' ? (
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  New Time (HH:MM, 24-hour format)
                </span>
              ) : fieldName === 'total_hours' ? (
                'New Total Hours'
              ) : (
                'New Status'
              )}
            </Label>
            {fieldName === 'status' ? (
              <Select value={newValue} onChange={(e) => setNewValue(e.target.value)}>
                <option value="">Select status</option>
                <option value="present">Present</option>
                <option value="late">Late</option>
                <option value="half_day">Half Day</option>
                <option value="absent">Absent</option>
              </Select>
            ) : (
              <Input
                id="newValue"
                type={fieldName === 'total_hours' ? 'number' : 'text'}
                step={fieldName === 'total_hours' ? '0.25' : undefined}
                placeholder={
                  fieldName === 'check_in_time' || fieldName === 'check_out_time'
                    ? '18:30'
                    : fieldName === 'total_hours'
                    ? '8.5'
                    : ''
                }
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
              />
            )}
            {fieldName === 'check_out_time' && record.autoCheckout && (
              <p className="text-xs text-muted-foreground">
                Enter the correct checkout time to reverse the auto-checkout.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Adjustment</Label>
            <Textarea
              id="reason"
              placeholder="Explain why this adjustment is being made..."
              value={adjustmentReason}
              onChange={(e) => setAdjustmentReason(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Adjustment'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}