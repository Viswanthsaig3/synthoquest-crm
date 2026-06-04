'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/context/auth-context'
import { Breadcrumb } from '@/components/layout/breadcrumb'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { canEnrollStudent } from '@/lib/permissions'
import { ArrowLeft, Save, Loader2, IndianRupee } from 'lucide-react'
import Link from 'next/link'
import { getCourses } from '@/lib/api/courses'
import { createEnrollment } from '@/lib/api/students'
import { useToast } from '@/components/ui/toast'
import type { Course } from '@/types/course'

export default function EnrollStudentPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [courses, setCourses] = useState<Course[]>([])
  const [formData, setFormData] = useState({
    courseId: '',
    courseFee: 0,
    discount: 0,
    totalFee: 0,
    paymentPlan: 'full',
    notes: '',
  })

  useEffect(() => {
    loadCourses()
  }, [])

  const loadCourses = async () => {
    try {
      setLoading(true)
      const res = await getCourses()
      setCourses(res.data)
      if (res.data.length > 0) {
        setFormData({
          courseId: res.data[0].id,
          courseFee: res.data[0].defaultFee,
          discount: 0,
          totalFee: res.data[0].defaultFee,
          paymentPlan: 'full',
          notes: '',
        })
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load courses', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  if (!user || !canEnrollStudent(user)) {
    return (
      <div className="space-y-6">
        <Breadcrumb />
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">You don&apos;t have permission to enroll students.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Breadcrumb />
        <Card>
          <CardContent className="py-12 text-center">
            <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
          </CardContent>
        </Card>
      </div>
    )
  }

  const handleCourseChange = (courseId: string) => {
    const course = courses.find(c => c.id === courseId)
    if (course) {
      const totalFee = course.defaultFee - formData.discount
      setFormData({
        ...formData,
        courseId,
        courseFee: course.defaultFee,
        totalFee: totalFee > 0 ? totalFee : 0,
      })
    }
  }

  const handleDiscountChange = (discount: number) => {
    const totalFee = formData.courseFee - discount
    setFormData({
      ...formData,
      discount,
      totalFee: totalFee > 0 ? totalFee : 0,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.courseId) {
      toast({ title: 'Error', description: 'Please select a course', variant: 'destructive' })
      return
    }

    if (formData.totalFee <= 0) {
      toast({ title: 'Error', description: 'Total fee must be greater than 0', variant: 'destructive' })
      return
    }

    setSaving(true)

    try {
      await createEnrollment(params.id as string, {
        studentId: params.id as string,
        courseId: formData.courseId,
        courseFee: formData.courseFee,
        discount: formData.discount,
        totalFee: formData.totalFee,
        paymentPlan: formData.paymentPlan as 'full' | 'installment',
        notes: formData.notes,
      })
      toast({ title: 'Student enrolled', description: 'Successfully enrolled in course.' })
      router.push(`/students/${params.id}`)
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to enroll student', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <Breadcrumb />

      <div className="flex items-center gap-4">
        <Link href={`/students/${params.id}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Enroll Student</h1>
          <p className="text-muted-foreground">Select course and set fee details</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Course Enrollment</CardTitle>
            <CardDescription>Choose a course and configure fee structure</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="courseId">Course *</Label>
              <select
                id="courseId"
                value={formData.courseId}
                onChange={(e) => handleCourseChange(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                required
              >
                <option value="">Select a course</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.name} ({course.code}) - ₹{course.defaultFee}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <Card className="border-dashed">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Course Fee</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formData.courseFee ? formatCurrency(formData.courseFee) : '₹0'}</div>
                </CardContent>
              </Card>
              <Card className="border-dashed">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Discount</CardTitle>
                </CardHeader>
                <CardContent>
                  <Input
                    type="number"
                    min="0"
                    max={formData.courseFee}
                    value={formData.discount}
                    onChange={(e) => handleDiscountChange(Number(e.target.value))}
                  />
                </CardContent>
              </Card>
            </div>

            <div className="space-y-2">
              <Label htmlFor="totalFee">Total Fee *</Label>
              <Input
                id="totalFee"
                type="number"
                min="1"
                value={formData.totalFee}
                onChange={(e) => setFormData({ ...formData, totalFee: Number(e.target.value) })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentPlan">Payment Plan</Label>
              <select
                id="paymentPlan"
                value={formData.paymentPlan}
                onChange={(e) => setFormData({ ...formData, paymentPlan: e.target.value })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="full">Full Payment</option>
                <option value="installment">Installment</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional enrollment notes"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4 mt-6">
          <Link href={`/students/${params.id}`}>
            <Button type="button" variant="outline">Cancel</Button>
          </Link>
          <Button type="submit" disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enrolling...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Enroll Student
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount)
}