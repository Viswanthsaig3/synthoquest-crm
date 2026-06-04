import { createAdminClient } from '../server-client'
import { evaluateGeofence, haversineDistanceMeters } from '@/lib/geo/geofence'
import type {
  AttendanceGeofenceWarning,
  AttendanceRecord,
  AttendanceStatus,
  AutoCheckoutReason,
  OfficeLocationSettings,
  TodayAttendanceSummary,
  UserHomeLocation,
  AutoCheckoutSettings,
  AttendanceAdjustment,
  AdjustmentType,
} from '@/types/time-entry'

/** All sessions today + open session + rolled-up hours (multiple check-in/out per day). */
export async function getTodayAttendanceSummary(userId: string): Promise<TodayAttendanceSummary> {
  const supabase = await createAdminClient()
  const today = new Date().toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('attendance_records')
    .select('*')
    .eq('user_id', userId)
    .eq('date', today)
    .is('deleted_at', null)
    .order('check_in_time', { ascending: true })

  if (error) throw error

  const sessions = (data || []).map(transformAttendance)
  const openSession = sessions.find((s) => !s.checkOutTime) ?? null
  const completedHoursToday = sessions
    .filter((s) => s.checkOutTime)
    .reduce((sum, s) => sum + (s.totalHours || 0), 0)

  let totalHoursTodayApprox = completedHoursToday
  if (openSession?.checkInTime) {
    const elapsed =
      (Date.now() - new Date(openSession.checkInTime).getTime()) / (1000 * 60 * 60)
    totalHoursTodayApprox += Math.max(0, elapsed)
  }

  return {
    date: today,
    sessions,
    openSession,
    completedHoursToday: Math.round(completedHoursToday * 100) / 100,
    totalHoursTodayApprox: Math.round(totalHoursTodayApprox * 100) / 100,
  }
}

/**
 * Closes any open attendance sessions from previous days for a given user.
 * Calculates total_hours capped by org max_hours_per_day, marks them as
 * auto-checkout with reason 'stale_previous_day', and appends audit notes.
 *
 * Returns the count of sessions closed (0 if none were stale).
 */
async function closeStaleOpenSessions(
  userId: string,
  todayDateStr: string
): Promise<number> {
  const supabase = await createAdminClient()

  // Fetch all open sessions from ANY prior date (not today).
  const { data: staleSessions, error: fetchErr } = await supabase
    .from('attendance_records')
    .select('id, check_in_time, last_activity, date, notes')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .is('check_out_time', null)
    .neq('date', todayDateStr)
    .order('check_in_time', { ascending: true })

  if (fetchErr) throw fetchErr
  if (!staleSessions || staleSessions.length === 0) return 0

  // Get org max hours to cap the calculated total
  const { data: orgRow } = await supabase
    .from('organization_settings')
    .select('max_hours_per_day')
    .maybeSingle()
  const maxHoursPerDay = orgRow?.max_hours_per_day ?? 12

  for (const session of staleSessions) {
    const checkInDate = new Date(session.check_in_time)

    // Determine the best checkout time:
    // 1. Last heartbeat activity, if available
    // 2. Otherwise end-of-day (23:59:59) on the session's date
    // 3. Fallback: check-in + maxHoursPerDay
    let bestCheckoutTime: Date
    if (session.last_activity) {
      bestCheckoutTime = new Date(session.last_activity)
    } else {
      // End of the session's own date
      bestCheckoutTime = new Date(session.date + 'T23:59:59.000Z')
    }

    // Cap total hours at org max
    const rawHours =
      (bestCheckoutTime.getTime() - checkInDate.getTime()) / (1000 * 60 * 60)
    const cappedHours = Math.min(Math.max(0, rawHours), maxHoursPerDay)
    const cappedCheckoutTime =
      rawHours > maxHoursPerDay
        ? new Date(checkInDate.getTime() + maxHoursPerDay * 3600000)
        : bestCheckoutTime

    const { error: updateErr } = await supabase
      .from('attendance_records')
      .update({
        check_out_time: cappedCheckoutTime.toISOString(),
        total_hours: Math.round(cappedHours * 100) / 100,
        auto_checkout: true,
        auto_checkout_reason: 'stale_previous_day',
        notes:
          (session.notes || '') +
          ` [Auto-closed: stale session from ${session.date}]`,
        updated_at: new Date().toISOString(),
      })
      .eq('id', session.id)

    if (updateErr) {
      console.error(
        `Failed to auto-close stale session ${session.id}:`,
        updateErr
      )
      // Continue closing remaining sessions — don't let one failure block the rest
    }
  }

  return staleSessions.length
}

