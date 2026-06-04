'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import type { AttendanceRecord, TodayAttendanceSummary } from '@/types/time-entry'
import { fetchWithAccessTokenRefresh } from '@/lib/api/auth-fetch'
import { useAttendanceHeartbeat } from '@/hooks/use-attendance-heartbeat'
import { useAuth } from '@/context/auth-context'

interface AttendanceContextValue {
  /** Today's attendance summary from /api/attendance/today */
  summary: TodayAttendanceSummary | null
  /** Current open session (null if not checked in) */
  openSession: AttendanceRecord | null
  /** Whether the user is currently checked in */
  isCheckedIn: boolean
  /** Loading state for initial fetch */
  loading: boolean
  /** Whether an auto-checkout was detected */
  showAutoCheckoutAlert: boolean
  /** Dismiss the auto-checkout alert */
  dismissAutoCheckoutAlert: () => void
  /** Re-fetch today's attendance (call after check-in/check-out) */
  refreshAttendance: () => Promise<void>
}

const AttendanceContext = createContext<AttendanceContextValue | undefined>(undefined)

export function AttendanceProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth()
  const [summary, setSummary] = useState<TodayAttendanceSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAutoCheckoutAlert, setShowAutoCheckoutAlert] = useState(false)

  const openSession = summary?.openSession ?? null
  const isCheckedIn = Boolean(openSession)

  const fetchAttendance = useCallback(async () => {
    if (!isAuthenticated) {
      setSummary(null)
      setLoading(false)
      return
    }

    try {
      const res = await fetchWithAccessTokenRefresh('/api/attendance/today')
      if (res.ok) {
        const data = await res.json()
        setSummary(data.data || null)
      }
    } catch (error) {
      console.error('[AttendanceProvider] Error fetching attendance:', error)
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated])

  // Fetch attendance on mount and when auth state changes
  useEffect(() => {
    fetchAttendance()
  }, [fetchAttendance])

  const refreshAttendance = useCallback(async () => {
    await fetchAttendance()
  }, [fetchAttendance])

  const handleAutoCheckout = useCallback(() => {
    setShowAutoCheckoutAlert(true)
    fetchAttendance()
  }, [fetchAttendance])

  const handleHeartbeatError = useCallback((error: Error) => {
    console.error('[AttendanceProvider] Heartbeat error:', error)
  }, [])

  const dismissAutoCheckoutAlert = useCallback(() => {
    setShowAutoCheckoutAlert(false)
  }, [])

  // Global heartbeat — runs on every dashboard page as long as user is checked in
  useAttendanceHeartbeat({
    isCheckedIn,
    sessionId: openSession?.id,
    onAutoCheckout: handleAutoCheckout,
    onError: handleHeartbeatError,
  })

  return (
    <AttendanceContext.Provider
      value={{
        summary,
        openSession,
        isCheckedIn,
        loading,
        showAutoCheckoutAlert,
        dismissAutoCheckoutAlert,
        refreshAttendance,
      }}
    >
      {children}
    </AttendanceContext.Provider>
  )
}

export function useAttendance() {
  const context = useContext(AttendanceContext)
  if (context === undefined) {
    throw new Error('useAttendance must be used within an AttendanceProvider')
  }
  return context
}
