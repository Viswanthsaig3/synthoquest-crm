'use client'

import React from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Breadcrumb } from '@/components/layout/breadcrumb'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { StatusBadge } from '@/components/shared'
import { mockLeads, getLeadById } from '@/lib/mock-data'
import { mockUsers } from '@/lib/mock-data/users'
import { formatDate, getInitials, cn } from '@/lib/utils'
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Phone, 
  Mail, 
  Calendar,
  UserPlus,
  MessageSquare,
  CheckCircle,
  XCircle,
  Clock,
  GraduationCap
} from 'lucide-react'
import Link from 'next/link'

const activityIcons: Record<string, React.ReactNode> = {
  created: <UserPlus className="h-4 w-4 text-blue-600" />,
  contacted: <Phone className="h-4 w-4 text-yellow-600" />,
  follow_up: <Clock className="h-4 w-4 text-purple-600" />,
  converted: <CheckCircle className="h-4 w-4 text-green-600" />,
  lost: <XCircle className="h-4 w-4 text-red-600" />,
  note: <MessageSquare className="h-4 w-4 text-gray-600" />,
}

export default function LeadDetailPage() {
  const params = useParams()
  const router = useRouter()
  const leadId = params.id as string
  const lead = getLeadById(leadId)

  if (!lead) {
    return (
      <div className="space-y-6">
        <Breadcrumb />
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Lead not found</p>
            <Link href="/leads">
              <Button className="mt-4">Back to Leads</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const assignedUser = mockUsers.find(u => u.id === lead.assignedTo)

  return (
    <div className="space-y-6">
      <Breadcrumb />
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/leads">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{lead.name}</h1>
              <StatusBadge status={lead.status} />
            </div>
            <p className="text-muted-foreground">{lead.courseInterested}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/leads/${lead.id}?edit=true`}>
            <Button variant="outline">
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </Link>
          <Button variant="destructive">
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{lead.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="font-medium">{lead.phone}</p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <GraduationCap className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Course</p>
                    <p className="font-medium">{lead.courseInterested}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Created</p>
                    <p className="font-medium">{formatDate(lead.createdAt)}</p>
                  </div>
                </div>
              </div>
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-2">Source</p>
                <Badge variant="outline" className="capitalize">{lead.source}</Badge>
              </div>
              {lead.notes && (
                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground mb-2">Notes</p>
                  <p className="text-sm">{lead.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Activity Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {lead.timeline.map((activity, index) => (
                  <div key={activity.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="p-2 rounded-full bg-muted">
                        {activityIcons[activity.type]}
                      </div>
                      {index < lead.timeline.length - 1 && (
                        <div className="w-0.5 h-full bg-border mt-2" />
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <p className="font-medium capitalize">
                        {activity.type.replace('_', ' ')}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {activity.description}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDate(activity.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Assigned To</CardTitle>
            </CardHeader>
            <CardContent>
              {assignedUser ? (
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={assignedUser.avatar} />
                    <AvatarFallback>{getInitials(assignedUser.name)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{assignedUser.name}</p>
                    <p className="text-sm text-muted-foreground capitalize">
                      {assignedUser.department} - {assignedUser.role.replace('_', ' ')}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">Not assigned</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full justify-start" variant="outline">
                <Phone className="h-4 w-4 mr-2" />
                Log Call
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <MessageSquare className="h-4 w-4 mr-2" />
                Add Note
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <CheckCircle className="h-4 w-4 mr-2" />
                Mark as Converted
              </Button>
              <Button className="w-full justify-start" variant="outline" disabled={lead.status === 'converted'}>
                <GraduationCap className="h-4 w-4 mr-2" />
                Convert to Student
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}