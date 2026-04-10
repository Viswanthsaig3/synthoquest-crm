'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/context/auth-context'
import { Breadcrumb } from '@/components/layout/breadcrumb'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { StatusBadge } from '@/components/shared'
import { getLeadById, getLeadActivities, getLeadCallRecords, claimLead, getLeadTypes } from '@/lib/api/leads'
import { getEmployees } from '@/lib/api/employees'
import { formatDate, getInitials } from '@/lib/utils'
import { canClaimLead, canCallLead, canConvertLead, canEditLead } from '@/lib/permissions'
import { hasPermission } from '@/lib/client-permissions'
import { COURSE_FEES } from '@/lib/constants'
import { CallModal } from '@/components/leads/call-modal'
import { ConversionModal } from '@/components/leads/conversion-modal'
import type { Lead, LeadActivity, CallRecord } from '@/lib/db/queries/leads'
import type { LeadType } from '@/types/lead-type'
import type { User } from '@/types/user'
import { useToast } from '@/components/ui/toast'
import { 
  ArrowLeft, 
  Edit, 
  Phone, 
  Mail, 
  Calendar,
  UserPlus,
  MessageSquare,
  CheckCircle,
  XCircle,
  GraduationCap,
  Flame,
  Zap,
  Snowflake,
  Play,
  Loader2
} from 'lucide-react'
import Link from 'next/link'

const activityIcons: Record<string, React.ReactNode> = {
  created: <UserPlus className="h-4 w-4 text-blue-600" />,
  claimed: <UserPlus className="h-4 w-4 text-purple-600" />,
  contacted: <Phone className="h-4 w-4 text-yellow-600" />,
  follow_up: <Calendar className="h-4 w-4 text-purple-600" />,
  converted: <CheckCircle className="h-4 w-4 text-green-600" />,
  lost: <XCircle className="h-4 w-4 text-red-600" />,
  note: <MessageSquare className="h-4 w-4 text-gray-600" />,
  call: <Phone className="h-4 w-4 text-green-600" />,
}

