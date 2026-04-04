'use client'

import React, { useState, useMemo } from 'react'
import { useAuth } from '@/context/auth-context'
import { Breadcrumb } from '@/components/layout/breadcrumb'
import { PageHeader, StatusBadge, EmptyState } from '@/components/shared'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { mockBatches, mockUsers } from '@/lib/mock-data'
import { BATCH_STATUSES, BATCH_MODES, COURSES } from '@/lib/constants'
import { formatDate, cn } from '@/lib/utils'
import { canCreateBatch, canViewBatches } from '@/lib/permissions'
import { BookOpen, Users, Calendar, Clock, MapPin, Video, Plus, Eye } from 'lucide-react'
import Link from 'next/link'

export default function BatchesPage() {
  const { user } = useAuth()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [courseFilter, setCourseFilter] = useState('')

  const filteredBatches = useMemo(() => {
    return mockBatches.filter(batch => {
      const matchesSearch = batch.name.toLowerCase().includes(search.toLowerCase()) ||
        batch.courseName.toLowerCase().includes(search.toLowerCase()) ||
        batch.instructorName.toLowerCase().includes(search.toLowerCase())
      const matchesStatus = !statusFilter || batch.status === statusFilter
      const matchesCourse = !courseFilter || batch.courseName === courseFilter
      return matchesSearch && matchesStatus && matchesCourse
    })
  }, [search, statusFilter, courseFilter])

  if (!user || !canViewBatches(user)) return null

  const canAdd = canCreateBatch(user)
  const courseOptions = COURSES.map(c => ({ value: c, label: c }))

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      upcoming: 'bg-blue-100 text-blue-800',
      ongoing: 'bg-green-100 text-green-800',
      completed: 'bg-purple-100 text-purple-800',
      cancelled: 'bg-red-100 text-red-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getModeIcon = (mode: string) => {
    switch (mode) {
      case 'online': return <Video className="h-4 w-4" />
      case 'offline': return <MapPin className="h-4 w-4" />
      default: return <Users className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6">
      <Breadcrumb />
      
      <PageHeader
        title="Batches"
        description={`${filteredBatches.length} batches found`}
        action={canAdd ? { label: 'Create Batch', href: '/batches/new' } : undefined}
        search={{ placeholder: 'Search batches...', value: search, onChange: setSearch }}
        filters={[
          { options: BATCH_STATUSES, value: statusFilter, onChange: setStatusFilter, placeholder: 'All Statuses' },
          { options: courseOptions, value: courseFilter, onChange: setCourseFilter, placeholder: 'All Courses' },
        ]}
        exportData
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBatches.length === 0 ? (
          <div className="col-span-full">
            <EmptyState
              icon={BookOpen}
              title="No batches found"
              description="Create your first batch to get started."
            />
          </div>
        ) : (
          filteredBatches.map((batch) => {
            const occupancy = Math.round((batch.enrolledCount / batch.maxCapacity) * 100)
            return (
              <Card key={batch.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-lg">{batch.name}</h3>
                      <p className="text-sm text-muted-foreground">{batch.courseName}</p>
                    </div>
                    <Badge className={getStatusColor(batch.status)}>
                      {batch.status}
                    </Badge>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>Instructor: {batch.instructorName}</span>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      {getModeIcon(batch.mode)}
                      <span className="capitalize">{batch.mode}</span>
                      {batch.venue && (
                        <span className="text-muted-foreground">• {batch.venue}</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{formatDate(batch.startDate)} - {formatDate(batch.endDate)}</span>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {batch.schedule.slice(0, 2).map(s => s.day.charAt(0).toUpperCase() + s.day.slice(1, 3)).join(', ')}
                        {' '}• {batch.schedule[0]?.startTime} - {batch.schedule[0]?.endTime}
                      </span>
                    </div>

                    <div className="pt-2">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span>Enrollment</span>
                        <span className="font-medium">{batch.enrolledCount}/{batch.maxCapacity}</span>
                      </div>
                      <Progress 
                        value={occupancy} 
                        className={cn(
                          "h-2",
                          occupancy >= 90 && "[&>div]:bg-red-500",
                          occupancy >= 70 && occupancy < 90 && "[&>div]:bg-orange-500"
                        )}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        {batch.availableSeats} seats available
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-4 border-t">
                    <div className="text-lg font-bold text-primary">
                      ₹{batch.fee.toLocaleString()}
                      {batch.discount > 0 && (
                        <span className="text-sm text-green-600 ml-1">
                          (-₹{batch.discount.toLocaleString()})
                        </span>
                      )}
                    </div>
                    <Link href={`/batches/${batch.id}`}>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}