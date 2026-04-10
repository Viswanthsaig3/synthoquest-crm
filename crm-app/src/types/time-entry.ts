export type TimeEntryStatus = 'pending' | 'approved' | 'rejected'
export type AttendanceStatus = 'present' | 'late' | 'absent' | 'half_day'
export type GeofenceReferenceType = 'office' | 'home' | 'none'

export interface TimeEntry {
  id: string
  userId: string
  date: string
  startTime: string
  endTime: string
  hours: number
  description: string
  taskId?: string
  projectId?: string
  status: TimeEntryStatus
  submittedAt: string
  approvedAt?: string
  approvedBy?: string
  rejectedAt?: string
  rejectedBy?: string
  rejectionReason?: string
  createdAt: string
  updatedAt: string
  deletedAt?: string
  user?: {
    id: string
    name: string
    email: string
    department: string
    role: string
    avatar?: string
  }
}

export type AutoCheckoutReason = 'inactivity_timeout' | 'no_heartbeat' | 'exceeded_max_hours' | 'cross_midnight' | 'stale_previous_day' | 'logout'
export type AdjustmentType = 'manual_correction' | 'auto_checkout_reversal' | 'time_added' | 'time_removed' | 'status_change'

/** One check-in → check-out work block (multiple per day allowed). */
export interface AttendanceRecord {
  id: string
  userId: string
  date: string
  checkInTime: string | null
  checkOutTime: string | null
  checkInLat: number | null
  checkInLng: number | null
  checkOutLat: number | null
  checkOutLng: number | null
  checkInNearestType: GeofenceReferenceType | null
  checkInDistanceMeters: number | null
  checkInRadiusMeters: number | null
  checkInInRadius: boolean | null
  checkOutNearestType: GeofenceReferenceType | null
  checkOutDistanceMeters: number | null
  checkOutRadiusMeters: number | null
  checkOutInRadius: boolean | null
  totalHours: number
  status: AttendanceStatus
  isLate: boolean
  lateByMinutes: number
  isManual: boolean
  manualEntryBy?: string
  notes?: string
  lastActivity?: string | null
  autoCheckout?: boolean
  autoCheckoutReason?: AutoCheckoutReason | null
  ipAddress?: string | null
  userAgent?: string | null
  deviceFingerprint?: string | null
  heartbeatCount?: number
  suspiciousFlags?: string[]
  createdAt: string
  updatedAt: string
  deletedAt?: string
}

/** Aggregated view for GET /api/attendance/today (multi-session days). */
export interface TodayAttendanceSummary {
  date: string
  sessions: AttendanceRecord[]
  /** Session with no check-out yet, if any */
  openSession: AttendanceRecord | null
  /** Sum of total_hours from completed sessions today */
  completedHoursToday: number
  /** Completed hours plus elapsed time on open session (approximate) */
  totalHoursTodayApprox: number
}

export interface UserHomeLocation {
  userId: string
  latitude: number
  longitude: number
  radiusMeters: number
  label?: string
  updatedAt: string
  updatedBy?: string
}

export interface OfficeLocationSettings {
  officeLat: number | null
  officeLng: number | null
  allowedRadiusMeters: number
  requireGeolocation: boolean
  updatedAt?: string
}

export interface AttendanceGeofenceWarning {
  id: string
  attendanceRecordId?: string | null
  userId: string
  userName?: string
  userEmail?: string
  eventType: 'check_in' | 'check_out'
  latitude: number | null
  longitude: number | null
  nearestType: GeofenceReferenceType
  distanceMeters: number | null
  allowedRadiusMeters: number | null
  warningReason: string | null
  status: 'open' | 'reviewed'
  createdAt: string
  reviewedAt?: string | null
  reviewedBy?: string | null
  reviewNote?: string | null
}

export interface WorkSchedule {
  id: string
  userId: string
  workStartTime: string
  workEndTime: string
  lateThresholdMinutes: number
  lunchBreakMinutes: number
  workDays: string
  effectiveFrom: string
  createdAt: string
  updatedAt: string
}

export interface OrganizationSettings {
  id: string
  defaultWorkStartTime: string
  defaultWorkEndTime: string
  defaultLateThresholdMinutes: number
  minEntryMinutes: number
  maxHoursPerDay: number
  requireDescription: boolean
  minDescriptionLength: number
  autoApprove: boolean
  approvalRequired: boolean
  requireGeolocation: boolean
  officeLat: number | null
  officeLng: number | null
  allowedRadiusMeters: number
  inactivityTimeoutMinutes?: number
  autoCheckoutEnabled?: boolean
  heartbeatIntervalMinutes?: number
  autoCheckoutOnLogout?: boolean
  updatedAt: string
}

export interface AttendanceAdjustment {
  id: string
  attendanceRecordId: string
  adjustedBy: string
  adjustedByName?: string
  fieldName: string
  oldValue: string | null
  newValue: string | null
  adjustmentReason: string
  adjustmentType: AdjustmentType
  createdAt: string
}

export interface AutoCheckoutSettings {
  inactivityTimeoutMinutes: number
  autoCheckoutEnabled: boolean
  heartbeatIntervalMinutes: number
  maxHoursPerDay: number
  autoCheckoutOnLogout: boolean
}

export type SecurityEventSeverity = 'low' | 'medium' | 'high' | 'critical'
export type SecurityEventType = 'multiple_sessions' | 'device_change' | 'rapid_heartbeat' | 'location_mismatch' | 'suspicious_pattern'

export interface AttendanceSecurityEvent {
  id: string
  userId: string
  attendanceRecordId: string | null
  eventType: SecurityEventType
  severity: SecurityEventSeverity
  details: Record<string, unknown>
  ipAddress: string | null
  userAgent: string | null
  detectedAt: string
  reviewedAt: string | null
  reviewedBy: string | null
  reviewNotes: string | null
  user?: {
    id: string
    name: string
    email: string
  } | null
}

export interface CreateTimeEntryInput {
  date: string
  startTime: string
  endTime: string
  description: string
  taskId?: string
  projectId?: string
}

export interface TimeEntryFilters {
  userId?: string
  userIds?: string[]
  date?: string
  fromDate?: string
  toDate?: string
  status?: TimeEntryStatus
  page?: number
  limit?: number
}
