'use client'

import { Breadcrumb } from '@/components/layout/breadcrumb'
import { SettingsSubNav } from '@/components/settings/settings-subnav'

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-6">
      <Breadcrumb />
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your account and organization</p>
      </div>
      <SettingsSubNav />
      {children}
    </div>
  )
}
