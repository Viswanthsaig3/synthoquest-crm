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
import { LEAD_SOURCES } from '@/lib/constants'
import { canEditStudent } from '@/lib/permissions'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { getStudentById, updateStudent } from '@/lib/api/students'
import { useToast } from '@/components/ui/toast'
import { AutocompleteInput } from '@/components/ui/autocomplete-input'
import type { Student } from '@/types/student'

const STUDENT_TYPES = [
  { value: 'current', label: 'Current Student' },
  { value: 'passed_out', label: 'Passed Out' },
]

export default function EditStudentPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [student, setStudent] = useState<Student | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    alternatePhone: '',
    qualification: '',
    college: '',
    graduationYear: '',
    studentType: 'passed_out',
    occupation: '',
    company: '',
    experience: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    source: 'organic',
    notes: '',
  })

  useEffect(() => {
    loadStudent()
  }, [params.id])

  const loadStudent = async () => {
    try {
      setLoading(true)
      const res = await getStudentById(params.id as string)
      setStudent(res.data)
      if (res.data) {
        setFormData({
          name: res.data.name,
          email: res.data.email,
          phone: res.data.phone,
          alternatePhone: res.data.alternatePhone || '',
          qualification: res.data.qualification || '',
          college: res.data.college || '',
          graduationYear: res.data.graduationYear || '',
          studentType: res.data.studentType || 'passed_out',
          occupation: res.data.occupation || '',
          company: res.data.company || '',
          experience: res.data.experience || '',
          address: res.data.address || '',
          city: res.data.city || '',
          state: res.data.state || '',
          pincode: res.data.pincode || '',
          source: res.data.source,
          notes: res.data.notes || '',
        })
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load student', variant: 'destructive' })
      router.push('/students')
    } finally {
      setLoading(false)
    }
  }

  if (!user || !canEditStudent(user)) {
    return (
      <div className="space-y-6">
        <Breadcrumb />
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">You don&apos;t have permission to edit students.</p>
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

  if (!student) {
    return (
      <div className="space-y-6">
        <Breadcrumb />
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Student not found.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      await updateStudent(student.id, {
        ...formData,
        studentType: formData.studentType as 'current' | 'passed_out',
      })
      toast({ title: 'Student updated', description: `${formData.name} has been updated.` })
      router.push(`/students/${student.id}`)
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to update student', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <Breadcrumb />

      <div className="flex items-center gap-4">
        <Link href={`/students/${student.id}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Edit Student</h1>
          <p className="text-muted-foreground">{student.name}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Update student details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone *</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="alternatePhone">Alternate Phone</Label>
                  <Input
                    id="alternatePhone"
                    value={formData.alternatePhone}
                    onChange={(e) => setFormData({ ...formData, alternatePhone: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="qualification">Highest Qualification</Label>
                <AutocompleteInput
                  id="qualification"
                  value={formData.qualification}
                  onChange={(val) => setFormData({ ...formData, qualification: val })}
                  fieldType="qualification"
                  placeholder="e.g., B.Tech, B.Sc"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="college">College / University</Label>
                <AutocompleteInput
                  id="college"
                  value={formData.college}
                  onChange={(val) => setFormData({ ...formData, college: val })}
                  fieldType="college"
                  placeholder="e.g., JNTU Hyderabad"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="graduationYear">Graduation Year</Label>
                  <Input
                    id="graduationYear"
                    value={formData.graduationYear}
                    onChange={(e) => setFormData({ ...formData, graduationYear: e.target.value })}
                    placeholder="e.g., 2024"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="studentType">Student Type</Label>
                  <select
                    id="studentType"
                    value={formData.studentType}
                    onChange={(e) => setFormData({ ...formData, studentType: e.target.value })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    {STUDENT_TYPES.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="occupation">Occupation</Label>
                  <AutocompleteInput
                    id="occupation"
                    value={formData.occupation}
                    onChange={(val) => setFormData({ ...formData, occupation: val })}
                    fieldType="occupation"
                  />
</div>
                 <div className="space-y-2">
                   <Label htmlFor="company">Company</Label>
                   <AutocompleteInput
                     id="company"
                     value={formData.company}
                     onChange={(val) => setFormData({ ...formData, company: val })}
                     fieldType="company"
                   />
                 </div>
               </div>

              <div className="space-y-2">
                <Label htmlFor="experience">Years of Experience</Label>
                <Input
                  id="experience"
                  value={formData.experience}
                  onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                  placeholder="e.g., 3 years, Fresher"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Address & Additional Info</CardTitle>
              <CardDescription>Location and source details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pincode">Pincode</Label>
                  <Input
                    id="pincode"
                    value={formData.pincode}
                    onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="source">Source</Label>
                <select
                  id="source"
                  value={formData.source}
                  onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {LEAD_SOURCES.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-4 mt-6">
          <Link href={`/students/${student.id}`}>
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