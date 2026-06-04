'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/context/auth-context'
import { Breadcrumb } from '@/components/layout/breadcrumb'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { canEditCourse } from '@/lib/permissions'
import { ArrowLeft, Save, Loader2, Tag } from 'lucide-react'
import Link from 'next/link'
import { getCourseById, updateCourse } from '@/lib/api/courses'
import { useToast } from '@/components/ui/toast'
import type { Course } from '@/types/course'
import { z } from 'zod'

const courseSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  code: z.string().min(1, 'Code is required'),
  description: z.string().optional(),
  durationWeeks: z.coerce.number().min(1, 'Duration must be at least 1 week'),
  defaultFee: z.coerce.number().min(0, 'Fee must be positive'),
  category: z.string().min(1, 'Category is required'),
  status: z.enum(['active', 'inactive', 'archived']),
})

const CATEGORIES = [
  { value: 'cyber_security', label: 'Cyber Security' },
  { value: 'ai_ml', label: 'AI/ML' },
  { value: 'certification', label: 'Certification' },
  { value: 'cloud', label: 'Cloud' },
  { value: 'network', label: 'Network' },
  { value: 'other', label: 'Other' },
]

const STATUSES = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'archived', label: 'Archived' },
]

export default function EditCoursePage() {
  const router = useRouter()
  const params = useParams()
  const courseId = params.id as string
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [course, setCourse] = useState<Course | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    durationWeeks: '12',
    defaultFee: '0',
    category: 'cyber_security',
    status: 'active',
  })

  useEffect(() => {
    loadCourse()
  }, [courseId])

  const loadCourse = async () => {
    try {
      setLoading(true)
      const res = await getCourseById(courseId)
      setCourse(res.data)
      setFormData({
        name: res.data.name,
        code: res.data.code,
        description: res.data.description || '',
        durationWeeks: String(res.data.durationWeeks),
        defaultFee: String(res.data.defaultFee),
        category: res.data.category,
        status: res.data.status,
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load course',
        variant: 'destructive',
      })
      router.push('/courses')
    } finally {
      setLoading(false)
    }
  }

  if (!user || !canEditCourse(user)) {
    return (
      <div className="space-y-6">
        <Breadcrumb />
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">You don&apos;t have permission to edit courses.</p>
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    try {
      const validated = courseSchema.parse(formData)
      setSaving(true)
      await updateCourse(courseId, {
        name: validated.name,
        code: validated.code,
        description: validated.description,
        durationWeeks: validated.durationWeeks,
        defaultFee: validated.defaultFee,
        category: validated.category as any,
        status: validated.status,
      })
      toast({
        title: 'Course updated',
        description: `"${validated.name}" has been updated successfully.`,
      })
      router.push('/courses')
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {}
        error.errors.forEach(err => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as string] = err.message
          }
        })
        setErrors(fieldErrors)
      } else {
        toast({
          title: 'Error',
          description: 'Failed to update course',
          variant: 'destructive',
        })
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <Breadcrumb />
      
      <div className="flex items-center gap-4">
        <Link href="/courses">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Edit Course</h1>
          <p className="text-muted-foreground">{course?.name}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Course Details</CardTitle>
            <CardDescription>Update course information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Course Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
                {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="code">Course Code *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                />
                {errors.code && <p className="text-sm text-red-500">{errors.code}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="durationWeeks">Duration (weeks) *</Label>
                <Input
                  id="durationWeeks"
                  type="number"
                  min="1"
                  value={formData.durationWeeks}
                  onChange={(e) => setFormData({ ...formData, durationWeeks: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="defaultFee">Default Fee (₹) *</Label>
                <Input
                  id="defaultFee"
                  type="number"
                  min="0"
                  value={formData.defaultFee}
                  onChange={(e) => setFormData({ ...formData, defaultFee: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <Select
                  id="status"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  {STATUSES.map((st) => (
                    <option key={st.value} value={st.value}>{st.label}</option>
                  ))}
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4 mt-6">
          <Link href="/courses">
            <Button type="button" variant="outline">Cancel</Button>
          </Link>
          <Button type="submit" disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}