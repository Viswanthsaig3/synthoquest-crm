'use client'

import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Loader2 } from 'lucide-react'

const addPaymentSchema = z.object({
  amount: z.coerce.number().min(1, 'Amount must be greater than 0'),
  paymentMethod: z.enum(['cash', 'upi', 'bank_transfer', 'card', 'cheque']),
  paymentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  receiptNumber: z.string().max(100).optional(),
  notes: z.string().max(500).optional(),
})

type AddPaymentFormData = z.infer<typeof addPaymentSchema>

interface AddStudentPaymentModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: AddPaymentFormData) => Promise<void>
  remainingBalance: number
}

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'upi', label: 'UPI' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'card', label: 'Card' },
  { value: 'cheque', label: 'Cheque' },
]

export default function AddStudentPaymentModal({ open, onClose, onSubmit, remainingBalance }: AddStudentPaymentModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<AddPaymentFormData>({
    resolver: zodResolver(addPaymentSchema),
    defaultValues: {
      amount: 0,
      paymentMethod: 'cash',
      paymentDate: new Date().toISOString().split('T')[0],
      receiptNumber: '',
      notes: '',
    },
  })

  React.useEffect(() => {
    if (open) {
      setValue('paymentDate', new Date().toISOString().split('T')[0])
    }
  }, [open, setValue])

  const handleFormSubmit = async (data: AddPaymentFormData) => {
    await onSubmit(data)
    reset()
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
          <DialogDescription>
            Add a payment record for this enrollment. Remaining balance: ₹{remainingBalance.toLocaleString()}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount *</Label>
            <Input
              id="amount"
              type="number"
              min="1"
              {...register('amount')}
              placeholder="Enter payment amount"
            />
            {errors.amount && <p className="text-sm text-red-500">{errors.amount.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="paymentMethod">Payment Method *</Label>
              <Select id="paymentMethod" {...register('paymentMethod')}>
                {PAYMENT_METHODS.map((method) => (
                  <option key={method.value} value={method.value}>
                    {method.label}
                  </option>
                ))}
              </Select>
              {errors.paymentMethod && <p className="text-sm text-red-500">{errors.paymentMethod.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentDate">Payment Date</Label>
              <Input id="paymentDate" type="date" {...register('paymentDate')} />
              {errors.paymentDate && <p className="text-sm text-red-500">{errors.paymentDate.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="receiptNumber">Receipt Number</Label>
            <Input id="receiptNumber" {...register('receiptNumber')} placeholder="Optional receipt/reference number" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <textarea
              id="notes"
              {...register('notes')}
              rows={2}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder="Optional notes about this payment"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" type="button" onClick={handleClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Recording...
                </>
              ) : (
                'Record Payment'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}