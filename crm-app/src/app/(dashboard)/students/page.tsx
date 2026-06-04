'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useAuth } from '@/context/auth-context'
import { Breadcrumb } from '@/components/layout/breadcrumb'
import { PageHeader, StatusBadge, EmptyState, TableSkeleton, PermissionGuard } from '@/components/shared'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

import { STUDENT_STATUSES } from '@/lib/constants'
import { formatDate, getInitials, formatCurrency } from '@/lib/utils'
import { canViewAllStudents, canViewAssignedStudents, canCreateStudent, canDeleteStudent } from '@/lib/permissions'
import { GraduationCap, Eye, Mail, Phone, BookOpen, IndianRupee, Calendar, Loader2, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { getStudents, deleteStudent } from '@/lib/api/students'
import { getCourses } from '@/lib/api/courses'
import { useToast } from '@/components/ui/toast'
import { exportToCSV, formatCurrencyForExport, formatDateForExport } from '@/lib/utils/export'
import type { Student, Enrollment } from '@/types/student'
import type { Course } from '@/types/course'

export default function StudentsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [students, setStudents] = useState<Student[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [courseFilter, setCourseFilter] = useState('')
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user])

  const loadData = async () => {
    try {
      setLoading(true)
      const [studentsRes, coursesRes] = await Promise.all([
        getStudents(),
        getCourses()
      ])
      setStudents(studentsRes.data)
      setCourses(coursesRes.data)
    } catch (error) {
      console.error('Failed to load students:', error)
      toast({
        title: 'Error',
        description: 'Failed to load students',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      const matchesSearch = student.name.toLowerCase().includes(search.toLowerCase()) ||
        student.email.toLowerCase().includes(search.toLowerCase()) ||
        student.phone.includes(search)
      const matchesStatus = !statusFilter || student.status === statusFilter
      const matchesCourse = !courseFilter || student.enrollments.some((e: Enrollment) => e.courseId === courseFilter || e.courseName === courseFilter)
      return matchesSearch && matchesStatus && matchesCourse
    })
  }, [students, search, statusFilter, courseFilter])

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) return

    try {
      await deleteStudent(id)
      toast({ title: 'Student deleted', description: `${name} has been removed.` })
      loadData()
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete student', variant: 'destructive' })
    }
  }

  const handleExport = async () => {
    if (filteredStudents.length === 0) {
      toast({ title: 'No data', description: 'No students to export' })
      return
    }

    setExporting(true)
    try {
      const exportData = filteredStudents.map(s => ({
        name: s.name,
        email: s.email,
        phone: s.phone,
        college: s.college || '',
        qualification: s.qualification || '',
        graduationYear: s.graduationYear || '',
        studentType: s.studentType === 'current' ? 'Current Student' : 'Passed Out',
        courses: s.enrollments.map(e => e.courseName).join('; ') || '',
        totalFee: formatCurrencyForExport(s.enrollments.reduce((sum, e) => sum + e.totalFee, 0)),
        totalPaid: formatCurrencyForExport(s.totalPaid),
        totalDue: formatCurrencyForExport(s.totalDue),
        status: s.status,
        enrolledDate: formatDateForExport(s.convertedAt || s.createdAt),
      }))
      
      exportToCSV(exportData, 'students', [
        { key: 'name', label: 'Name' },
        { key: 'email', label: 'Email' },
        { key: 'phone', label: 'Phone' },
        { key: 'college', label: 'College' },
        { key: 'qualification', label: 'Qualification' },
        { key: 'graduationYear', label: 'Graduation Year' },
        { key: 'studentType', label: 'Student Type' },
        { key: 'courses', label: 'Courses' },
        { key: 'totalFee', label: 'Total Fee' },
        { key: 'totalPaid', label: 'Paid' },
        { key: 'totalDue', label: 'Due' },
        { key: 'status', label: 'Status' },
        { key: 'enrolledDate', label: 'Enrolled Date' },
      ])
      
      toast({ title: 'Export complete', description: `${filteredStudents.length} students exported` })
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to export', variant: 'destructive' })
    } finally {
      setExporting(false)
    }
  }

  if (!user) return null

  const canView = canViewAllStudents(user) || canViewAssignedStudents(user)
  const canAdd = canCreateStudent(user)
  const canDel = canDeleteStudent(user)
  const courseOptions = courses.map(c => ({ value: c.id, label: c.name }))

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-green-100 text-green-800',
      completed: 'bg-blue-100 text-blue-800',
      dropped: 'bg-red-100 text-red-800',
      on_hold: 'bg-orange-100 text-orange-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  return (
    <PermissionGuard check={(u) => canViewAllStudents(u) || canViewAssignedStudents(u)} fallbackMessage="You don't have permission to view students.">
      <div className="space-y-6">
        <Breadcrumb />
        
        <PageHeader
          title="Students"
          description={`${filteredStudents.length} students found`}
          action={canAdd ? { label: 'Add Student', href: '/students/new' } : undefined}
          search={{ placeholder: 'Search students...', value: search, onChange: setSearch }}
          filters={[
            { options: STUDENT_STATUSES, value: statusFilter, onChange: setStatusFilter, placeholder: 'All Statuses' },
            { options: courseOptions, value: courseFilter, onChange: setCourseFilter, placeholder: 'All Courses' },
          ]}
          exportData={{ onClick: handleExport, loading: exporting }}
        />

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <TableSkeleton rows={5} />
          ) : filteredStudents.length === 0 ? (
            <EmptyState
              icon={GraduationCap}
              title="No students found"
              description={students.length === 0 ? "Students will appear here after lead conversion." : "No students match your filters."}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Course(s)</TableHead>
                  <TableHead>Batch</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Enrolled</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.map((student) => {
                  const primaryEnrollment = student.enrollments[0]
                  return (
                    <TableRow key={student.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${student.name}`} />
                            <AvatarFallback>{getInitials(student.name)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{student.name}</p>
                            <p className="text-xs text-muted-foreground">{student.occupation || 'Student'}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-sm">
                            <Mail className="h-3 w-3" />
                            {student.email}
                          </div>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            {student.phone}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {student.enrollments.slice(0, 2).map((e: Enrollment, i: number) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {e.courseName.length > 15 ? e.courseName.substring(0, 15) + '...' : e.courseName}
                            </Badge>
                          ))}
                          {student.enrollments.length > 2 && (
                            <Badge variant="secondary" className="text-xs">
                              +{student.enrollments.length - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {primaryEnrollment?.batchName || '-'}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-sm font-medium text-green-600">
                            <IndianRupee className="h-3 w-3" />
                            {formatCurrency(student.totalPaid)}
                          </div>
                          {student.totalDue > 0 && (
                            <div className="flex items-center gap-1 text-xs text-red-600">
                              Due: {formatCurrency(student.totalDue)}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(student.status)}>
                          {student.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {student.convertedAt ? formatDate(student.convertedAt) : '-'}
                        </div>
                      </TableCell>
<TableCell className="text-right">
                         <div className="flex items-center gap-1 justify-end">
                           <Link href={`/students/${student.id}`}>
                             <Button variant="ghost" size="icon">
                               <Eye className="h-4 w-4" />
                             </Button>
                           </Link>
                           {canDel && (
                             <Button
                               variant="ghost"
                               size="icon"
                               className="text-red-600 hover:bg-red-50"
                               onClick={() => handleDelete(student.id, student.name)}
                             >
                               <Trash2 className="h-4 w-4" />
                             </Button>
                           )}
                         </div>
                       </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      </div>
    </PermissionGuard>
  )
}