export async function checkIn(
  userId: string,
  latitude?: number,
  longitude?: number,
  notes?: string,
  metadata?: {
    ipAddress?: string
    userAgent?: string
    deviceFingerprint?: string
    ipDerivedLat?: number | null
    ipDerivedLng?: number | null
    ipGpsDistanceKm?: number | null
  },
  enforcementPolicy?: {
    blockOnVerificationFailure: boolean
    maxIpGpsDistanceKm: number
    minGpsPrecisionMeters: number
  }
): Promise<AttendanceRecord> {
  const supabase = await createAdminClient()
  const now = new Date()
  const today = now.toISOString().split('T')[0]
  const checkInTime = now.toISOString()

  const policy = enforcementPolicy || {
    blockOnVerificationFailure: true,
    maxIpGpsDistanceKm: 500,
    minGpsPrecisionMeters: 5,
  }

  await closeStaleOpenSessions(userId, today)

  const { data: openToday, error: openErr } = await supabase
    .from('attendance_records')
    .select('id')
    .eq('user_id', userId)
    .eq('date', today)
    .is('deleted_at', null)
    .is('check_out_time', null)
    .limit(1)

  if (openErr) throw openErr
  if (openToday && openToday.length > 0) {
    throw new Error('Check out of your current session before starting a new check-in.')
  }

  const { count: priorTodayCount, error: countErr } = await supabase
    .from('attendance_records')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('date', today)
    .is('deleted_at', null)

  if (countErr) throw countErr
  const isFirstSessionOfDay = (priorTodayCount ?? 0) === 0

  const { data: schedule } = await supabase
    .from('work_schedules')
    .select('*')
    .eq('user_id', userId)
    .single()

  const orgSettings = await getOfficeLocationSettings()
  const homeLocation = await getUserHomeLocation(userId)

  if (orgSettings.requireGeolocation && isFirstSessionOfDay && !homeLocation) {
    throw new Error(
      'Home location required: Please set your home/work location in Settings before checking in. ' +
      'Go to Settings → Home Location to configure your allowed check-in area.'
    )
  }

  const geofence = evaluateGeofence({
    latitude,
    longitude,
    office:
      orgSettings.officeLat !== null && orgSettings.officeLng !== null
        ? {
            latitude: orgSettings.officeLat,
            longitude: orgSettings.officeLng,
            radiusMeters: orgSettings.allowedRadiusMeters,
          }
        : null,
    home: homeLocation
      ? {
          latitude: homeLocation.latitude,
          longitude: homeLocation.longitude,
          radiusMeters: homeLocation.radiusMeters,
        }
      : null,
  })

  let spoofingDetected = false
  let spoofingReason: string | null = null

  if (homeLocation && latitude && longitude) {
    const homeDistance = haversineDistanceMeters(
      { latitude, longitude },
      { latitude: homeLocation.latitude, longitude: homeLocation.longitude }
    )
    if (homeDistance < policy.minGpsPrecisionMeters) {
      spoofingDetected = true
      spoofingReason = `GPS spoofing suspected: Position is ${homeDistance}m from reference point (below ${policy.minGpsPrecisionMeters}m threshold). Real GPS typically has 10-15m error margin.`
    }
  }

  if (metadata?.ipGpsDistanceKm && metadata.ipGpsDistanceKm > policy.maxIpGpsDistanceKm) {
    spoofingDetected = true
    spoofingReason = spoofingReason
      ? `${spoofingReason} Impossible travel detected: Client GPS is ${metadata.ipGpsDistanceKm}km from IP-derived location.`
      : `Impossible travel detected: Client GPS is ${metadata.ipGpsDistanceKm}km from IP-derived location.`
  }

  if (orgSettings.blockOnVerificationFailure === true && policy.blockOnVerificationFailure) {
    if (metadata?.ipDerivedLat === null || metadata?.ipDerivedLng === null) {
      console.warn('[checkIn] IP geolocation null, but NOT blocking - flagging instead:', {
        ip: metadata?.ipAddress,
        ipDerivedLat: metadata?.ipDerivedLat,
        ipDerivedLng: metadata?.ipDerivedLng,
        blockOnVerificationFailure: orgSettings.blockOnVerificationFailure,
        policyBlock: policy.blockOnVerificationFailure,
      })
      // Don't throw - just flag for admin review
    }

    if (metadata?.ipGpsDistanceKm && metadata.ipGpsDistanceKm > policy.maxIpGpsDistanceKm) {
      console.warn('[checkIn] IP-GPS distance exceeds max, but NOT blocking - flagging instead:', {
        ipGpsDistanceKm: metadata.ipGpsDistanceKm,
        maxAllowed: policy.maxIpGpsDistanceKm,
      })
      // Don't throw - just flag for admin review
    }
  }

  const workStartTime = schedule?.work_start_time || orgSettings?.default_work_start_time || '09:00:00'
  const lateThreshold = schedule?.late_threshold_minutes || orgSettings?.default_late_threshold_minutes || 0

  const [workHours, workMinutes] = workStartTime.split(':').map(Number)
  const expectedTime = new Date(now)
  expectedTime.setHours(workHours, workMinutes + lateThreshold, 0, 0)

  let isLate = false
  let lateByMinutes = 0
  if (isFirstSessionOfDay) {
    isLate = now > expectedTime
    lateByMinutes = isLate ? Math.ceil((now.getTime() - expectedTime.getTime()) / 60000) : 0
  }

  const insertData: Record<string, unknown> = {
    user_id: userId,
    date: today,
    check_in_time: checkInTime,
    check_in_lat: latitude,
    check_in_lng: longitude,
    check_in_nearest_type: geofence.nearestType,
    check_in_distance_meters: geofence.distanceMeters,
    check_in_radius_meters: geofence.radiusMeters,
    check_in_in_radius: geofence.inRadius,
    status: isLate ? 'late' : 'present',
    is_late: isLate,
    late_by_minutes: lateByMinutes,
    notes: notes,
    heartbeat_count: 0,
    location_verification_failed: metadata?.ipDerivedLat === null || metadata?.ipDerivedLng === null,
    spoofing_detected: spoofingDetected,
    spoofing_reason: spoofingReason,
  }

  if (metadata?.ipAddress) {
    insertData.ip_address = metadata.ipAddress
    insertData.check_in_ip = metadata.ipAddress
  }
  if (metadata?.userAgent) {
    insertData.user_agent = metadata.userAgent
  }
  if (metadata?.deviceFingerprint) {
    insertData.device_fingerprint = metadata.deviceFingerprint
  }
  if (metadata?.ipDerivedLat != null) {
    insertData.ip_derived_lat = metadata.ipDerivedLat
  }
  if (metadata?.ipDerivedLng != null) {
    insertData.ip_derived_lng = metadata.ipDerivedLng
  }
  if (metadata?.ipGpsDistanceKm != null) {
    insertData.ip_gps_distance_km = metadata.ipGpsDistanceKm
  }

  const { data, error } = await supabase
    .from('attendance_records')
    .insert(insertData)
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      throw new Error('Check out of your current session before starting a new check-in.')
    }
    throw error
  }

  const shouldCreateWarning =
    geofence.inRadius === false ||
    spoofingDetected ||
    (metadata?.ipGpsDistanceKm && metadata.ipGpsDistanceKm > policy.maxIpGpsDistanceKm)

  if (shouldCreateWarning) {
    const warningReasons: string[] = []
    if (geofence.inRadius === false) {
      warningReasons.push('Outside allowed office/home radius during check-in.')
    }
    if (spoofingDetected) {
      warningReasons.push(spoofingReason || 'GPS spoofing detected.')
    }
    if (metadata?.ipGpsDistanceKm && metadata.ipGpsDistanceKm > policy.maxIpGpsDistanceKm) {
      warningReasons.push(`IP-GPS distance: ${metadata.ipGpsDistanceKm}km exceeds threshold of ${policy.maxIpGpsDistanceKm}km.`)
    }

    await createAttendanceGeofenceWarning({
      attendanceRecordId: data.id,
      userId,
      eventType: 'check_in',
      latitude: latitude ?? null,
      longitude: longitude ?? null,
      nearestType: geofence.nearestType,
      distanceMeters: geofence.distanceMeters,
      allowedRadiusMeters: geofence.radiusMeters,
      warningReason: warningReasons.join(' | '),
    })
  }

  return transformAttendance(data)
}

