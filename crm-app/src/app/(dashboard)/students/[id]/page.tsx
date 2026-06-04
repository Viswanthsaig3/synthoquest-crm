'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/context/auth-context'
import { Breadcrumb } from '@/components/layout/breadcrumb'
import { EmptyState } from '@/components/shared'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

import { formatDate, getInitials, formatCurrency } from '@/lib/utils'
import { canEditStudent, canEnrollStudent, canManageStudentPayments } from '@/lib/permissions'
import {
  User as UserIcon,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  GraduationCap,
  BookOpen,
  IndianRupee,
  FileText,
  Building,
  Edit,
  Plus,
  Loader2,
} from 'lucide-react'
import Link from 'next/link'
import { getStudentById } from '@/lib/api/students'
import { useToast } from '@/components/ui/toast'
import StudentPaymentHistoryCard from '@/components/students/payment-history-card'
import type { Student, Enrollment } from '@/types/student'

export default function StudentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [student, setStudent] = useState<Student | null>(null)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    loadStudent()
  }, [params.id])

  const loadStudent = async () => {
    try {
      setLoading(true)
      const res = await getStudentById(params.id as string)
      setStudent(res.data)
      // Auto-switch to enrollments tab if there are enrollments with dues
      if (res.data?.enrollments?.some(e => e.remainingBalance > 0)) {
        setActiveTab('enrollments')
      }
    } catch (error) {
      console.error('Failed to load student:', error)
      toast({ title: 'Error', description: 'Failed to load student', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  if (!user) return null

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
        <EmptyState
          icon={GraduationCap}
          title="Student not found"
          description="The student you're looking for doesn't exist."
        />
      </div>
    )
  }

  const canEdit = canEditStudent(user)
  const canEnroll = canEnrollStudent(user)
  const canManagePayments = canManageStudentPayments(user)

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-green-100 text-green-800',
      completed: 'bg-blue-100 text-blue-800',
      dropped: 'bg-red-100 text-red-800',
      on_hold: 'bg-orange-100 text-orange-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getEnrollmentStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      enrolled: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-green-100 text-green-800',
      completed: 'bg-purple-100 text-purple-800',
      dropped: 'bg-red-100 text-red-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const hasDueBalance = student.enrollments.some(e => e.remainingBalance > 0)

  return (
    <div className="space-y-6">
      <Breadcrumb />

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${student.name}`} />
            <AvatarFallback className="text-xl">{getInitials(student.name)}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold">{student.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge className={getStatusColor(student.status)}>
                {student.status.replace('_', ' ')}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {student.college && `${student.college} • `}
                {student.graduationYear && `Class of ${student.graduationYear}`}
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {canEnroll && (
            <Link href={`/students/${student.id}/enroll`}>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Enroll in Course
              </Button>
            </Link>
          )}
          {canEdit && (
            <Link href={`/students/${student.id}/edit`}>
              <Button variant="outline">
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Paid</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(student.totalPaid)}</div>
          </CardContent>
        </Card>
        <Card className={hasDueBalance ? 'border-red-200 bg-red-50/50' : ''}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Due Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${hasDueBalance ? 'text-red-600' : 'text-green-600'}`}>
              {formatCurrency(student.totalDue)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Courses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {student.enrollments.filter((e: Enrollment) => e.status === 'in_progress' || e.status === 'enrolled').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {student.enrollments.filter((e: Enrollment) => e.status === 'completed').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {hasDueBalance && canManagePayments && (
        <Card className="border-orange-200 bg-orange-50/30">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <IndianRupee className="h-5 w-5 text-orange-600" />
                <span className="font-medium text-orange-700">
                  Payment Pending: {formatCurrency(student.totalDue)} outstanding across {student.enrollments.filter(e => e.remainingBalance > 0).length} enrollment(s)
                </span>
              </div>
              <Button onClick={() => setActiveTab('enrollments')} variant="outline">
                View Details
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="enrollments">
            Enrollments ({student.enrollments.length})
            {hasDueBalance && (
              <Badge variant="destructive" className="ml-1 h-5 px-1.5">
                {formatCurrency(student.totalDue)}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserIcon className="h-5 w-5" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{student.email}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{student.phone}</span>
                </div>
                {student.alternatePhone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{student.alternatePhone} (Alt)</span>
                  </div>
                )}
                {student.qualification && (
                  <div className="flex items-center gap-3">
                    <GraduationCap className="h-4 w-4 text-muted-foreground" />
                    <span>{student.qualification}</span>
                  </div>
                )}
                {student.college && (
                  <div className="flex items-center gap-3">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <span>{student.college}</span>
                    {student.graduationYear && <span className="text-muted-foreground">({student.graduationYear})</span>}
                  </div>
                )}
                {student.studentType && (
                  <div className="flex items-center gap-3">
                    <GraduationCap className="h-4 w-4 text-muted-foreground" />
                    <Badge variant="outline">
                      {student.studentType === 'current' ? 'Current Student' : 'Passed Out'}
                    </Badge>
                  </div>
                )}
                {student.occupation && (
                  <div className="flex items-center gap-3">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                    <span>{student.occupation}</span>
                    {student.company && <span className="text-muted-foreground">at {student.company}</span>}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Additional Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Source</span>
                  <Badge variant="outline" className="capitalize">
                    {student.source}
                  </Badge>
                </div>
                {student.address && (
                  <div className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p>{student.address}</p>
                      <p className="text-muted-foreground">{student.city}, {student.state} {student.pincode}</p>
                    </div>
                  </div>
                )}
                {student.notes && (
                  <div className="pt-2 border-t">
                    <p className="text-sm text-muted-foreground mb-1">Notes</p>
                    <p className="text-sm">{student.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="enrollments" className="space-y-4">
          {student.enrollments.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="No enrollments"
              description="This student is not enrolled in any courses yet."
              action={canEnroll ? { label: 'Enroll Now', onClick: () => router.push(`/students/${student.id}/enroll`) } : undefined}
            />
          ) : (
            <div className="space-y-6">
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Course</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Progress</TableHead>
                        <TableHead>Total Fee</TableHead>
                        <TableHead>Paid</TableHead>
                        <TableHead>Due</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {student.enrollments.map((enrollment: Enrollment) => (
                        <TableRow key={enrollment.id} className={enrollment.remainingBalance > 0 ? 'bg-orange-50/50' : ''}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{enrollment.courseName}</p>
                              {enrollment.courseCode && (
                                <p className="text-xs text-muted-foreground">{enrollment.courseCode}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getEnrollmentStatusColor(enrollment.status)}>
                              {enrollment.status.replace('_', ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Progress value={enrollment.progress} className="w-16" />
                              <span className="text-sm">{enrollment.progress}%</span>
                            </div>
                          </TableCell>
                          <TableCell>{formatCurrency(enrollment.totalFee)}</TableCell>
                          <TableCell className="text-green-600">{formatCurrency(enrollment.paidAmount)}</TableCell>
                          <TableCell className={enrollment.remainingBalance > 0 ? 'text-red-600 font-medium' : 'text-green-600'}>
                            {formatCurrency(enrollment.remainingBalance)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Show payment card for each enrollment with dues */}
              {student.enrollments.map((enrollment: Enrollment) => (
                <StudentPaymentHistoryCard
                  key={enrollment.id}
                  studentId={student.id}
                  enrollmentId={enrollment.id}
                  onPaymentUpdate={loadStudent}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}