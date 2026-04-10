'use client'

import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
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
import { Select } from '@/components/ui/select'
import { useToast } from '@/components/ui/toast'
import type { Intern } from '@/types/intern'
import { UserCheck, Loader2, Briefcase } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

const conversionSchema = z.object({
  position: z.string().min(1, 'Position is required'),
  department: z.string().min(1, 'Department is required'),
  salary: z.coerce.number().min(0, 'Salary must be non-negative').optional(),
  startDate: z.string().optional(),
  notes: z.string().max(500).optional(),
})

type ConversionFormData = z.infer<typeof conversionSchema>

const DEPARTMENT_OPTIONS = [
  { value: 'training', label: 'Training' },
  { value: 'sales', label: 'Sales' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'content', label: 'Content Development' },
]

interface ConvertToEmployeeModalProps {
  intern: Intern
  open: boolean
  onClose: () => void
  onComplete: (employeeId: string) => void
}

export function ConvertToEmployeeModal({
  intern,
  open,
  onClose,
  onComplete,
}: ConvertToEmployeeModalProps) {
  const { toast } = useToast()
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ConversionFormData>({
    resolver: zodResolver(conversionSchema),
    defaultValues: {
      position: '',
      department: intern.department,
      salary: intern.stipend || undefined,
      startDate: new Date().toISOString().split('T')[0],
      notes: '',
    },
  })

  const salary = watch('salary')
  const currentStipend = intern.stipend || 0

  const onSubmit = async (data: ConversionFormData) => {
    try {
      const { convertInternToEmployee } = await import('@/lib/api/interns')
      const response = await convertInternToEmployee(intern.id, {
        position: data.position,
        department: data.department,
        salary: data.salary,
        startDate: data.startDate,
        notes: data.notes,
      })

      toast({
        title: 'Conversion successful',
        description: `${intern.name} has been converted to a full-time employee.`,
      })

      onComplete(response.data.id)
      onClose()
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to convert intern to employee'
      toast({
        title: 'Conversion failed',
        description: message,
        variant: 'destructive',
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md" showCloseButton>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-green-600" />
            Convert to Employee
          </DialogTitle>
          <DialogDescription>
            Convert {intern.name} from intern to full-time employee
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="p-3 bg-muted rounded-lg space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Name</span>
              <span className="font-medium">{intern.name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Current Status</span>
              <span className="capitalize">{intern.status}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Department</span>
              <span className="capitalize">{intern.department}</span>
            </div>
            {intern.stipend && intern.stipend > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Current Stipend</span>
                <span className="font-medium text-green-600">
                  {formatCurrency(intern.stipend)}/month
                </span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="position">Position/Role *</Label>
            <Input
              id="position"
              {...register('position')}
              placeholder="e.g., Junior Developer, Sales Executive"
            />
            {errors.position && <p className="text-sm text-red-500">{errors.position.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="department">Department *</Label>
            <Select id="department" {...register('department')}>
              {DEPARTMENT_OPTIONS.map((dept) => (
                <option key={dept.value} value={dept.value}>
                  {dept.label}
                </option>
              ))}
            </Select>
            {errors.department && <p className="text-sm text-red-500">{errors.department.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="salary">Salary (₹/month)</Label>
            <Input
              id="salary"
              type="number"
              step="1000"
              {...register('salary')}
              placeholder="Enter monthly salary"
            />
            {currentStipend > 0 && salary !== undefined && salary > currentStipend && (
              <p className="text-sm text-green-600">
                ↑ {formatCurrency(salary - currentStipend)} increase from stipend
              </p>
            )}
            {errors.salary && <p className="text-sm text-red-500">{errors.salary.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="startDate">Start Date</Label>
            <Input id="startDate" type="date" {...register('startDate')} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes</Label>
            <textarea
              id="notes"
              {...register('notes')}
              rows={2}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder="Any notes about this conversion..."
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-green-600 hover:bg-green-700">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Converting...
                </>
              ) : (
                <>
                  <UserCheck className="mr-2 h-4 w-4" />
                  Convert to Employee
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}