export default function LeadDetailPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const { toast } = useToast()
  const leadId = params.id as string
  
  const [loading, setLoading] = useState(true)
  const [lead, setLead] = useState<Lead | null>(null)
  const [activities, setActivities] = useState<LeadActivity[]>([])
  const [callRecords, setCallRecords] = useState<CallRecord[]>([])
  const [leadTypes, setLeadTypes] = useState<LeadType[]>([])
  const [employees, setEmployees] = useState<User[]>([])
  const [showCallModal, setShowCallModal] = useState(false)
  const [showConversionModal, setShowConversionModal] = useState(false)

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const [leadRes, typesRes, employeesRes] = await Promise.all([
          getLeadById(leadId),
          getLeadTypes(),
          getEmployees(),
        ])
        
        setLead(leadRes.data)
        setLeadTypes(typesRes.data)
        setEmployees(employeesRes.data)
        
        // Fetch activities and call records
        try {
          const [activitiesRes, callsRes] = await Promise.all([
            getLeadActivities(leadId),
            getLeadCallRecords(leadId),
          ])
          setActivities(activitiesRes.data)
          setCallRecords(callsRes.data)
        } catch (e) {
          console.error('Failed to fetch activities/calls:', e)
        }
      } catch (error) {
        console.error('Failed to fetch lead:', error)
        toast({
          title: 'Error',
          description: 'Failed to load lead details. Please try again.',
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [leadId, toast])

  useEffect(() => {
    const action = searchParams.get('action')
    if (action === 'call' && lead && user && canCallLead(user) && lead.assignedTo === user.id) {
      setShowCallModal(true)
    }
  }, [searchParams, lead, user])

  if (!user) return null

  if (loading) {
    return (
      <div className="space-y-6">
        <Breadcrumb />
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      </div>
    )
  }

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

  const assignedUser = lead.assignedTo ? employees.find(u => u.id === lead.assignedTo) : undefined
  const leadType = leadTypes.find(lt => lt.id === lead.typeId)
  const canEdit = canEditLead(user)
  const canCall = canCallLead(user) && lead.assignedTo === user.id
  const canConvert = canConvertLead(user) && lead.assignedTo === user.id && lead.status !== 'converted'
  const canClaim = canClaimLead(user) && !lead.assignedTo

  const handleClaim = async () => {
    try {
      await claimLead(leadId)
      toast({
        title: 'Lead claimed',
        description: 'You can now call this lead.',
      })
      setShowCallModal(true)
      // Refresh lead data
      const result = await getLeadById(leadId)
      setLead(result.data)
    } catch (error) {
      console.error('Failed to claim lead:', error)
      toast({
        title: 'Error',
        description: 'Failed to claim lead. Please try again.',
        variant: 'destructive',
      })
    }
  }

  const handleCallComplete = (callRecord: Partial<CallRecord>) => {
    toast({
      title: 'Call logged',
      description: `Duration: ${Math.floor(callRecord.duration! / 60)}m ${callRecord.duration! % 60}s`,
    })
    setShowCallModal(false)
    router.push('/leads/mine')
  }

  const handleConversionComplete = (studentId: string) => {
    toast({
      title: 'Lead converted!',
      description: `${lead?.name} has been enrolled as a student.`,
    })
    setShowConversionModal(false)
    router.push(`/students/${studentId}`)
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'hot': return <Flame className="h-4 w-4 text-red-500" />
      case 'warm': return <Zap className="h-4 w-4 text-orange-500" />
      case 'cold': return <Snowflake className="h-4 w-4 text-blue-500" />
      default: return null
    }
  }

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs}s`
  }

  const estValue = lead.courseInterested ? (COURSE_FEES[lead.courseInterested] || 0) : 0

  return (
    <div className="space-y-6">
      <Breadcrumb />
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={hasPermission(user, 'leads.claim') ? '/leads/mine' : '/leads'}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{lead.name}</h1>
              <StatusBadge status={lead.status} />
              {getPriorityIcon(lead.priority)}
            </div>
            <p className="text-muted-foreground">{lead.courseInterested || leadType?.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {canClaim && (
            <Button onClick={handleClaim}>
              <UserPlus className="h-4 w-4 mr-2" />
              Claim & Call
            </Button>
          )}
          {canCall && (
            <Button onClick={() => setShowCallModal(true)}>
              <Phone className="h-4 w-4 mr-2" />
              Call
            </Button>
          )}
          {canConvert && (
            <Button variant="outline" onClick={() => setShowConversionModal(true)}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Mark Converted
            </Button>
          )}
          {canEdit && (
            <Link href={`/leads/${lead.id}?edit=true`}>
              <Button variant="outline">
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </Link>
          )}
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
              {lead.alternatePhone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Alternate Phone</p>
                    <p className="font-medium">{lead.alternatePhone}</p>
                  </div>
                </div>
              )}
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
              <div className="pt-4 border-t grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Source</p>
                  <Badge variant="outline" className="capitalize">{lead.source}</Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Est. Value</p>
                  <p className="font-semibold text-green-600">₹{estValue.toLocaleString()}</p>
                </div>
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
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  Call History ({callRecords.length})
                </CardTitle>
                {canCall && (
                  <Button size="sm" onClick={() => setShowCallModal(true)}>
                    <Phone className="h-4 w-4 mr-2" />
                    Start Call
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {callRecords.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No calls made yet</p>
              ) : (
                <div className="space-y-3">
                  {callRecords.map((call) => (
                    <div key={call.id} className="p-4 rounded-lg border">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="p-2 rounded-full bg-green-100">
                            {call.outcome === 'answered' ? (
                              <Phone className="h-4 w-4 text-green-600" />
                            ) : (
                              <XCircle className="h-4 w-4 text-gray-400" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium capitalize">{call.outcome.replace('_', ' ')}</p>
                            <p className="text-sm text-muted-foreground">
                              {formatDate(call.createdAt)} • {formatDuration(call.duration)}
                            </p>
                          </div>
                        </div>
                        {call.recordingUrl && (
                          <Button variant="outline" size="sm">
                            <Play className="h-4 w-4 mr-1" />
                            Play Recording
                          </Button>
                        )}
                      </div>
                      <p className="text-sm bg-muted/50 p-2 rounded">{call.remarks}</p>
                      {call.followUpRequired && call.followUpDate && (
                        <div className="flex items-center gap-2 mt-2 text-sm text-orange-600">
                          <Calendar className="h-3 w-3" />
                          Follow-up: {formatDate(call.followUpDate)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Activity Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              {activities.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No activity yet</p>
              ) : (
                <div className="space-y-4">
                  {activities.map((activity, index) => (
                    <div key={activity.id} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="p-2 rounded-full bg-muted">
                          {activityIcons[activity.type] || <MessageSquare className="h-4 w-4 text-gray-600" />}
                        </div>
                        {index < activities.length - 1 && (
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
              )}
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
                    <AvatarImage src={assignedUser.avatar || undefined} />
                    <AvatarFallback>{getInitials(assignedUser.name)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{assignedUser.name}</p>
                    <p className="text-sm text-muted-foreground capitalize">
                      {assignedUser.department} - {assignedUser.role.replace('_', ' ')}
                    </p>
                    {lead.claimedAt && (
                      <p className="text-xs text-muted-foreground">
                        Claimed: {formatDate(lead.claimedAt)}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted-foreground mb-3">Not claimed yet</p>
                  {canClaim && (
                    <Button onClick={handleClaim} className="w-full">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Claim This Lead
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Lead Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Calls</span>
                <span className="font-medium">{lead.totalCalls}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Last Contact</span>
                <span className="font-medium">
                  {lead.lastContactedAt ? formatDate(lead.lastContactedAt) : 'Never'}
                </span>
              </div>
              {lead.nextFollowUpAt && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Next Follow-up</span>
                  <span className="font-medium text-orange-600">
                    {formatDate(lead.nextFollowUpAt)}
                  </span>
                </div>
              )}
              {lead.convertedAt && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Converted</span>
                  <span className="font-medium text-green-600">
                    {formatDate(lead.convertedAt)}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {canCall && (
                <Button className="w-full justify-start" variant="outline" onClick={() => setShowCallModal(true)}>
                  <Phone className="h-4 w-4 mr-2" />
                  Log Call
                </Button>
              )}
              <Button className="w-full justify-start" variant="outline">
                <MessageSquare className="h-4 w-4 mr-2" />
                Add Note
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Mail className="h-4 w-4 mr-2" />
                Send Email
              </Button>
              {lead.status === 'converted' && (
                <Link href={`/students?search=${encodeURIComponent(lead.name)}`}>
                  <Button className="w-full justify-start" variant="outline">
                    <GraduationCap className="h-4 w-4 mr-2" />
                    View as Student
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {showCallModal && user && lead && (
        <CallModal
          lead={lead}
          callerId={user.id}
          callerName={user.name}
          onClose={() => setShowCallModal(false)}
          onComplete={handleCallComplete}
        />
      )}

      {showConversionModal && user && lead && (
        <ConversionModal
          lead={lead}
          converterId={user.id}
          converterName={user.name}
          onClose={() => setShowConversionModal(false)}
          onComplete={handleConversionComplete}
        />
      )}
    </div>
  )
}