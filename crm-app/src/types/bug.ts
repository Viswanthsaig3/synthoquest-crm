export type BugStatus = 'open' | 'in_progress' | 'closed'
export type BugSeverity = 'low' | 'medium' | 'high' | 'critical'

export interface BugHistoryEntry {
  id: string
  bugId: string
  userId: string
  userName?: string
  action: 'created' | 'status_changed' | 'assigned' | 'screenshot_deleted' | 'resolved'
  oldValue?: string
  newValue?: string
  createdAt: string
}

export interface Bug {
  id: string
  title: string
  description: string
  severity: BugSeverity
  status: BugStatus

  // Reporter info (auto-captured)
  reportedBy: string
  reporterName?: string
  reporterEmail?: string
  reporterRole?: string
  pageUrl: string
  errorContext?: string
  userAgent?: string

  // Screenshot
  screenshotUrl?: string
  screenshotFilename?: string
  screenshotSize?: number

  // Assignment
  assignedTo?: string
  assignedToName?: string
  assignedAt?: string
  assignedBy?: string

  // Resolution
  resolvedAt?: string
  resolvedBy?: string
  resolutionNotes?: string

  createdAt: string
  updatedAt: string
}

export interface BugReportSubmission {
  title: string
  description: string
  severity: BugSeverity
  screenshot?: File | null
  errorContext?: string
}

export interface BugFilters {
  status?: BugStatus
  severity?: BugSeverity
  assignedTo?: string
  search?: string
  page?: number
  limit?: number
}