'use client'

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Lead } from '@/types/lead'
import { mockBatches } from '@/lib/mock-data'
import { COURSES, COURSE_FEES, PAYMENT_METHODS, PAYMENT_PLANS } from '@/lib/constants'
import { formatCurrency } from '@/lib/utils'
import { CheckCircle, GraduationCap, IndianRupee, Loader2 } from 'lucide-react'

interface ConversionModalProps {
  lead: Lead
  converterId: string
  converterName: string
  onClose: () => void
  onComplete: (studentId: string) => void
}

export function ConversionModal({ lead, converterId, converterName, onClose, onComplete }: ConversionModalProps) {
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    batchId: '',
    paymentPlan: 'full' as 'full' | 'installment',
    initialPayment: '',
    paymentMethod: 'upi',
    discount: '0',
    notes: '',
  })

  const course = COURSES.find(c => c === lead.courseInterested)
  const baseFee = lead.courseInterested ? (COURSE_FEES[lead.courseInterested] || 0) : 0
  const availableBatches = mockBatches.filter(b => 
    b.courseName === lead.courseInterested && 
    b.status !== 'completed' && 
    b.availableSeats > 0
  )

  const selectedBatch = mockBatches.find(b => b.id === formData.batchId)
  const discount = parseInt(formData.discount) || 0
  const totalFee = baseFee - discount
  const initialPayment = formData.paymentPlan === 'full' 
    ? totalFee 
    : parseInt(formData.initialPayment) || Math.round(totalFee / 2)

  const handleSubmit = async () => {
    setLoading(true)
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    const studentId = `stu_${Date.now()}`
    setLoading(false)
    onComplete(studentId)
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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
                  <p className="text-sm text-muted-foreground">{lead.email} • {lead.phone}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{lead.courseInterested}</Badge>
                <span className="text-lg font-bold text-primary">{formatCurrency(baseFee)}</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Select Batch *</Label>
              {availableBatches.length === 0 ? (
                <div className="p-4 border rounded-lg text-center text-muted-foreground">
                  No available batches for this course. Create a batch first.
                </div>
              ) : (
                <div className="space-y-2">
                  {availableBatches.map(batch => (
                    <div
                      key={batch.id}
                      onClick={() => setFormData({ ...formData, batchId: batch.id })}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        formData.batchId === batch.id ? 'border-primary bg-primary/5' : 'hover:border-gray-400'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{batch.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {batch.mode} • {batch.instructorName}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm">{batch.availableSeats} seats left</p>
                          <p className="text-xs text-muted-foreground">
                            Starts {new Date(batch.startDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
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
                <div
                  onClick={() => setFormData({ ...formData, paymentPlan: 'full' })}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    formData.paymentPlan === 'full' ? 'border-primary bg-primary/5' : 'hover:border-gray-400'
                  }`}
                >
                  <p className="font-medium">Full Payment</p>
                  <p className="text-sm text-muted-foreground">{formatCurrency(totalFee)}</p>
                </div>
                <div
                  onClick={() => setFormData({ ...formData, paymentPlan: 'installment' })}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    formData.paymentPlan === 'installment' ? 'border-primary bg-primary/5' : 'hover:border-gray-400'
                  }`}
                >
                  <p className="font-medium">Installment</p>
                  <p className="text-sm text-muted-foreground">Pay in parts</p>
                </div>
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
                  <option key={m.value} value={m.value}>{m.label}</option>
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
                  <span>{selectedBatch?.name}</span>
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
              disabled={step === 1 && !formData.batchId}
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