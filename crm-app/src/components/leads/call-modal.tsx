'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { CallRecord, CallOutcome, Lead } from '@/types/lead'
import { CALL_OUTCOMES } from '@/lib/constants'
import { voipService, formatDuration } from '@/lib/voip-service'
import { Phone, PhoneOff, Mic, MicOff, Volume2, X, CheckCircle, Clock, Calendar } from 'lucide-react'
import { useToast } from '@/components/ui/toast'

interface CallModalProps {
  lead: Lead
  callerId: string
  callerName: string
  onClose: () => void
  onComplete: (callRecord: Partial<CallRecord>) => void
}

export function CallModal({ lead, callerId, callerName, onClose, onComplete }: CallModalProps) {
  const { toast } = useToast()
  const [callStatus, setCallStatus] = useState<'idle' | 'ringing' | 'connected' | 'ended'>('idle')
  const [duration, setDuration] = useState(0)
  const [outcome, setOutcome] = useState<CallOutcome>('answered')
  const [remarks, setRemarks] = useState('')
  const [followUpRequired, setFollowUpRequired] = useState(false)
  const [followUpDate, setFollowUpDate] = useState('')
  const [isMuted, setIsMuted] = useState(false)
  const [isSpeaker, setIsSpeaker] = useState(false)

  useEffect(() => {
    startCall()
    return () => {
      voipService.endCall('no_answer', '')
    }
  }, [])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (callStatus === 'connected') {
      interval = setInterval(() => {
        setDuration(prev => prev + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [callStatus])

  const startCall = async () => {
    setCallStatus('ringing')
    
    try {
      await voipService.initiateCall({
        phoneNumber: lead.phone,
        leadId: lead.id,
        callerId,
        callerName,
      })
      setCallStatus('connected')
    } catch (error) {
      toast({
        title: 'Call failed',
        description: 'Could not initiate the call.',
        variant: 'destructive',
      })
      setCallStatus('ended')
    }
  }

  const handleEndCall = () => {
    if (callStatus === 'connected' || callStatus === 'ringing') {
      setCallStatus('ended')
      voipService.endCall(outcome, remarks)
    }
  }

  const handleSave = () => {
    if (!remarks.trim()) {
      toast({
        title: 'Remarks required',
        description: 'Please add remarks about the call.',
        variant: 'destructive',
      })
      return
    }

    const callRecord: Partial<CallRecord> = {
      leadId: lead.id,
      calledBy: callerId,
      calledByName: callerName,
      phoneNumber: lead.phone,
      startedAt: new Date(Date.now() - duration * 1000),
      endedAt: new Date(),
      duration,
      outcome,
      recordingUrl: outcome === 'answered' ? `/recordings/mock-${Date.now()}.mp3` : null,
      remarks,
      followUpRequired,
      followUpDate: followUpRequired && followUpDate ? new Date(followUpDate) : null,
    }

    onComplete(callRecord)
    onClose()
  }

  const getOutcomeIcon = (o: CallOutcome) => {
    switch (o) {
      case 'answered': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'no_answer': return <PhoneOff className="h-4 w-4 text-gray-400" />
      default: return <Phone className="h-4 w-4 text-yellow-500" />
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/80" onClick={callStatus === 'ended' ? onClose : undefined} />
      
      <Card className="fixed z-50 w-full max-w-md">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              {callStatus === 'ended' ? 'Call Ended' : 'Call in Progress'}
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="text-center py-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
              <Phone className={`h-8 w-8 ${callStatus === 'connected' ? 'text-green-500 animate-pulse' : 'text-primary'}`} />
            </div>
            <h3 className="font-semibold text-lg">{lead.name}</h3>
            <p className="text-muted-foreground">{lead.phone}</p>
            
            {callStatus === 'connected' && (
              <div className="mt-4">
                <div className="text-3xl font-mono font-bold text-primary">
                  {formatDuration(duration)}
                </div>
                <Badge variant="outline" className="mt-2 text-green-600 border-green-600">
                  Connected
                </Badge>
              </div>
            )}

            {callStatus === 'ringing' && (
              <div className="mt-4">
                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4 animate-spin" />
                  <span>Calling...</span>
                </div>
              </div>
            )}
          </div>

          {callStatus === 'connected' && (
            <div className="flex justify-center gap-4 py-2">
              <Button
                variant={isMuted ? 'default' : 'outline'}
                size="icon"
                onClick={() => setIsMuted(!isMuted)}
              >
                {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>
              <Button
                variant={isSpeaker ? 'default' : 'outline'}
                size="icon"
                onClick={() => setIsSpeaker(!isSpeaker)}
              >
                <Volume2 className="h-4 w-4" />
              </Button>
            </div>
          )}

          {callStatus === 'connected' && (
            <Button
              variant="destructive"
              className="w-full"
              onClick={handleEndCall}
            >
              <PhoneOff className="h-4 w-4 mr-2" />
              End Call
            </Button>
          )}

          {callStatus === 'ended' && (
            <>
              <div className="space-y-3 pt-4 border-t">
                <Label>Call Outcome *</Label>
                <div className="grid grid-cols-2 gap-2">
                  {CALL_OUTCOMES.slice(0, 4).map((o) => (
                    <Button
                      key={o.value}
                      variant={outcome === o.value ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setOutcome(o.value as CallOutcome)}
                      className="justify-start"
                    >
                      {getOutcomeIcon(o.value as CallOutcome)}
                      <span className="ml-2">{o.label}</span>
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Remarks *</Label>
                <Textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="What was discussed? Any important notes..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="followUp"
                    checked={followUpRequired}
                    onChange={(e) => setFollowUpRequired(e.target.checked)}
                    className="rounded"
                  />
                  <Label htmlFor="followUp" className="text-sm font-normal">
                    Schedule follow-up
                  </Label>
                </div>
                
                {followUpRequired && (
                  <Input
                    type="datetime-local"
                    value={followUpDate}
                    onChange={(e) => setFollowUpDate(e.target.value)}
                  />
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <Button variant="outline" onClick={onClose} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleSave} className="flex-1">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Save
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}