export async function checkOut(
  userId: string,
  latitude?: number,
  longitude?: number,
  notes?: string
): Promise<AttendanceRecord> {
  const supabase = await createAdminClient()
  const checkOutTime = new Date().toISOString()

  /** Open session: latest check-in with no checkout. Do not key off UTC "today". */
  const { data: openRows, error: fetchError } = await supabase
    .from('attendance_records')
    .select('*')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .is('check_out_time', null)
    .order('check_in_time', { ascending: false })
    .limit(1)

  if (fetchError) throw fetchError
  const existing = openRows?.[0]
  if (!existing) throw new Error('No check-in record found for today')

  const checkIn = new Date(existing.check_in_time)
  const checkOut = new Date(checkOutTime)
  const totalHours = (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60)

  const orgSettings = await getOfficeLocationSettings()
  const homeLocation = await getUserHomeLocation(userId)
  const geofence = evaluateGeofence({
    latitude,
    longitude,
    office:
      orgSettings.officeLat !== null && orgSettings.officeLng !== null
        ? {
            latitude: orgSettings.officeLat,
            longitude: orgSettings.officeLng,
            radiusMeters: orgSettings.allowedRadiusMeters,
          }
        : null,
    home: homeLocation
      ? {
          latitude: homeLocation.latitude,
          longitude: homeLocation.longitude,
          radiusMeters: homeLocation.radiusMeters,
        }
      : null,
  })

  // ENFORCEMENT: Block out-of-radius check-outs when geolocation is required
  // Note: This is less strict than check-in - we still allow checkout but warn
  if (orgSettings.requireGeolocation && geofence.inRadius === false) {
    // Log warning but still allow checkout to prevent stuck sessions
    console.warn(
      `User ${userId} checked out outside geofence. Distance: ${geofence.distanceMeters}m, Allowed: ${geofence.radiusMeters}m`
    )
  }

  const { data, error } = await supabase
    .from('attendance_records')
    .update({
      check_out_time: checkOutTime,
      check_out_lat: latitude,
      check_out_lng: longitude,
      check_out_nearest_type: geofence.nearestType,
      check_out_distance_meters: geofence.distanceMeters,
      check_out_radius_meters: geofence.radiusMeters,
      check_out_in_radius: geofence.inRadius,
      total_hours: Math.round(totalHours * 100) / 100,
      notes: notes || existing.notes
    })
    .eq('id', existing.id)
    .select()
    .single()

  if (error) throw error

  if (geofence.inRadius === false) {
    await createAttendanceGeofenceWarning({
      attendanceRecordId: data.id,
      userId,
      eventType: 'check_out',
      latitude: latitude ?? null,
      longitude: longitude ?? null,
      nearestType: geofence.nearestType,
      distanceMeters: geofence.distanceMeters,
      allowedRadiusMeters: geofence.radiusMeters,
      warningReason: 'Outside allowed office/home radius during check-out.',
    })
  }

  return transformAttendance(data)
}

export async function getAttendanceRecords(filters: {
  userId?: string
  userIds?: string[]
  fromDate?: string
  toDate?: string
}): Promise<AttendanceRecord[]> {
  const supabase = await createAdminClient()
  
  let query = supabase
    .from('attendance_records')
    .select('*')
    .is('deleted_at', null)
    .order('date', { ascending: false })

  if (filters.userIds && filters.userIds.length > 0) {
    query = query.in('user_id', filters.userIds)
  } else if (filters.userId) {
    query = query.eq('user_id', filters.userId)
  }
  
  if (filters.fromDate) {
    query = query.gte('date', filters.fromDate)
  }
  
  if (filters.toDate) {
    query = query.lte('date', filters.toDate)
  }

  const { data, error } = await query

  if (error) throw error

  return (data || []).map(transformAttendance)
}

export type TeamTodayPresenceRow = {
  userId: string
  name: string
  email: string
  department: string
  role: string
  /** Prefer open session; else latest session of the day (for status / times). */
  record: AttendanceRecord | null
  /** All sessions that day for this user (optional UI). */
  sessionsToday: AttendanceRecord[]
}

