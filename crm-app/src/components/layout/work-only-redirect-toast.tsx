'use client'

import { useEffect, useRef } from 'react'
import { useAuth } from '@/context/auth-context'
import { isWorkOnlyUser } from '@/lib/client-permissions'
import { useToast } from '@/components/ui/toast'

const STORAGE_KEY = 'sq-work-only-redirect-notify'

export function WorkOnlyRedirectToast() {
  const { user } = useAuth()
  const { toast } = useToast()
  const shownRef = useRef(false)

  useEffect(() => {
    if (!user || !isWorkOnlyUser(user)) return
    if (shownRef.current) return
    if (typeof window === 'undefined') return
    try {
      if (sessionStorage.getItem(STORAGE_KEY) === '1') {
        sessionStorage.removeItem(STORAGE_KEY)
        shownRef.current = true
        toast({
          title: 'Limited workspace access',
          description:
            'Your account can use Tasks, Timesheets, and Attendance only. Other areas are hidden.',
        })
      }
    } catch {
      /* sessionStorage unavailable */
    }
  }, [user, toast])

  return null
}

export function markWorkOnlyRedirect() {
  try {
    sessionStorage.setItem(STORAGE_KEY, '1')
  } catch {
    /* ignore */
  }
}
