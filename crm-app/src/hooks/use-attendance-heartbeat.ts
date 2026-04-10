'use client'

import { useEffect, useRef, useCallback } from 'react'

interface HeartbeatSettings {
  heartbeatIntervalMinutes: number
  inactivityTimeoutMinutes: number
  autoCheckoutEnabled: boolean
}

interface UseAttendanceHeartbeatOptions {
  isCheckedIn: boolean
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
  const { isCheckedIn, onAutoCheckout, onError } = options
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const lastHeartbeatRef = useRef<Date | null>(null)
  const settingsRef = useRef<HeartbeatSettings | null>(null)
  const isActiveRef = useRef<boolean>(true)
  const isFetchingSettingsRef = useRef<boolean>(false)

  const fetchSettings = useCallback(async (): Promise<HeartbeatSettings | null> => {
    if (isFetchingSettingsRef.current) return null
    isFetchingSettingsRef.current = true
    
    try {
      const response = await fetch('/api/attendance/heartbeat', { method: 'GET' })
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
  }, [])

  const sendHeartbeat = useCallback(async (): Promise<void> => {
    if (!isCheckedIn || !isActiveRef.current) return
    if (document.visibilityState !== 'visible') {
      return
    }

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
        headers: { 'Content-Type': 'application/json' },
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
  }, [isCheckedIn, onAutoCheckout, onError])

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

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
    }
  }, [isCheckedIn, sendHeartbeat, fetchSettings])

  return {
    sendHeartbeat,
    lastHeartbeatTime: lastHeartbeatRef.current,
    isActive: isActiveRef.current,
  }
}