/** Merge active users in scope with today’s attendance rows (multiple sessions per user per day). */
export async function getTeamTodayPresence(
  userIds: string[],
  workDate: string
): Promise<TeamTodayPresenceRow[]> {
  if (userIds.length === 0) return []

  const supabase = await createAdminClient()

  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id, name, email, department, role')
    .in('id', userIds)
    .eq('status', 'active')
    .is('deleted_at', null)
    .order('name', { ascending: true })

  if (usersError) throw usersError

  const { data: records, error: recError } = await supabase
    .from('attendance_records')
    .select('*')
    .eq('date', workDate)
    .in('user_id', userIds)
    .is('deleted_at', null)
    .order('check_in_time', { ascending: true })

  if (recError) throw recError

  const byUser = new Map<string, AttendanceRecord[]>()
  for (const row of records || []) {
    const uid = row.user_id as string
    const list = byUser.get(uid) ?? []
    list.push(transformAttendance(row))
    byUser.set(uid, list)
  }

  return (users || []).map((u: { id: string; name: string; email: string; department: string; role: string }) => {
    const sessionsToday = byUser.get(u.id) ?? []
    const open = sessionsToday.find((s) => !s.checkOutTime)
    const latest =
      sessionsToday.length > 0 ? sessionsToday[sessionsToday.length - 1] : null
    const record = open ?? latest ?? null
    return {
      userId: u.id,
      name: u.name,
      email: u.email,
      department: u.department,
      role: u.role,
      record,
      sessionsToday,
    }
  })
}

const defaultOrgSettings = (): OfficeLocationSettings & {
  default_work_start_time?: string
  default_late_threshold_minutes?: number
} => ({
  officeLat: null,
  officeLng: null,
  allowedRadiusMeters: 500,
  requireGeolocation: false,
  blockOnVerificationFailure: false,
  updatedAt: new Date().toISOString(),
  default_work_start_time: '09:00:00',
  default_late_threshold_minutes: 0,
})

export async function getOfficeLocationSettings(): Promise<
  OfficeLocationSettings & {
    default_work_start_time?: string
    default_late_threshold_minutes?: number
  }
> {
  const supabase = await createAdminClient()
  const { data, error } = await supabase.from('organization_settings').select('*').maybeSingle()
  if (error && error.code !== 'PGRST116') throw error
  if (!data) return defaultOrgSettings()
  return {
    officeLat: data.office_lat,
    officeLng: data.office_lng,
    allowedRadiusMeters: data.allowed_radius_meters || 500,
    requireGeolocation: Boolean(data.require_geolocation),
    blockOnVerificationFailure: Boolean(data.block_on_verification_failure ?? false),
    updatedAt: data.updated_at,
    default_work_start_time: data.default_work_start_time,
    default_late_threshold_minutes: data.default_late_threshold_minutes ?? 0,
  }
}

export async function updateOfficeLocationSettings(input: {
  officeLat: number | null
  officeLng: number | null
  allowedRadiusMeters: number
  requireGeolocation: boolean
  updatedBy: string
}): Promise<OfficeLocationSettings> {
  const supabase = await createAdminClient()
  const { data: current, error: currentError } = await supabase
    .from('organization_settings')
    .select('id')
    .single()
  if (currentError || !current) throw currentError || new Error('Organization settings not found')

  const { data, error } = await supabase
    .from('organization_settings')
    .update({
      office_lat: input.officeLat,
      office_lng: input.officeLng,
      allowed_radius_meters: input.allowedRadiusMeters,
      require_geolocation: input.requireGeolocation,
      updated_by: input.updatedBy,
      updated_at: new Date().toISOString(),
    })
    .eq('id', current.id)
    .select('*')
    .single()
  if (error) throw error
  return {
    officeLat: data.office_lat,
    officeLng: data.office_lng,
    allowedRadiusMeters: data.allowed_radius_meters,
    requireGeolocation: Boolean(data.require_geolocation),
    blockOnVerificationFailure: Boolean(data.block_on_verification_failure ?? false),
    updatedAt: data.updated_at,
  }
}

export async function getUserHomeLocation(userId: string): Promise<UserHomeLocation | null> {
  const supabase = await createAdminClient()
  const { data, error } = await supabase
    .from('user_home_locations')
    .select('*')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }

  return {
    userId: data.user_id,
    latitude: data.latitude,
    longitude: data.longitude,
    radiusMeters: data.radius_meters,
    label: data.label || undefined,
    updatedAt: data.updated_at,
    updatedBy: data.updated_by || undefined,
  }
}

export async function upsertUserHomeLocation(input: {
  userId: string
  latitude: number
  longitude: number
  radiusMeters: number
  label?: string
  updatedBy: string
}): Promise<UserHomeLocation> {
  const supabase = await createAdminClient()
  const { data, error } = await supabase
    .from('user_home_locations')
    .upsert(
      {
        user_id: input.userId,
        latitude: input.latitude,
        longitude: input.longitude,
        radius_meters: input.radiusMeters,
        label: input.label || null,
        updated_by: input.updatedBy,
        deleted_at: null,
      },
      { onConflict: 'user_id' }
    )
    .select('*')
    .single()
  if (error) throw error

  return {
    userId: data.user_id,
    latitude: data.latitude,
    longitude: data.longitude,
    radiusMeters: data.radius_meters,
    label: data.label || undefined,
    updatedAt: data.updated_at,
    updatedBy: data.updated_by || undefined,
  }
}

