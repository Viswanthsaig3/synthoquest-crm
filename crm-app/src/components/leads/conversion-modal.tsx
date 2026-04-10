'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/toast'
import type { Lead } from '@/lib/db/queries/leads'
import { COURSES, COURSE_FEES, PAYMENT_METHODS } from '@/lib/constants'
import { formatCurrency, getErrorMessage } from '@/lib/utils'
import { getBatchesForCourse, type BatchListItem } from '@/lib/api/batches'
import { updateLead } from '@/lib/api/leads'
import { CheckCircle, GraduationCap, IndianRupee, Loader2 } from 'lucide-react'

interface ConversionModalProps {
  lead: Lead
  converterId: string
  converterName: string
  onClose: () => void
  onComplete: (studentId: string) => void
}

export function ConversionModal({
  lead,
  converterId: _converterId,
  converterName,
  onClose,
  onComplete,
}: ConversionModalProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [batchLoading, setBatchLoading] = useState(true)
  const [batches, setBatches] = useState<BatchListItem[]>([])
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    batchId: '',
    paymentPlan: 'full' as 'full' | 'installment',
    initialPayment: '',
    paymentMethod: 'upi',
    discount: '0',
    notes: '',
  })

  const courseName = lead.courseInterested || ''
  const baseFee = courseName ? COURSE_FEES[courseName] || 0 : 0

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!courseName || !COURSES.includes(courseName)) {
        setBatches([])
        setBatchLoading(false)
        return
      }
      try {
        setBatchLoading(true)
        const res = await getBatchesForCourse(courseName)
        if (!cancelled) setBatches(res.data || [])
      } catch (e: unknown) {
        if (!cancelled) {
          console.error(e)
          toast({
            title: 'Could not load batches',
            description: getErrorMessage(e, 'Try again or create a batch for this course.'),
            variant: 'destructive',
          })
          setBatches([])
        }
      } finally {
        if (!cancelled) setBatchLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [courseName, toast])

  const availableBatches = batches.filter((b) => b.availableSeats > 0)
  const selectedBatch = batches.find((b) => b.id === formData.batchId)
  const discount = parseInt(formData.discount, 10) || 0
  const totalFee = Math.max(0, baseFee - discount)
  const initialPayment =
    formData.paymentPlan === 'full'
      ? totalFee
      : parseInt(formData.initialPayment, 10) || Math.round(totalFee / 2)

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const summary = [
        `Converted by ${converterName}`,
        selectedBatch ? `Batch: ${selectedBatch.name}` : '',
        `Total: ${formatCurrency(totalFee)}`,
        `Initial payment: ${formatCurrency(initialPayment)}`,
        formData.notes ? `Notes: ${formData.notes}` : '',
      ]
        .filter(Boolean)
        .join('\n')

      await updateLead(lead.id, {
        status: 'converted',
        notes: [lead.notes, summary].filter(Boolean).join('\n\n---\n\n'),
      })

      toast({
        title: 'Lead converted',
        description: 'The lead is marked as converted.',
      })
      onComplete(lead.id)
    } catch (e: unknown) {
      toast({
        title: 'Conversion failed',
        description: getErrorMessage(e, 'Could not update lead.'),
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" showCloseButton>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Convert Lead to Student
          </DialogTitle>
          <DialogDescription>
            Enroll {lead.name} in {lead.courseInterested}
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2 py-2">
          <div className={`flex-1 h-2 rounded-full ${step >= 1 ? 'bg-green-500' : 'bg-gray-200'}`} />
          <div className={`flex-1 h-2 rounded-full ${step >= 2 ? 'bg-green-500' : 'bg-gray-200'}`} />
          <div className={`flex-1 h-2 rounded-full ${step >= 3 ? 'bg-green-500' : 'bg-gray-200'}`} />
        </div>

        {step === 1 && (
          <div className="space-y-4 py-4">
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-3 mb-3">
                <GraduationCap className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">{lead.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {lead.email} • {lead.phone}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{lead.courseInterested}</Badge>
                <span className="text-lg font-bold text-primary">{formatCurrency(baseFee)}</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Select Batch *</Label>
              {batchLoading ? (
                <div className="flex items-center gap-2 p-4 border rounded-lg text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading batches…
                </div>
              ) : availableBatches.length === 0 ? (
                <div className="p-4 border rounded-lg text-center text-muted-foreground space-y-2">
                  <p>No open batches with seats for this course.</p>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/batches">Go to Batches</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {availableBatches.map((batch) => (
                    <button
                      key={batch.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, batchId: batch.id })}
                      className={`w-full text-left p-3 border rounded-lg transition-colors ${
                        formData.batchId === batch.id
                          ? 'border-primary bg-primary/5'
                          : 'hover:border-muted-foreground/40'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className="font-medium">{batch.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {batch.mode} • {batch.instructorName || 'TBD'}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm">{batch.availableSeats} seats left</p>
                          <p className="text-xs text-muted-foreground">
                            {batch.startDate
                              ? `Starts ${new Date(batch.startDate).toLocaleDateString()}`
                              : 'Start TBD'}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Discount (₹)</Label>
              <Input
                type="number"
                value={formData.discount}
                onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                placeholder="Enter discount amount"
              />
            </div>

            <div className="space-y-2">
              <Label>Payment Plan</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, paymentPlan: 'full' })}
                  className={`p-3 border rounded-lg text-left transition-colors ${
                    formData.paymentPlan === 'full'
                      ? 'border-primary bg-primary/5'
                      : 'hover:border-muted-foreground/40'
                  }`}
                >
                  <p className="font-medium">Full Payment</p>
                  <p className="text-sm text-muted-foreground">{formatCurrency(totalFee)}</p>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, paymentPlan: 'installment' })}
                  className={`p-3 border rounded-lg text-left transition-colors ${
                    formData.paymentPlan === 'installment'
                      ? 'border-primary bg-primary/5'
                      : 'hover:border-muted-foreground/40'
                  }`}
                >
                  <p className="font-medium">Installment</p>
                  <p className="text-sm text-muted-foreground">Pay in parts</p>
                </button>
              </div>
            </div>

            {formData.paymentPlan === 'installment' && (
              <div className="space-y-2">
                <Label>Initial Payment (₹)</Label>
                <Input
                  type="number"
                  value={formData.initialPayment}
                  onChange={(e) => setFormData({ ...formData, initialPayment: e.target.value })}
                  placeholder={`Min: ${Math.round(totalFee / 3)}`}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>Payment Method</Label>
              <select
                value={formData.paymentMethod}
                onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {PAYMENT_METHODS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="p-4 bg-muted rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Course Fee</span>
                <span>{formatCurrency(baseFee)}</span>
              </div>
              {discount > 0 && (
                <div className="flex items-center justify-between text-green-600">
                  <span>Discount</span>
                  <span>-{formatCurrency(discount)}</span>
                </div>
              )}
              <div className="flex items-center justify-between font-bold pt-2 border-t">
                <span>Total Fee</span>
                <span>{formatCurrency(totalFee)}</span>
              </div>
              <div className="flex items-center justify-between text-green-600">
                <span>Initial Payment</span>
                <span>{formatCurrency(initialPayment)}</span>
              </div>
              {formData.paymentPlan === 'installment' && (
                <div className="flex items-center justify-between text-orange-600">
                  <span>Remaining Due</span>
                  <span>{formatCurrency(totalFee - initialPayment)}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4 py-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="font-medium text-green-800 mb-2">Conversion Summary</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Student</span>
                  <span className="font-medium">{lead.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Course</span>
                  <span>{lead.courseInterested}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Batch</span>
                  <span>{selectedBatch?.name ?? '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Fee</span>
                  <span className="font-medium">{formatCurrency(totalFee)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Initial Payment</span>
                  <span className="font-medium text-green-600">{formatCurrency(initialPayment)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Payment Method</span>
                  <span className="capitalize">{formData.paymentMethod.replace('_', ' ')}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Additional Notes</Label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="Any special notes about this enrollment..."
              />
            </div>
          </div>
        )}

        <DialogFooter>
          {step > 1 && (
            <Button variant="outline" onClick={() => setStep(step - 1)}>
              Back
            </Button>
          )}
          {step < 3 ? (
            <Button
              onClick={() => setStep(step + 1)}
              disabled={step === 1 && (!formData.batchId || batchLoading)}
            >
              Continue
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Converting...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Complete Conversion
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
