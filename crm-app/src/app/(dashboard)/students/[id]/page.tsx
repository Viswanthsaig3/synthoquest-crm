'use client'

import React, { useState, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/context/auth-context'
import { Breadcrumb } from '@/components/layout/breadcrumb'
import { PageHeader, EmptyState } from '@/components/shared'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
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

import { STUDENT_STATUSES, ENROLLMENT_STATUSES, PAYMENT_METHODS } from '@/lib/constants'
import { formatDate, getInitials, formatCurrency } from '@/lib/utils'
import { canEditStudent, canEnrollStudent } from '@/lib/permissions'
import {
  User as UserIcon,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  GraduationCap,
  Calendar,
  BookOpen,
  IndianRupee,
  CreditCard,
  Award,
  FileText,
  Clock,
  Building,
  Edit,
  Plus,
  Download,
  ExternalLink,
} from 'lucide-react'
import Link from 'next/link'
import type { Student, Enrollment } from '@/types/student'
import type { Payment } from '@/types/payment'
import type { Certificate } from '@/types/certificate'
import type { User as EmployeeUser } from '@/types/user'

function getStudentDetailStub(): Student | null {
  return null
}

function getConvertedByUserStub(): EmployeeUser | null {
  return null
}

export default function StudentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('overview')

  const student = getStudentDetailStub()
  const payments: Payment[] = []
  const certificates: Certificate[] = []
  const convertedByUser = getConvertedByUserStub()

  if (!user || !student) {
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
                Student since {formatDate(student.convertedAt)}
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
            <Link href={`/students/${student.id}?edit=true`}>
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
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Due Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${student.totalDue > 0 ? 'text-red-600' : 'text-green-600'}`}>
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
            <CardTitle className="text-sm font-medium text-muted-foreground">Certificates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{certificates.length}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="enrollments">Enrollments ({student.enrollments.length})</TabsTrigger>
          <TabsTrigger value="payments">Payments ({payments.length})</TabsTrigger>
          <TabsTrigger value="certificates">Certificates ({certificates.length})</TabsTrigger>
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
                {student.address && (
                  <div className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p>{student.address}</p>
                      <p className="text-muted-foreground">{student.city}, {student.state} - {student.pincode}</p>
                    </div>
                  </div>
                )}
                {student.qualification && (
                  <div className="flex items-center gap-3">
                    <GraduationCap className="h-4 w-4 text-muted-foreground" />
                    <span>{student.qualification}</span>
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
                  <span className="text-muted-foreground">Lead Source</span>
                  <Badge variant="outline" className="capitalize">{student.source}</Badge>
                </div>
                {student.leadId && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Converted from Lead</span>
                    <Link href={`/leads/${student.leadId}`} className="text-primary hover:underline flex items-center gap-1">
                      View Lead <ExternalLink className="h-3 w-3" />
                    </Link>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Converted By</span>
                  <span>{convertedByUser?.name || 'Unknown'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Conversion Date</span>
                  <span>{formatDate(student.convertedAt)}</span>
                </div>
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
              description="This student is not enrolled in any courses."
            />
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Course</TableHead>
                      <TableHead>Batch</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Progress</TableHead>
                      <TableHead>Fee</TableHead>
                      <TableHead>Paid</TableHead>
                      <TableHead>Due</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {student.enrollments.map((enrollment: Enrollment) => (
                      <TableRow key={enrollment.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{enrollment.courseName}</p>
                            <p className="text-xs text-muted-foreground">Instructor: {enrollment.instructor}</p>
                          </div>
                        </TableCell>
                        <TableCell>{enrollment.batchName}</TableCell>
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
                        <TableCell className={enrollment.dueAmount > 0 ? 'text-red-600' : 'text-green-600'}>
                          {formatCurrency(enrollment.dueAmount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          {payments.length === 0 ? (
            <EmptyState
              icon={CreditCard}
              title="No payments"
              description="No payment records found for this student."
            />
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Receipt</TableHead>
                      <TableHead>Course</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell className="font-medium">{payment.receiptNumber}</TableCell>
                        <TableCell>
                          <div>
                            <p>{payment.courseName}</p>
                            <p className="text-xs text-muted-foreground">{payment.batchName}</p>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{formatCurrency(payment.amount)}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">{payment.method.replace('_', ' ')}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={payment.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}>
                            {payment.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(payment.paidAt || payment.createdAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="certificates" className="space-y-4">
          {certificates.length === 0 ? (
            <EmptyState
              icon={Award}
              title="No certificates"
              description="No certificates have been issued yet."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {certificates.map((cert) => (
                <Card key={cert.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{cert.courseName}</CardTitle>
                        <CardDescription>{cert.certificateNumber}</CardDescription>
                      </div>
                      <Award className="h-8 w-8 text-primary" />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Grade</span>
                      <Badge className="bg-green-100 text-green-800">{cert.grade}</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Score</span>
                      <span className="font-medium">{cert.score}%</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Issued</span>
                      <span>{formatDate(cert.issueDate)}</span>
                    </div>
                    <div className="pt-2">
                      <Button variant="outline" className="w-full">
                        <Download className="h-4 w-4 mr-2" />
                        Download Certificate
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}