export async function getAttendanceGeofenceWarnings(filters: {
  userId?: string
  fromDate?: string
  toDate?: string
  status?: 'open' | 'reviewed'
  limit?: number
}): Promise<AttendanceGeofenceWarning[]> {
  const supabase = await createAdminClient()
  let query = supabase
    .from('attendance_geofence_warnings')
    .select(
      `
      *,
      users!attendance_geofence_warnings_user_id_fkey (
        id,
        name,
        email
      ),
      attendance_records!attendance_geofence_warnings_attendance_record_id_fkey (
        id,
        check_in_time,
        check_out_time,
        date
      )
    `
    )
    .order('created_at', { ascending: false })

  if (filters.userId) query = query.eq('user_id', filters.userId)
  if (filters.fromDate) query = query.gte('created_at', `${filters.fromDate}T00:00:00.000Z`)
  if (filters.toDate) query = query.lte('created_at', `${filters.toDate}T23:59:59.999Z`)
  if (filters.status) query = query.eq('status', filters.status)
  if (filters.limit) query = query.limit(Math.min(filters.limit, 500))

  const { data, error } = await query
  if (error) throw error

  return (data || []).map((row: {
    id: string
    attendance_record_id?: string | null
    user_id: string
    users?: { name?: string; email?: string } | null
    attendance_records?: { 
      id: string
      check_in_time?: string | null
      check_out_time?: string | null
      date?: string | null
    } | null
    event_type: 'check_in' | 'check_out'
    latitude: number | null
    longitude: number | null
    nearest_type: 'office' | 'home' | 'none'
    distance_meters: number | null
    allowed_radius_meters: number | null
    warning_reason: string | null
    status: 'open' | 'reviewed'
    created_at: string
    reviewed_at?: string | null
    reviewed_by?: string | null
    review_note?: string | null
  }) => ({
    id: row.id,
    attendanceRecordId: row.attendance_record_id,
    userId: row.user_id,
    userName: row.users?.name,
    userEmail: row.users?.email,
    eventType: row.event_type,
    eventTime: row.event_type === 'check_in' 
      ? row.attendance_records?.check_in_time 
      : row.attendance_records?.check_out_time,
    eventDate: row.attendance_records?.date,
    latitude: row.latitude,
    longitude: row.longitude,
    nearestType: row.nearest_type,
    distanceMeters: row.distance_meters,
    allowedRadiusMeters: row.allowed_radius_meters,
    warningReason: row.warning_reason,
    status: row.status,
    createdAt: row.created_at,
    reviewedAt: row.reviewed_at,
    reviewedBy: row.reviewed_by,
    reviewNote: row.review_note,
  }))
}

async function createAttendanceGeofenceWarning(input: {
  attendanceRecordId: string
  userId: string
  eventType: 'check_in' | 'check_out'
  latitude: number | null
  longitude: number | null
  nearestType: 'office' | 'home' | 'none'
  distanceMeters: number | null
  allowedRadiusMeters: number | null
  warningReason: string
}): Promise<void> {
  const supabase = await createAdminClient()
  const { error } = await supabase.from('attendance_geofence_warnings').insert({
    attendance_record_id: input.attendanceRecordId,
    user_id: input.userId,
    event_type: input.eventType,
    latitude: input.latitude,
    longitude: input.longitude,
    nearest_type: input.nearestType,
    distance_meters: input.distanceMeters,
    allowed_radius_meters: input.allowedRadiusMeters,
    warning_reason: input.warningReason,
    status: 'open',
  })
  if (error) throw error
}

export async function recordHeartbeat(
  userId: string,
  metadata?: {
    ipAddress?: string
    userAgent?: string
    deviceFingerprint?: string
  }
): Promise<{ success: boolean; timestamp: string; warnings?: string[] }> {
  const supabase = await createAdminClient()
  const now = new Date().toISOString()
  const warnings: string[] = []

  const { data: openSession, error: findError } = await supabase
    .from('attendance_records')
    .select('id, user_id, check_in_time, heartbeat_count, device_fingerprint, ip_address, check_in_ip, unique_ip_count, ip_change_detected')
    .eq('user_id', userId)
    .is('check_out_time', null)
    .is('deleted_at', null)
    .order('check_in_time', { ascending: false })
    .limit(1)
    .single()

  if (findError) {
    if (findError.code === 'PGRST116') {
      return { success: false, timestamp: now }
    }
    throw findError
  }

  if (!openSession) {
    return { success: false, timestamp: now }
  }

  const newHeartbeatCount = (openSession.heartbeat_count || 0) + 1

  const updateData: Record<string, unknown> = {
    last_activity: now,
    updated_at: now,
    heartbeat_count: newHeartbeatCount,
  }

  if (metadata?.ipAddress) {
    updateData.ip_address = metadata.ipAddress

    // SECURITY: HIGH-01 — Detect IP change during active session
    const checkInIp = openSession.check_in_ip || openSession.ip_address
    if (checkInIp && metadata.ipAddress !== checkInIp && !openSession.ip_change_detected) {
      updateData.ip_change_detected = true
      updateData.unique_ip_count = (openSession.unique_ip_count || 1) + 1
      warnings.push('ip_changed_during_session')

      // If 3+ different IPs observed, escalate warning
      if ((openSession.unique_ip_count || 1) + 1 >= 3) {
        warnings.push('multiple_ip_addresses_detected')
      }
    }
  }
  if (metadata?.userAgent) {
    updateData.user_agent = metadata.userAgent
  }
  if (metadata?.deviceFingerprint && !openSession.device_fingerprint) {
    updateData.device_fingerprint = metadata.deviceFingerprint
  }

  const { error: updateError } = await supabase
    .from('attendance_records')
    .update(updateData)
    .eq('id', openSession.id)

  if (updateError) throw updateError

  // Check for suspicious activity
  if (metadata?.ipAddress || metadata?.deviceFingerprint) {
    try {
      const { data: flags } = await supabase.rpc('detect_suspicious_activity', {
        p_user_id: userId,
        p_attendance_record_id: openSession.id,
        p_ip_address: metadata.ipAddress || null,
        p_user_agent: metadata.userAgent || null,
        p_device_fingerprint: metadata.deviceFingerprint || null,
      })

      if (flags && Array.isArray(flags) && flags.length > 0) {
        warnings.push(...flags)
        await supabase.rpc('update_suspicious_flags', {
          p_record_id: openSession.id,
          p_flags: flags,
        })
      }
    } catch (err) {
      console.error('Failed to check suspicious activity:', err)
    }
  }

  // Rate limit check: warn if too many heartbeats
  const sessionMinutes = openSession.check_in_time
    ? (Date.now() - new Date(openSession.check_in_time).getTime()) / 60000
    : 0
  if (sessionMinutes > 0 && newHeartbeatCount / sessionMinutes > 1) {
    warnings.push('rapid_heartbeat_detected')
  }

  return { success: true, timestamp: now, warnings: warnings.length > 0 ? warnings : undefined }
}

