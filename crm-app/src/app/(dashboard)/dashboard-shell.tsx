'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/context/auth-context'
import { Sidebar, SidebarNavPanel } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { WorkOnlyRedirectToast, markWorkOnlyRedirect } from '@/components/layout/work-only-redirect-toast'
import { ToastProvider } from '@/components/ui/toast'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { hasPermission, isWorkOnlyUser } from '@/lib/client-permissions'
import { BugReportButton } from '@/components/bugs/bug-report-button'

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { isAuthenticated, user } = useAuth()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, router])

  useEffect(() => {
    setMobileNavOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!isAuthenticated || !user) return
    if (!isWorkOnlyUser(user)) return

    const attendanceAllowed =
      !!user &&
      (hasPermission(user, 'attendance.checkin') || hasPermission(user, 'attendance.checkout'))

    const leavesAllowed =
      !!user &&
      (hasPermission(user, 'leaves.apply') || hasPermission(user, 'leaves.approve'))

    const allowed =
      pathname === '/' ||
      pathname === '/tasks' ||
      pathname === '/timesheets' ||
      pathname.startsWith('/tasks/') ||
      pathname.startsWith('/timesheets/') ||
      (attendanceAllowed &&
        (pathname === '/attendance' || pathname.startsWith('/attendance/'))) ||
      (leavesAllowed &&
        (pathname === '/leaves' || pathname.startsWith('/leaves/')))

    if (!allowed) {
      markWorkOnlyRedirect()
      router.replace('/tasks')
    }
  }, [isAuthenticated, pathname, router, user])

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <ToastProvider>
      <WorkOnlyRedirectToast />
      <div className="flex h-screen min-h-0 bg-background">
        <Sidebar />
        <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
          <SheetContent side="left" className="w-[min(100vw-1rem,20rem)] p-0 flex flex-col">
            <SheetTitle className="sr-only">Main navigation</SheetTitle>
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden border-r bg-card">
              <div className="border-b p-4">
                <p className="text-lg font-bold text-primary">SynthoQuest</p>
              </div>
              <SidebarNavPanel
                variant="drawer"
                onNavigate={() => setMobileNavOpen(false)}
              />
            </div>
          </SheetContent>
        </Sheet>
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <Header onMobileMenuOpen={() => setMobileNavOpen(true)} />
          <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
        </div>
        <BugReportButton />
      </div>
    </ToastProvider>
  )
}
