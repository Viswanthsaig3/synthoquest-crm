'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/context/auth-context'
import { Breadcrumb } from '@/components/layout/breadcrumb'
import { PageHeader, EmptyState, TableSkeleton, PermissionGuard } from '@/components/shared'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatCurrency } from '@/lib/utils'
import { canCreateCourse, canEditCourse, canDeleteCourse, canViewCourses } from '@/lib/permissions'
import { BookOpen, Plus, Edit, Trash2, Clock, IndianRupee, Tag } from 'lucide-react'
import Link from 'next/link'
import { getCourses, deleteCourse } from '@/lib/api/courses'
import { useToast } from '@/components/ui/toast'
import type { Course } from '@/types/course'

const CATEGORY_LABELS: Record<string, string> = {
  cyber_security: 'Cyber Security',
  ai_ml: 'AI/ML',
  other: 'Other',
}

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-gray-100 text-gray-800',
  archived: 'bg-orange-100 text-orange-800',
}

export default function CoursesPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [courses, setCourses] = useState<Course[]>([])

  useEffect(() => {
    if (user) {
      loadCourses()
    }
  }, [user])

  const loadCourses = async () => {
    try {
      setLoading(true)
      const res = await getCourses()
      setCourses(res.data)
    } catch (error) {
      console.error('Failed to load courses:', error)
      toast({
        title: 'Error',
        description: 'Failed to load courses',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return

    try {
      await deleteCourse(id)
      toast({ title: 'Course deleted', description: `"${name}" has been deleted.` })
      loadCourses()
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete course', variant: 'destructive' })
    }
  }

  if (!user) return null

  const canAdd = canCreateCourse(user)
  const canEdit = canEditCourse(user)
  const canDel = canDeleteCourse(user)

  return (
    <PermissionGuard check={canViewCourses} fallbackMessage="You don&apos;t have permission to view courses.">
      <div className="space-y-6">
        <Breadcrumb />
        
        <PageHeader
          title="Courses"
          description={`${courses.length} courses available`}
          action={canAdd ? { label: 'Add Course', href: '/courses/new' } : undefined}
        />

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <TableSkeleton rows={5} />
            ) : courses.length === 0 ? (
              <EmptyState
                icon={BookOpen}
                title="No courses found"
                description="Add courses to start enrolling students."
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Course</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Fee</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {courses.map((course) => (
                    <TableRow key={course.id}>
                      <TableCell className="font-medium">{course.name}</TableCell>
                      <TableCell><Badge variant="outline">{course.code}</Badge></TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          <Tag className="h-3 w-3 mr-1" />
                          {CATEGORY_LABELS[course.category] || course.category}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          {course.durationWeeks} weeks
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <IndianRupee className="h-3 w-3 text-muted-foreground" />
                          {formatCurrency(course.defaultFee)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={STATUS_COLORS[course.status]}>{course.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center gap-2 justify-end">
                          {canEdit && (
                            <Link href={`/courses/${course.id}/edit`}>
                              <Button variant="ghost" size="icon"><Edit className="h-4 w-4" /></Button>
                            </Link>
                          )}
                          {canDel && (
                            <Button variant="ghost" size="icon" className="text-red-600 hover:bg-red-50" onClick={() => handleDelete(course.id, course.name)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </PermissionGuard>
  )
}