export async function getAutoCheckoutSettings(): Promise<AutoCheckoutSettings> {
  const supabase = await createAdminClient()
  
  const { data, error } = await supabase
    .from('organization_settings')
    .select('inactivity_timeout_minutes, auto_checkout_enabled, heartbeat_interval_minutes, max_hours_per_day, auto_checkout_on_logout')
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return {
        inactivityTimeoutMinutes: 30,
        autoCheckoutEnabled: true,
        heartbeatIntervalMinutes: 5,
        maxHoursPerDay: 12,
        autoCheckoutOnLogout: true,
      }
    }
    throw error
  }

  return {
    inactivityTimeoutMinutes: data.inactivity_timeout_minutes ?? 30,
    autoCheckoutEnabled: data.auto_checkout_enabled ?? true,
    heartbeatIntervalMinutes: data.heartbeat_interval_minutes ?? 5,
    maxHoursPerDay: data.max_hours_per_day ?? 12,
    autoCheckoutOnLogout: data.auto_checkout_on_logout ?? true,
  }
}

export async function updateAutoCheckoutSettings(input: {
  inactivityTimeoutMinutes: number
  autoCheckoutEnabled: boolean
  heartbeatIntervalMinutes: number
  autoCheckoutOnLogout: boolean
}): Promise<AutoCheckoutSettings> {
  const supabase = await createAdminClient()

  const { data: current, error: currentError } = await supabase
    .from('organization_settings')
    .select('id')
    .single()

  if (currentError || !current) throw currentError || new Error('Organization settings not found')

  const { error } = await supabase
    .from('organization_settings')
    .update({
      inactivity_timeout_minutes: input.inactivityTimeoutMinutes,
      auto_checkout_enabled: input.autoCheckoutEnabled,
      heartbeat_interval_minutes: input.heartbeatIntervalMinutes,
      auto_checkout_on_logout: input.autoCheckoutOnLogout,
      updated_at: new Date().toISOString(),
    })
    .eq('id', current.id)

  if (error) throw error

  return getAutoCheckoutSettings()
}

export async function adjustAttendanceRecord(input: {
  attendanceRecordId: string
  adjustedBy: string
  fieldName: 'check_in_time' | 'check_out_time' | 'total_hours' | 'status'
  oldValue: string | null
  newValue: string
  adjustmentReason: string
  adjustmentType: AdjustmentType
}): Promise<AttendanceAdjustment> {
  const supabase = await createAdminClient()

  const { data: record, error: recordError } = await supabase
    .from('attendance_records')
    .select('*')
    .eq('id', input.attendanceRecordId)
    .single()

  if (recordError) throw recordError

  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }

  if (input.fieldName === 'check_in_time') {
    updateData.check_in_time = input.newValue
  } else if (input.fieldName === 'check_out_time') {
    updateData.check_out_time = input.newValue
    if (record.check_in_time) {
      const checkIn = new Date(record.check_in_time)
      const checkOut = new Date(input.newValue)
      const hours = (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60)
      updateData.total_hours = Math.round(hours * 100) / 100
    }
    if (input.adjustmentType === 'auto_checkout_reversal') {
      updateData.auto_checkout = false
      updateData.auto_checkout_reason = null
      updateData.notes = (record.notes || '').replace(/\s*\[Auto-checkout:[^\]]*\]/g, '').trim()
    }
  } else if (input.fieldName === 'total_hours') {
    updateData.total_hours = parseFloat(input.newValue)
  } else if (input.fieldName === 'status') {
    updateData.status = input.newValue
  }

  const { error: updateError } = await supabase
    .from('attendance_records')
    .update(updateData)
    .eq('id', input.attendanceRecordId)

  if (updateError) throw updateError

  const { data: adjustment, error: adjError } = await supabase
    .from('attendance_adjustments')
    .insert({
      attendance_record_id: input.attendanceRecordId,
      adjusted_by: input.adjustedBy,
      field_name: input.fieldName,
      old_value: input.oldValue,
      new_value: input.newValue,
      adjustment_reason: input.adjustmentReason,
      adjustment_type: input.adjustmentType,
    })
    .select()
    .single()

  if (adjError) throw adjError

  return {
    id: adjustment.id,
    attendanceRecordId: adjustment.attendance_record_id,
    adjustedBy: adjustment.adjusted_by,
    fieldName: adjustment.field_name,
    oldValue: adjustment.old_value,
    newValue: adjustment.new_value,
    adjustmentReason: adjustment.adjustment_reason,
    adjustmentType: adjustment.adjustment_type,
    createdAt: adjustment.created_at,
  }
}

export async function getAttendanceAdjustments(filters?: {
  attendanceRecordId?: string
  adjustedBy?: string
  fromDate?: string
  toDate?: string
  limit?: number
}): Promise<AttendanceAdjustment[]> {
  const supabase = await createAdminClient()

  let query = supabase
    .from('attendance_adjustments')
    .select(`
      *,
      users!attendance_adjustments_adjusted_by_fkey (
        id,
        name
      )
    `)
    .order('created_at', { ascending: false })

  if (filters?.attendanceRecordId) {
    query = query.eq('attendance_record_id', filters.attendanceRecordId)
  }
  if (filters?.adjustedBy) {
    query = query.eq('adjusted_by', filters.adjustedBy)
  }
  if (filters?.fromDate) {
    query = query.gte('created_at', `${filters.fromDate}T00:00:00.000Z`)
  }
  if (filters?.toDate) {
    query = query.lte('created_at', `${filters.toDate}T23:59:59.999Z`)
  }
  if (filters?.limit) {
    query = query.limit(Math.min(filters.limit, 500))
  }

  const { data, error } = await query

  if (error) throw error

  return (data || []).map((row: {
    id: string
    attendance_record_id: string
    adjusted_by: string
    users?: { name?: string } | null
    field_name: string
    old_value: string | null
    new_value: string | null
    adjustment_reason: string
    adjustment_type: AdjustmentType
    created_at: string
  }) => ({
    id: row.id,
    attendanceRecordId: row.attendance_record_id,
    adjustedBy: row.adjusted_by,
    adjustedByName: row.users?.name,
    fieldName: row.field_name,
    oldValue: row.old_value,
    newValue: row.new_value,
    adjustmentReason: row.adjustment_reason,
    adjustmentType: row.adjustment_type,
    createdAt: row.created_at,
  }))
}

