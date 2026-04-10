'use client'

import React, { useState } from 'react'
import { Bug, X, Loader2, Camera, AlertCircle } from 'lucide-react'
import { useAuth } from '@/context/auth-context'
import { useToast } from '@/components/ui/toast'
import { canCreateBugReport } from '@/lib/client-permissions'
import { createBug } from '@/lib/api/bugs'
import type { BugSeverity } from '@/types/bug'
import { getErrorMessage } from '@/lib/utils'

interface BugReportButtonProps {
  className?: string
}

export function BugReportButton({ className }: BugReportButtonProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    severity: 'medium' as BugSeverity,
    screenshot: null as File | null,
  })
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null)
  const [detectedError, setDetectedError] = useState<string | null>(null)

  // Don't show if user can't report bugs
  if (!user || !canCreateBugReport(user)) {
    return null
  }

  // Detect any visible error toasts/popups on the page
  const detectErrors = () => {
    // Check for visible error toasts
    const errorToasts = document.querySelectorAll('[data-sonner-toast][data-type="error"]')
    if (errorToasts.length > 0) {
      const messages = Array.from(errorToasts)
        .map((t) => t.textContent)
        .filter(Boolean)
        .join('; ')
      return messages || null
    }

    // Check for error alert boxes
    const errorAlerts = document.querySelectorAll('[role="alert"].error, .error-message, .toast-error')
    if (errorAlerts.length > 0) {
      const messages = Array.from(errorAlerts)
        .map((a) => a.textContent)
        .filter(Boolean)
        .join('; ')
      return messages || null
    }

    return null
  }

  const handleOpen = () => {
    // Auto-detect errors when opening
    const error = detectErrors()
    setDetectedError(error)
    setIsOpen(true)
  }

  const handleClose = () => {
    setIsOpen(false)
    setFormData({
      title: '',
      description: '',
      severity: 'medium',
      screenshot: null,
    })
    setScreenshotPreview(null)
    setDetectedError(null)
  }

  const handleScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'File too large',
          description: 'Screenshot must be less than 5MB',
          variant: 'destructive',
        })
        return
      }

      setFormData({ ...formData, screenshot: file })

      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setScreenshotPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async () => {
    if (!formData.title.trim() || !formData.description.trim()) {
      toast({
        title: 'Missing fields',
        description: 'Please fill in the title and description',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)
    try {
      // Upload screenshot if provided (for now, store as base64 data URL)
      let screenshotUrl: string | undefined
      let screenshotFilename: string | undefined
      let screenshotSize: number | undefined

      if (formData.screenshot && screenshotPreview) {
        screenshotUrl = screenshotPreview
        screenshotFilename = formData.screenshot.name
        screenshotSize = formData.screenshot.size
      }

      await createBug({
        title: formData.title,
        description: formData.description,
        severity: formData.severity,
        pageUrl: window.location.href,
        errorContext: detectedError || undefined,
        userAgent: navigator.userAgent,
        screenshotUrl,
        screenshotFilename,
        screenshotSize,
      })

      toast({
        title: 'Bug reported',
        description: 'Thank you for your feedback! Our team will investigate.',
      })

      handleClose()
    } catch (error) {
      toast({
        title: 'Failed to submit bug report',
        description: getErrorMessage(error, 'Please try again later.'),
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={handleOpen}
        className={`fixed bottom-4 right-4 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors ${className}`}
        title="Report a Bug"
      >
        <Bug className="h-5 w-5" />
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/80"
            onClick={handleClose}
          />

          {/* Modal Content */}
          <div className="relative z-10 w-full max-w-lg rounded-lg border bg-background p-6 shadow-lg">
            {/* Close Button */}
            <button
              onClick={handleClose}
              className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Header */}
            <div className="mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Bug className="h-5 w-5 text-primary" />
                Report a Bug
              </h2>
              <p className="text-sm text-muted-foreground">
                Help us improve by reporting issues you encounter.
              </p>
            </div>

            {/* Form */}
            <div className="space-y-4">
              {/* Auto-captured info */}
              <div className="rounded-md bg-muted p-3 text-sm">
                <div className="font-medium mb-1">Auto-captured details:</div>
                <div className="text-muted-foreground space-y-1">
                  <div>
                    <span className="font-medium">Page:</span> {window.location.pathname}
                  </div>
                  {detectedError && (
                    <div className="text-destructive">
                      <span className="font-medium">Detected error:</span> {detectedError}
                    </div>
                  )}
                </div>
              </div>

              {/* Title */}
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Title <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Brief description of the bug"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Description <span className="text-destructive">*</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="What happened? What did you expect to happen?"
                  rows={4}
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              {/* Severity */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Severity</label>
                <select
                  value={formData.severity}
                  onChange={(e) =>
                    setFormData({ ...formData, severity: e.target.value as BugSeverity })
                  }
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="low">Low - Minor issue, workaround available</option>
                  <option value="medium">Medium - Affects functionality</option>
                  <option value="high">High - Major feature broken</option>
                  <option value="critical">Critical - Blocking work</option>
                </select>
              </div>

              {/* Screenshot */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Screenshot (optional)</label>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-2 px-4 py-2 border rounded-md cursor-pointer hover:bg-muted transition-colors">
                    <Camera className="h-4 w-4" />
                    <span className="text-sm">
                      {formData.screenshot ? formData.screenshot.name : 'Upload screenshot'}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleScreenshotChange}
                      className="hidden"
                    />
                  </label>
                  {formData.screenshot && (
                    <button
                      type="button"
                      onClick={() => {
                        setFormData({ ...formData, screenshot: null })
                        setScreenshotPreview(null)
                      }}
                      className="text-sm text-muted-foreground hover:text-foreground"
                    >
                      Remove
                    </button>
                  )}
                </div>
                {screenshotPreview && (
                  <img
                    src={screenshotPreview}
                    alt="Screenshot preview"
                    className="mt-2 max-h-40 rounded border"
                  />
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={handleClose}
                className="px-4 py-2 text-sm font-medium rounded-md border hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin inline" />
                    Submitting...
                  </>
                ) : (
                  'Submit Report'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}