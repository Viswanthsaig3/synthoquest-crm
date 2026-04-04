import { CallRecord, CallOutcome } from '@/types/lead'
import { generateId } from '@/lib/utils'

export interface CallOptions {
  phoneNumber: string
  leadId: string
  callerId: string
  callerName: string
}

export interface ActiveCall {
  id: string
  leadId: string
  phoneNumber: string
  callerId: string
  callerName: string
  startedAt: Date
  status: 'ringing' | 'connected' | 'ended'
}

export interface CallResult {
  callId: string
  duration: number
  outcome: CallOutcome
  remarks: string
}

type CallListener = (call: ActiveCall | null) => void

class VoIPService {
  private activeCall: ActiveCall | null = null
  private listeners: CallListener[] = []
  private timerInterval: NodeJS.Timeout | null = null
  private startTime: Date | null = null

  subscribe(listener: CallListener): () => void {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener)
    }
  }

  private notify(): void {
    this.listeners.forEach(listener => listener(this.activeCall))
  }

  async initiateCall(options: CallOptions): Promise<ActiveCall> {
    if (this.activeCall) {
      throw new Error('A call is already in progress')
    }

    const call: ActiveCall = {
      id: generateId(),
      leadId: options.leadId,
      phoneNumber: options.phoneNumber,
      callerId: options.callerId,
      callerName: options.callerName,
      startedAt: new Date(),
      status: 'ringing',
    }

    this.activeCall = call
    this.startTime = new Date()
    this.notify()

    await this.simulateRinging()

    if (this.activeCall) {
      this.activeCall.status = 'connected'
      this.notify()
    }

    return call
  }

  private async simulateRinging(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, 2000))
  }

  endCall(outcome: CallOutcome, remarks: string): CallResult | null {
    if (!this.activeCall || !this.startTime) {
      return null
    }

    const endedAt = new Date()
    const duration = Math.floor((endedAt.getTime() - this.startTime.getTime()) / 1000)

    const result: CallResult = {
      callId: this.activeCall.id,
      duration,
      outcome,
      remarks,
    }

    this.activeCall.status = 'ended'
    this.notify()

    this.activeCall = null
    this.startTime = null
    this.notify()

    return result
  }

  getActiveCall(): ActiveCall | null {
    return this.activeCall
  }

  getCallDuration(): number {
    if (!this.startTime) return 0
    return Math.floor((new Date().getTime() - this.startTime.getTime()) / 1000)
  }

  formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  isCallActive(): boolean {
    return this.activeCall !== null && this.activeCall.status !== 'ended'
  }
}

export const voipService = new VoIPService()

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}