export async function getAttendanceRecordById(recordId: string): Promise<AttendanceRecord | null> {
  const supabase = await createAdminClient()

  const { data, error } = await supabase
    .from('attendance_records')
    .select('*')
    .eq('id', recordId)
    .is('deleted_at', null)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }

  return transformAttendance(data as AttendanceRecordRow)
}

export async function detectImpossibleTravel(
  userId: string,
  currentLat: number,
  currentLng: number,
  currentTime: Date = new Date()
): Promise<{ suspicious: boolean; speedKmPerHour: number | null; distanceKm: number | null; previousRecordId: string | null }> {
  const supabase = await createAdminClient()

  const { data: recentRecords, error } = await supabase
    .from('attendance_records')
    .select('id, check_in_time, check_in_lat, check_in_lng, check_out_time, check_out_lat, check_out_lng')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .gte('check_in_time', new Date(Date.now() - 24 * 3600000).toISOString())
    .order('check_in_time', { ascending: false })
    .limit(5)

  if (error) throw error

  if (!recentRecords || recentRecords.length === 0) {
    return { suspicious: false, speedKmPerHour: null, distanceKm: null, previousRecordId: null }
  }

  for (const record of recentRecords) {
    const lat = record.check_in_lat ?? record.check_out_lat
    const lng = record.check_in_lng ?? record.check_out_lng
    const time = record.check_out_time ?? record.check_in_time

    if (lat === null || lng === null) continue

    const distanceKm = haversineDistanceMeters(
      { latitude: currentLat, longitude: currentLng },
      { latitude: lat, longitude: lng }
    ) / 1000

    const timeDiffMs = currentTime.getTime() - new Date(time).getTime()
    const timeDiffHours = timeDiffMs / 3600000

    if (timeDiffHours < 0.01) continue

    const speedKmPerHour = distanceKm / timeDiffHours

    const maxReasonableSpeed = 1000

    if (speedKmPerHour > maxReasonableSpeed) {
      return {
        suspicious: true,
        speedKmPerHour: Math.round(speedKmPerHour * 10) / 10,
        distanceKm: Math.round(distanceKm * 10) / 10,
        previousRecordId: record.id,
      }
    }
  }

  return { suspicious: false, speedKmPerHour: null, distanceKm: null, previousRecordId: null }
}

export async function getAttendanceAnomalies(filters?: {
  fromDate?: string
  toDate?: string
  userId?: string
  limit?: number
}): Promise<{
  records: AttendanceRecord[]
  anomalies: {
    spoofing: AttendanceRecord[]
    impossibleTravel: AttendanceRecord[]
    verificationFailed: AttendanceRecord[]
    selfUpdatedLocations: { userId: string; userName: string; userEmail: string; latitude: number; longitude: number; updatedAt: string; updatedBy: string }[]
  }
}> {
  const supabase = await createAdminClient()
  const limit = Math.min(filters?.limit || 100, 500)

  const { data: records, error } = await supabase
    .from('attendance_records')
    .select(`
      *,
      users!attendance_records_user_id_fkey (
        id, name, email
      )
    `)
    .is('deleted_at', null)
    .gte('check_in_time', filters?.fromDate || new Date(Date.now() - 7 * 24 * 3600000).toISOString())
    .lte('check_in_time', filters?.toDate || new Date().toISOString())
    .order('check_in_time', { ascending: false })
    .limit(limit)

  if (error) throw error

  const spoofing: AttendanceRecord[] = []
  const impossibleTravel: AttendanceRecord[] = []
  const verificationFailed: AttendanceRecord[] = []

  for (const record of records || []) {
    const transformed = transformAttendance(record as AttendanceRecordRow)

    if (transformed.checkInDistanceMeters !== null && transformed.checkInDistanceMeters < 5) {
      spoofing.push(transformed)
    }

    const ipGpsDistance = (record as { ip_gps_distance_km?: number | null }).ip_gps_distance_km
    if (ipGpsDistance != null && ipGpsDistance > 50) {
      impossibleTravel.push(transformed)
    }

    const ipDerivedLat = (record as { ip_derived_lat?: number | null }).ip_derived_lat
    const ipDerivedLng = (record as { ip_derived_lng?: number | null }).ip_derived_lng
    if (ipDerivedLat === null || ipDerivedLng === null) {
      verificationFailed.push(transformed)
    }
  }

  const { data: homeLocations, error: homeError } = await supabase
    .from('user_home_locations')
    .select(`
      user_id, latitude, longitude, updated_at, updated_by,
      users!user_home_locations_user_id_fkey (
        id, name, email
      )
    `)
    .is('deleted_at', null)
    .order('updated_at', { ascending: false })

  if (homeError) throw homeError

  const selfUpdatedLocations: { userId: string; userName: string; userEmail: string; latitude: number; longitude: number; updatedAt: string; updatedBy: string }[] = []

  for (const loc of homeLocations || []) {
    const usersData = loc.users as unknown
    const user = Array.isArray(usersData) ? usersData[0] : usersData as { id: string; name: string; email: string } | null
    if (loc.updated_by === loc.user_id) {
      selfUpdatedLocations.push({
        userId: loc.user_id,
        userName: user?.name || 'Unknown',
        userEmail: user?.email || 'Unknown',
        latitude: loc.latitude,
        longitude: loc.longitude,
        updatedAt: loc.updated_at,
        updatedBy: loc.updated_by,
      })
    }
  }

  return {
    records: (records || []).map((r) => transformAttendance(r as AttendanceRecordRow)),
    anomalies: {
      spoofing,
      impossibleTravel,
      verificationFailed,
      selfUpdatedLocations,
    },
  }
}

