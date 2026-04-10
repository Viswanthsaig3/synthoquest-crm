'use client'

import React, { useState, useMemo } from 'react'
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

import { STUDENT_STATUSES, COURSES } from '@/lib/constants'
import { formatDate, getInitials, formatCurrency } from '@/lib/utils'
import { canViewAllStudents, canViewAssignedStudents, canCreateStudent } from '@/lib/permissions'
import { GraduationCap, Eye, Mail, Phone, BookOpen, IndianRupee, Calendar } from 'lucide-react'
import Link from 'next/link'
import type { Student, Enrollment } from '@/types/student'

export default function StudentsPage() {
  const { user } = useAuth()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [courseFilter, setCourseFilter] = useState('')

  const visibleStudents: Student[] = useMemo(() => {
    if (!user) return []
    return canViewAllStudents(user) ? [] : []
  }, [user])

  const filteredStudents = useMemo(() => {
    return visibleStudents.filter(student => {
      const matchesSearch = student.name.toLowerCase().includes(search.toLowerCase()) ||
        student.email.toLowerCase().includes(search.toLowerCase()) ||
        student.phone.includes(search)
      const matchesStatus = !statusFilter || student.status === statusFilter
      const matchesCourse = !courseFilter || student.enrollments.some((e: Enrollment) => e.courseName === courseFilter)
      return matchesSearch && matchesStatus && matchesCourse
    })
  }, [visibleStudents, search, statusFilter, courseFilter])

  if (!user) return null

  const canView = canViewAllStudents(user) || canViewAssignedStudents(user)

  const canAdd = canCreateStudent(user)
  const courseOptions = COURSES.map(c => ({ value: c, label: c }))

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
          exportData
        />

      <Card>
        <CardContent className="p-0">
          {filteredStudents.length === 0 ? (
            <EmptyState
              icon={GraduationCap}
              title="No students found"
              description="Students will appear here after lead conversion."
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
                          {formatDate(student.convertedAt)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/students/${student.id}`}>
                          <Button variant="ghost" size="icon">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
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