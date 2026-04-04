'use client'

import React from 'react'
import { useParams } from 'next/navigation'
import { useAuth } from '@/context/auth-context'
import { Breadcrumb } from '@/components/layout/breadcrumb'
import { PageHeader, EmptyState } from '@/components/shared'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
import { mockBatches, mockStudents, mockUsers } from '@/lib/mock-data'
import { formatDate, formatCurrency, getInitials } from '@/lib/utils'
import { canEditBatch, canManageBatch } from '@/lib/permissions'
import {
  BookOpen,
  Users,
  Calendar,
  Clock,
  MapPin,
  Video,
  Edit,
  Plus,
  FileText,
  GraduationCap,
  Mail,
  Phone,
} from 'lucide-react'
import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

export default function BatchDetailPage() {
  const params = useParams()
  const { user } = useAuth()

  const batch = mockBatches.find(b => b.id === params.id)
  const instructor = mockUsers.find(u => u.id === batch?.instructorId)
  const studentsInBatch = mockStudents.filter(s => 
    s.enrollments.some(e => e.batchId === params.id)
  )

  if (!user || !batch) {
    return (
      <div className="space-y-6">
        <Breadcrumb />
        <EmptyState
          icon={BookOpen}
          title="Batch not found"
          description="The batch you're looking for doesn't exist."
        />
      </div>
    )
  }

  const canEdit = canEditBatch(user)
  const canManage = canManageBatch(user)

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      upcoming: 'bg-blue-100 text-blue-800',
      ongoing: 'bg-green-100 text-green-800',
      completed: 'bg-purple-100 text-purple-800',
      cancelled: 'bg-red-100 text-red-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const occupancy = Math.round((batch.enrolledCount / batch.maxCapacity) * 100)

  return (
    <div className="space-y-6">
      <Breadcrumb />
      
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{batch.name}</h1>
            <Badge className={getStatusColor(batch.status)}>{batch.status}</Badge>
          </div>
          <p className="text-muted-foreground">{batch.courseName}</p>
        </div>
        <div className="flex gap-2">
          {canEdit && (
            <Link href={`/batches/${batch.id}?edit=true`}>
              <Button variant="outline">
                <Edit className="h-4 w-4 mr-2" />
                Edit Batch
              </Button>
            </Link>
          )}
          {canManage && (
            <Link href={`/students/new?batch=${batch.id}`}>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Student
              </Button>
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Enrolled</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{batch.enrolledCount}/{batch.maxCapacity}</div>
            <Progress value={occupancy} className="h-2 mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Duration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.ceil((new Date(batch.endDate).getTime() - new Date(batch.startDate).getTime()) / (1000 * 60 * 60 * 24 * 7))} weeks
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Mode</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">{batch.mode}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Fee</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{formatCurrency(batch.fee)}</div>
            {batch.discount > 0 && (
              <p className="text-sm text-green-600">Discount: {formatCurrency(batch.discount)}</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="students">Students ({studentsInBatch.length})</TabsTrigger>
          <TabsTrigger value="syllabus">Syllabus</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Schedule
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Start Date</p>
                    <p className="font-medium">{formatDate(batch.startDate)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">End Date</p>
                    <p className="font-medium">{formatDate(batch.endDate)}</p>
                  </div>
                </div>
                <div className="border-t pt-4">
                  <p className="text-sm text-muted-foreground mb-2">Class Schedule</p>
                  <div className="space-y-2">
                    {batch.schedule.map((s, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <Badge variant="outline" className="capitalize">{s.day}</Badge>
                        <span className="text-sm">{s.startTime} - {s.endTime}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Instructor & Venue
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {instructor && (
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={instructor.avatar || undefined} />
                      <AvatarFallback>{getInitials(instructor.name)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{instructor.name}</p>
                      <p className="text-sm text-muted-foreground">{instructor.email}</p>
                    </div>
                  </div>
                )}
                
                {batch.venue && (
                  <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Venue</p>
                      <p className="font-medium">{batch.venue}</p>
                    </div>
                  </div>
                )}

                {batch.onlineLink && (
                  <div className="flex items-center gap-3">
                    <Video className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Online Link</p>
                      <a href={batch.onlineLink} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                        Join Class
                      </a>
                    </div>
                  </div>
                )}

                {batch.prerequisites && batch.prerequisites.length > 0 && (
                  <div className="border-t pt-4">
                    <p className="text-sm text-muted-foreground mb-2">Prerequisites</p>
                    <ul className="list-disc list-inside space-y-1">
                      {batch.prerequisites.map((p, i) => (
                        <li key={i} className="text-sm">{p}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {batch.description && (
            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{batch.description}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="students" className="space-y-4">
          {studentsInBatch.length === 0 ? (
            <EmptyState
              icon={GraduationCap}
              title="No students enrolled"
              description="No students have been enrolled in this batch yet."
            />
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Progress</TableHead>
                      <TableHead>Paid</TableHead>
                      <TableHead>Due</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {studentsInBatch.map((student) => {
                      const enrollment = student.enrollments.find(e => e.batchId === batch.id)
                      return (
                        <TableRow key={student.id}>
                          <TableCell>
                            <Link href={`/students/${student.id}`} className="flex items-center gap-3 hover:text-primary">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${student.name}`} />
                                <AvatarFallback>{getInitials(student.name)}</AvatarFallback>
                              </Avatar>
                              <span className="font-medium">{student.name}</span>
                            </Link>
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
                            <Badge className={enrollment?.status === 'in_progress' || enrollment?.status === 'enrolled' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                              {enrollment?.status || 'enrolled'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Progress value={enrollment?.progress || 0} className="w-16" />
                              <span className="text-sm">{enrollment?.progress || 0}%</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-green-600">{formatCurrency(enrollment?.paidAmount || 0)}</TableCell>
                          <TableCell className={(enrollment?.dueAmount || 0) > 0 ? 'text-red-600' : 'text-green-600'}>
                            {formatCurrency(enrollment?.dueAmount || 0)}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="syllabus" className="space-y-4">
          {batch.syllabus && batch.syllabus.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Course Syllabus
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="list-decimal list-inside space-y-2">
                  {batch.syllabus.map((topic, i) => (
                    <li key={i} className="text-sm py-2 border-b last:border-0">{topic}</li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          ) : (
            <EmptyState
              icon={FileText}
              title="No syllabus available"
              description="Syllabus has not been added for this batch."
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}