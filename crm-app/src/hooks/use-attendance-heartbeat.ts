'use client'

import { useEffect, useRef, useCallback } from 'react'
import { getAccessToken } from '@/lib/api/client'

interface HeartbeatSettings {
  heartbeatIntervalMinutes: number
  inactivityTimeoutMinutes: number
  autoCheckoutEnabled: boolean
}

interface UseAttendanceHeartbeatOptions {
  isCheckedIn: boolean
  sessionId?: string | null
  onAutoCheckout?: () => void
  onError?: (error: Error) => void
}

interface UseAttendanceHeartbeatReturn {
  sendHeartbeat: () => Promise<void>
  lastHeartbeatTime: Date | null
  isActive: boolean
}

export function useAttendanceHeartbeat(
  options: UseAttendanceHeartbeatOptions
): UseAttendanceHeartbeatReturn {
  const { isCheckedIn, sessionId, onAutoCheckout, onError } = options
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const lastHeartbeatRef = useRef<Date | null>(null)
  const settingsRef = useRef<HeartbeatSettings | null>(null)
  const isActiveRef = useRef<boolean>(true)
  const isFetchingSettingsRef = useRef<boolean>(false)
  const isCheckedInRef = useRef<boolean>(isCheckedIn)
  const sessionIdRef = useRef<string | null | undefined>(sessionId)

  useEffect(() => {
    isCheckedInRef.current = isCheckedIn
    sessionIdRef.current = sessionId ?? null
  }, [isCheckedIn, sessionId])

  const getAuthHeaders = useCallback(() => {
    const token = getAccessToken()
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    }
  }, [])

  const fetchSettings = useCallback(async (): Promise<HeartbeatSettings | null> => {
    if (isFetchingSettingsRef.current) return null
    isFetchingSettingsRef.current = true
    
    try {
      const response = await fetch('/api/attendance/heartbeat', {
        method: 'GET',
        headers: getAuthHeaders(),
      })
      if (!response.ok) {
        throw new Error('Failed to fetch heartbeat settings')
      }
      const data = await response.json()
      settingsRef.current = data.data
      return data.data
    } catch (error) {
      console.error('[Heartbeat] Failed to fetch settings:', error)
      return null
    } finally {
      isFetchingSettingsRef.current = false
    }
  }, [getAuthHeaders])

  const sendHeartbeat = useCallback(async (): Promise<void> => {
    if (!isCheckedInRef.current || !isActiveRef.current) return

    const now = new Date()
    const lastHeartbeat = lastHeartbeatRef.current
    
    if (settingsRef.current) {
      const minInterval = (settingsRef.current.heartbeatIntervalMinutes - 1) * 60 * 1000
      if (lastHeartbeat && now.getTime() - lastHeartbeat.getTime() < minInterval) {
        return
      }
    }

    try {
      const response = await fetch('/api/attendance/heartbeat', {
        method: 'POST',
        headers: getAuthHeaders(),
      })

      if (!response.ok) {
        const data = await response.json()
        if (data.error === 'No active check-in session') {
          if (onAutoCheckout) {
            onAutoCheckout()
          }
          return
        }
        throw new Error(data.error || 'Failed to send heartbeat')
      }

      lastHeartbeatRef.current = now
    } catch (error) {
      console.error('[Heartbeat] Error:', error)
      if (onError) {
        onError(error instanceof Error ? error : new Error('Heartbeat failed'))
      }
    }
  }, [getAuthHeaders, onAutoCheckout, onError])

  const sendFinalHeartbeat = useCallback(() => {
    if (!isCheckedInRef.current) return
    
    const token = getAccessToken()
    if (!token) return
    
    const payload = JSON.stringify({
      token: token,
      sessionId: sessionIdRef.current,
      timestamp: new Date().toISOString(),
      event: 'page_unload',
    })
    
    if (navigator.sendBeacon) {
      const blob = new Blob([payload], { type: 'application/json' })
      navigator.sendBeacon('/api/attendance/heartbeat/final', blob)
    } else {
      fetch('/api/attendance/heartbeat/final', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        keepalive: true,
      }).catch(() => {})
    }
  }, [])

  useEffect(() => {
    if (!isCheckedIn) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      lastHeartbeatRef.current = null
      settingsRef.current = null
      return
    }

    const initHeartbeat = async () => {
      const settings = await fetchSettings()
      if (!settings) {
        settingsRef.current = {
          heartbeatIntervalMinutes: 5,
          inactivityTimeoutMinutes: 30,
          autoCheckoutEnabled: true,
        }
      }

      sendHeartbeat()

      const intervalMs = (settingsRef.current?.heartbeatIntervalMinutes ?? 5) * 60 * 1000
      intervalRef.current = setInterval(sendHeartbeat, intervalMs)
    }

    initHeartbeat()

    const handleVisibilityChange = () => {
      isActiveRef.current = document.visibilityState === 'visible'
      if (isActiveRef.current && isCheckedIn) {
        sendHeartbeat()
      }
    }

    const handleFocus = () => {
      if (isCheckedIn) {
        sendHeartbeat()
      }
    }

    const handleBeforeUnload = () => {
      sendFinalHeartbeat()
    }

    const handlePageHide = () => {
      sendFinalHeartbeat()
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)
    window.addEventListener('beforeunload', handleBeforeUnload)
    window.addEventListener('pagehide', handlePageHide)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('beforeunload', handleBeforeUnload)
      window.removeEventListener('pagehide', handlePageHide)
    }
  }, [isCheckedIn, sendHeartbeat, fetchSettings, sendFinalHeartbeat])

  return {
    sendHeartbeat,
    lastHeartbeatTime: lastHeartbeatRef.current,
    isActive: isActiveRef.current,
  }
}