'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useAuth } from '@/context/auth-context'
import { Breadcrumb } from '@/components/layout/breadcrumb'
import { PageHeader, EmptyState, PermissionGuard } from '@/components/shared'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getLeads, claimLead } from '@/lib/api/leads'
import { formatDate } from '@/lib/utils'
import { canClaimLead } from '@/lib/permissions'
import { COURSE_FEES } from '@/lib/constants'
import type { Lead } from '@/lib/db/queries/leads'
import { Users, Phone, Flame, Zap, Snowflake, Clock, GraduationCap, AlertCircle, Loader2 } from 'lucide-react'
import { useToast } from '@/components/ui/toast'
import { useRouter } from 'next/navigation'

export default function LeadPoolPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const [claimingLeadId, setClaimingLeadId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [leads, setLeads] = useState<Lead[]>([])

  useEffect(() => {
    async function fetchLeads() {
      try {
        setLoading(true)
        const result = await getLeads()
        setLeads(result.data)
      } catch (error) {
        console.error('Failed to fetch leads:', error)
        toast({
          title: 'Error',
          description: 'Failed to load leads. Please try again.',
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
    }
    fetchLeads()
  }, [toast])

  const unclaimedLeads = leads.filter(l => !l.assignedTo)

  const sortedLeads = useMemo(() => {
    return [...unclaimedLeads].sort((a, b) => {
      const priorityOrder = { hot: 0, warm: 1, cold: 2 }
      return priorityOrder[a.priority] - priorityOrder[b.priority]
    })
  }, [unclaimedLeads])

  if (!user) return null

  const canClaim = canClaimLead(user)

  const handleClaimAndCall = async (leadId: string) => {
    if (!canClaim) {
      toast({
        title: 'Permission denied',
        description: 'You do not have permission to claim leads.',
        variant: 'destructive',
      })
      return
    }

    setClaimingLeadId(leadId)
    
    try {
      await claimLead(leadId)
      
      toast({
        title: 'Lead claimed',
        description: 'Redirecting to call page...',
      })

      router.push(`/leads/${leadId}?action=call`)
    } catch (error) {
      console.error('Failed to claim lead:', error)
      toast({
        title: 'Error',
        description: 'Failed to claim lead. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setClaimingLeadId(null)
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'hot': return <Flame className="h-4 w-4 text-red-500" />
      case 'warm': return <Zap className="h-4 w-4 text-orange-500" />
      case 'cold': return <Snowflake className="h-4 w-4 text-blue-500" />
      default: return null
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'hot': return 'border-red-200 bg-red-50'
      case 'warm': return 'border-orange-200 bg-orange-50'
      case 'cold': return 'border-blue-200 bg-blue-50'
      default: return 'border-gray-200'
    }
  }

  const getTimeSinceCreated = (date: string) => {
    const now = new Date()
    const created = new Date(date)
    const diff = now.getTime() - created.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(hours / 24)
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`
    return 'Just now'
  }

  return (
    <PermissionGuard check={canClaimLead} fallbackMessage="Only Sales Representatives can access the Lead Pool.">
      <div className="space-y-6">
        <Breadcrumb />
      
      <PageHeader
        title="Lead Pool"
        description={`${unclaimedLeads.length} unclaimed leads available`}
      />

      {loading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      ) : unclaimedLeads.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <EmptyState
              icon={Users}
              title="No unclaimed leads"
              description="All leads have been claimed. Check back later for new leads."
            />
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="flex items-center gap-3 py-4">
              <AlertCircle className="h-5 w-5 text-blue-600" />
              <div className="flex-1">
                <p className="font-medium text-blue-800">Claim leads quickly!</p>
                <p className="text-sm text-blue-600">Hot leads are high-priority. Claim them before others do.</p>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-3">
            {sortedLeads.map((lead) => {
              const estValue = lead.courseInterested ? (COURSE_FEES[lead.courseInterested] || 0) : 0
              
              return (
                <Card key={lead.id} className={`${getPriorityColor(lead.priority)} border-2`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {getPriorityIcon(lead.priority)}
                          <h3 className="font-semibold text-lg">{lead.name}</h3>
                          <Badge variant="outline" className="capitalize">
                            {lead.priority}
                          </Badge>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-2">
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {lead.phone}
                          </span>
                          <span className="flex items-center gap-1">
                            <GraduationCap className="h-3 w-3" />
                            {lead.courseInterested}
                          </span>
                          <span className="capitalize">{lead.source}</span>
                        </div>

                        <div className="flex items-center gap-4 text-sm">
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            Created {getTimeSinceCreated(lead.createdAt)}
                          </span>
                          <span className="font-medium text-green-700">
                            Est. Value: ₹{estValue.toLocaleString()}
                          </span>
                        </div>

                        {lead.notes && (
                          <p className="text-sm text-muted-foreground mt-2 bg-white/50 p-2 rounded">
                            {lead.notes}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-col gap-2">
                        <Button
                          onClick={() => handleClaimAndCall(lead.id)}
                          disabled={claimingLeadId === lead.id}
                          className="whitespace-nowrap"
                        >
                          <Phone className="h-4 w-4 mr-2" />
                          {claimingLeadId === lead.id ? 'Claiming...' : 'Claim & Call'}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          <div className="flex items-center justify-center gap-6 pt-4">
            <div className="flex items-center gap-2">
              <Flame className="h-4 w-4 text-red-500" />
              <span className="text-sm">Hot - High priority</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-orange-500" />
              <span className="text-sm">Warm - Medium priority</span>
            </div>
            <div className="flex items-center gap-2">
              <Snowflake className="h-4 w-4 text-blue-500" />
              <span className="text-sm">Cold - Low priority</span>
            </div>
          </div>
        </>
      )}
    </div>
    </PermissionGuard>
  )
}