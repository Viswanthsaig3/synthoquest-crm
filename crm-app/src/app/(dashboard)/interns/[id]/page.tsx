'use client'

import React from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/context/auth-context'
import { Breadcrumb } from '@/components/layout/breadcrumb'
import { PageHeader } from '@/components/shared'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { getInternById } from '@/lib/mock-data/interns'
import { getUserById } from '@/lib/mock-data/users'
import { INTERN_STATUSES, INTERNSHIP_TYPES, INTERNSHIP_DURATIONS } from '@/lib/constants'
import { formatDate, getInitials } from '@/lib/utils'
import { canManageEmployees } from '@/lib/permissions'
import {
  Briefcase,
  Mail,
  Phone,
  Building,
  Calendar,
  ExternalLink,
  Clock,
  User,
  GraduationCap,
  Code,
  Award,
  ArrowLeft,
  Check,
  X,
  Edit,
  FileText,
} from 'lucide-react'
import Link from 'next/link'

export default function InternDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const internId = params.id as string

  const intern = getInternById(internId)

  if (!user || !intern) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Intern not found</p>
      </div>
    )
  }

  const canManage = canManageEmployees(user)
  const statusConfig = INTERN_STATUSES.find(s => s.value === intern.status)
  const durationConfig = INTERNSHIP_DURATIONS.find(d => d.value === intern.duration)

  const getStatusColor = (color?: string) => {
    const colors: Record<string, string> = {
      blue: 'bg-blue-100 text-blue-800',
      purple: 'bg-purple-100 text-purple-800',
      orange: 'bg-orange-100 text-orange-800',
      green: 'bg-green-100 text-green-800',
      teal: 'bg-teal-100 text-teal-800',
      gray: 'bg-gray-100 text-gray-800',
      red: 'bg-red-100 text-red-800',
    }
    return colors[color || 'gray'] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="space-y-6">
      <Breadcrumb />
      
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${intern.name}`} />
              <AvatarFallback>{getInitials(intern.name)}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold">{intern.name}</h1>
              <p className="text-muted-foreground">{intern.college} • {intern.degree}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={getStatusColor(statusConfig?.color)}>
            {intern.status}
          </Badge>
          {intern.internshipType === 'paid' && intern.stipend && (
            <Badge variant="outline" className="text-green-600 border-green-300">
              ₹{intern.stipend.toLocaleString()}/mo
            </Badge>
          )}
        </div>
      </div>

      {intern.approvalStatus === 'pending' && canManage && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-orange-600" />
                <span className="font-medium text-orange-800">Pending Approval</span>
                <span className="text-sm text-orange-700">This intern application requires HR approval</span>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" className="border-red-300 text-red-600 hover:bg-red-50">
                  <X className="h-4 w-4 mr-1" />
                  Reject
                </Button>
                <Button size="sm" className="bg-green-600 hover:bg-green-700">
                  <Check className="h-4 w-4 mr-1" />
                  Approve
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Email</p>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <a href={`mailto:${intern.email}`} className="text-blue-600 hover:underline">
                      {intern.email}
                    </a>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <a href={`tel:${intern.phone}`} className="text-blue-600 hover:underline">
                      {intern.phone}
                    </a>
                  </div>
                </div>
                {intern.alternatePhone && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Alternate Phone</p>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{intern.alternatePhone}</span>
                    </div>
                  </div>
                )}
              </div>
              
              <Separator />
              
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Skills</p>
                <div className="flex flex-wrap gap-2">
                  {intern.skills.map((skill, i) => (
                    <Badge key={i} variant="secondary" className="flex items-center gap-1">
                      <Code className="h-3 w-3" />
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="grid gap-4 md:grid-cols-2">
                {intern.resumeUrl && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Resume</p>
                    <a href={intern.resumeUrl} target="_blank" rel="noopener noreferrer" 
                      className="flex items-center gap-1 text-blue-600 hover:underline text-sm">
                      <FileText className="h-4 w-4" />
                      View Resume
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}
                {intern.linkedinUrl && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">LinkedIn</p>
                    <a href={intern.linkedinUrl} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-blue-600 hover:underline text-sm">
                      <ExternalLink className="h-4 w-4" />
                      LinkedIn Profile
                    </a>
                  </div>
                )}
                {intern.portfolioUrl && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Portfolio</p>
                    <a href={intern.portfolioUrl} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-blue-600 hover:underline text-sm">
                      <ExternalLink className="h-4 w-4" />
                      View Portfolio
                    </a>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                Education
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">College/University</p>
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{intern.college}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Degree/Course</p>
                  <span className="font-medium">{intern.degree}</span>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Current Year</p>
                  <span className="font-medium">
                    {intern.year === 'passed' ? 'Passed Out' : `${intern.year}${intern.year === '1' ? 'st' : intern.year === '2' ? 'nd' : intern.year === '3' ? 'rd' : 'th'} Year`}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {intern.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{intern.notes}</p>
              </CardContent>
            </Card>
          )}

          {intern.performanceRating && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Performance Feedback
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Rating:</span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span key={star} className={star <= Math.floor(intern.performanceRating!) ? 'text-yellow-400' : 'text-gray-300'}>
                        ★
                      </span>
                    ))}
                    <span className="ml-1 text-sm font-medium">{intern.performanceRating}/5</span>
                  </div>
                </div>
                {intern.feedback && (
                  <p className="text-sm text-muted-foreground">{intern.feedback}</p>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Internship Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Department</span>
                  <Badge variant="outline" className="capitalize">{intern.department}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Type</span>
                  <Badge variant={intern.internshipType === 'paid' ? 'default' : 'secondary'} className="capitalize">
                    {intern.internshipType}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Duration</span>
                  <span className="text-sm font-medium">{durationConfig?.label || intern.duration}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Source</span>
                  <span className="text-sm capitalize">{intern.source.replace('_', ' ')}</span>
                </div>
                {intern.stipend && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Stipend</span>
                    <span className="text-sm font-medium text-green-600">₹{intern.stipend.toLocaleString()}/month</span>
                  </div>
                )}
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Start Date</span>
                  <span className="text-sm">{intern.startDate ? formatDate(intern.startDate) : '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Expected End</span>
                  <span className="text-sm">{intern.expectedEndDate ? formatDate(intern.expectedEndDate) : '-'}</span>
                </div>
                {intern.actualEndDate && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Actual End</span>
                    <span className="text-sm">{formatDate(intern.actualEndDate)}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {intern.supervisorName && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Supervisor</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${intern.supervisorName}`} />
                    <AvatarFallback>{getInitials(intern.supervisorName)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{intern.supervisorName}</p>
                    <p className="text-sm text-muted-foreground capitalize">{intern.department}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Created</span>
                <span className="text-sm">{formatDate(intern.createdAt)}</span>
              </div>
              {intern.approvedAt && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Approved</span>
                  <span className="text-sm">{formatDate(intern.approvedAt)}</span>
                </div>
              )}
              {intern.convertedAt && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Started</span>
                  <span className="text-sm">{formatDate(intern.convertedAt)}</span>
                </div>
              )}
              {intern.leadId && (
                <div className="pt-2">
                  <Link href={`/leads/${intern.leadId}`} className="text-sm text-blue-600 hover:underline">
                    View Original Lead →
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {canManage && (
            <Card>
              <CardContent className="p-4">
                <Button variant="outline" className="w-full">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Intern Details
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}