export async function triggerAutoCheckout(): Promise<{ processed: number }> {
  const supabase = await createAdminClient()

  const { data: settings } = await supabase
    .from('organization_settings')
    .select('inactivity_timeout_minutes, auto_checkout_enabled')
    .single()

  if (!settings?.auto_checkout_enabled) {
    return { processed: 0 }
  }

  const { error: rpcError } = await supabase.rpc('auto_checkout_inactive_sessions')

  if (rpcError) {
    console.error('Auto checkout RPC error:', rpcError)
    throw rpcError
  }

  const { data: openSessions, error: countError } = await supabase
    .from('attendance_records')
    .select('id', { count: 'exact', head: true })
    .is('check_out_time', null)
    .is('deleted_at', null)

  if (countError) throw countError

  return { processed: (openSessions?.length || 0) }
}

export async function autoCheckoutOnLogout(userId: string): Promise<{ checkedOut: boolean; sessionId?: string }> {
  const supabase = await createAdminClient()

  const { data: settings } = await supabase
    .from('organization_settings')
    .select('auto_checkout_on_logout')
    .single()

  if (!settings?.auto_checkout_on_logout) {
    return { checkedOut: false }
  }

  const { data: openSession, error: fetchError } = await supabase
    .from('attendance_records')
    .select('id, check_in_time, notes')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .is('check_out_time', null)
    .order('check_in_time', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (fetchError) {
    console.error('autoCheckoutOnLogout: fetch error:', fetchError)
    return { checkedOut: false }
  }

  if (!openSession) {
    return { checkedOut: false }
  }

  const checkoutTime = new Date().toISOString()
  const checkInTime = new Date(openSession.check_in_time)
  const totalHours = Math.round(((new Date(checkoutTime).getTime() - checkInTime.getTime()) / (1000 * 60 * 60)) * 100) / 100

  const { error: updateError } = await supabase
    .from('attendance_records')
    .update({
      check_out_time: checkoutTime,
      total_hours: totalHours,
      auto_checkout: true,
      auto_checkout_reason: 'logout',
      notes: (openSession.notes || '') + ' [Auto-checkout: user logged out]',
      updated_at: new Date().toISOString(),
    })
    .eq('id', openSession.id)

  if (updateError) {
    console.error('autoCheckoutOnLogout: update error:', updateError)
    return { checkedOut: false }
  }

  return { checkedOut: true, sessionId: openSession.id }
}

interface AttendanceRecordRow {
  id: string
  user_id: string
  date: string
  check_in_time: string | null
  check_out_time: string | null
  check_in_lat: number | null
  check_in_lng: number | null
  check_out_lat: number | null
  check_out_lng: number | null
  check_in_nearest_type: 'office' | 'home' | 'none' | null
  check_in_distance_meters: number | null
  check_in_radius_meters: number | null
  check_in_in_radius: boolean | null
  check_out_nearest_type: 'office' | 'home' | 'none' | null
  check_out_distance_meters: number | null
  check_out_radius_meters: number | null
  check_out_in_radius: boolean | null
  total_hours: number
  status: AttendanceStatus
  is_late: boolean
  late_by_minutes: number
  is_manual: boolean
  manual_entry_by?: string | null
  notes?: string | null
  last_activity?: string | null
  auto_checkout?: boolean
  auto_checkout_reason?: string | null
  ip_address?: string | null
  user_agent?: string | null
  device_fingerprint?: string | null
  heartbeat_count?: number
  suspicious_flags?: string[] | null
  created_at: string
  updated_at: string
  deleted_at?: string | null
}

function transformAttendance(row: AttendanceRecordRow): AttendanceRecord {
  return {
    id: row.id,
    userId: row.user_id,
    date: row.date,
    checkInTime: row.check_in_time,
    checkOutTime: row.check_out_time,
    checkInLat: row.check_in_lat,
    checkInLng: row.check_in_lng,
    checkOutLat: row.check_out_lat,
    checkOutLng: row.check_out_lng,
    checkInNearestType: row.check_in_nearest_type,
    checkInDistanceMeters: row.check_in_distance_meters,
    checkInRadiusMeters: row.check_in_radius_meters,
    checkInInRadius: row.check_in_in_radius,
    checkOutNearestType: row.check_out_nearest_type,
    checkOutDistanceMeters: row.check_out_distance_meters,
    checkOutRadiusMeters: row.check_out_radius_meters,
    checkOutInRadius: row.check_out_in_radius,
    totalHours: row.total_hours,
    status: row.status,
    isLate: row.is_late,
    lateByMinutes: row.late_by_minutes,
    isManual: row.is_manual,
    manualEntryBy: row.manual_entry_by ?? undefined,
    notes: row.notes ?? undefined,
    lastActivity: row.last_activity ?? undefined,
    autoCheckout: row.auto_checkout ?? false,
    autoCheckoutReason: (row.auto_checkout_reason ?? undefined) as AutoCheckoutReason | null | undefined,
    ipAddress: row.ip_address ?? undefined,
    userAgent: row.user_agent ?? undefined,
    deviceFingerprint: row.device_fingerprint ?? undefined,
    heartbeatCount: row.heartbeat_count ?? undefined,
    suspiciousFlags: row.suspicious_flags ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at ?? undefined,
  }
}
