'use client'

import { useAuth } from '@/context/auth-context'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ShieldX, ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface PermissionGuardProps {
  children: React.ReactNode
  check: (user: NonNullable<ReturnType<typeof useAuth>['user']>) => boolean
  fallbackMessage?: string
}

export function PermissionGuard({ children, check, fallbackMessage }: PermissionGuardProps) {
  const { user } = useAuth()
  const router = useRouter()

  if (!user) {
    return null
  }

  if (!check(user)) {
    return (
      <div className="flex items-center justify-center min-h-[400px] p-8">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <ShieldX className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-muted-foreground mb-6">
              {fallbackMessage || "You don't have permission to access this page. Please contact your administrator if you believe this is an error."}
            </p>
            <Button onClick={() => router.back()} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return <>{children}</>
}