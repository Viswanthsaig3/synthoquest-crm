/**
 * Calendar YYYY-MM-DD in a specific IANA timezone (align UI + API for "today" rules).
 * Uses en-CA locale which yields ISO-like dates from Intl.
 */
export function formatDateKeyInTimeZone(date: Date, timeZone: string): string {
  return date.toLocaleDateString('en-CA', { timeZone })
}

/** Browser: NEXT_PUBLIC_DEFAULT_TIMEZONE; server: DEFAULT_TIMEZONE or same public fallback. */
export function getDefaultTimeZone(): string {
  if (typeof window !== 'undefined') {
    return process.env.NEXT_PUBLIC_DEFAULT_TIMEZONE || 'Asia/Kolkata'
  }
  return process.env.DEFAULT_TIMEZONE || process.env.NEXT_PUBLIC_DEFAULT_TIMEZONE || 'Asia/Kolkata'
}

export function getTodayDateKey(): string {
  return formatDateKeyInTimeZone(new Date(), getDefaultTimeZone())
}

/** Local calendar date (user's browser local TZ) — use only where TZ env is not set client-side. */
export function formatDateKeyLocal(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/**
 * Server/API: today key — must use same DEFAULT_TIMEZONE as client NEXT_PUBLIC_DEFAULT_TIMEZONE.
 */
export function getTodayDateKeyForApi(): string {
  const tz = process.env.DEFAULT_TIMEZONE || process.env.NEXT_PUBLIC_DEFAULT_TIMEZONE || 'Asia/Kolkata'
  return formatDateKeyInTimeZone(new Date(), tz)
}

export function getTimeZoneForApi(): string {
  return process.env.DEFAULT_TIMEZONE || process.env.NEXT_PUBLIC_DEFAULT_TIMEZONE || 'Asia/Kolkata'
}

export function getNowTimeKeyForApi(): string {
  return getNowTimeKeyInTimeZone(getTimeZoneForApi())
}

export function isSameCalendarDateKey(a: string, b: string): boolean {
  return a === b
}

/** Human-readable calendar day from YYYY-MM-DD (no UTC shift; noon anchor). */
export function formatLongDateFromYmd(
  dateKey: string,
  locale: string = 'en-US'
): string {
  const [y, m, d] = dateKey.split('-').map(Number)
  const dt = new Date(y, m - 1, d, 12, 0, 0)
  return new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(dt)
}

/** Current time key HH:mm in app timezone (or default). */
export function getNowTimeKeyInTimeZone(timeZone: string = getDefaultTimeZone()): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date())
}

/** Parse HH:mm into minutes from midnight. */
export function minutesFromTimeKey(timeKey: string): number {
  const [h, m] = timeKey.split(':').map(Number)
  if (!Number.isFinite(h) || !Number.isFinite(m)) return Number.NaN
  return h * 60 + m
}

export function compareTimeKeys(a: string, b: string): number {
  return minutesFromTimeKey(a) - minutesFromTimeKey(b)
}

export function isFutureTimeForToday(timeKey: string, timeZone: string = getDefaultTimeZone()): boolean {
  const now = getNowTimeKeyInTimeZone(timeZone)
  return compareTimeKeys(timeKey, now) > 0
}

export function validateTodayTimeRange(
  startTime?: string,
  endTime?: string,
  timeZone: string = getDefaultTimeZone()
): { ok: true } | { ok: false; error: string } {
  if (!startTime || !endTime) return { ok: true }
  if (compareTimeKeys(startTime, endTime) >= 0) {
    return { ok: false, error: 'Start time must be earlier than end time.' }
  }
  if (isFutureTimeForToday(endTime, timeZone)) {
    return { ok: false, error: `End time cannot be later than current time (${getNowTimeKeyInTimeZone(timeZone)}).` }
  }
  return { ok: true }
}

/** Timesheet entry date must be today's calendar date (strict logging). */
export function assertEntryDateIsToday(entryDate: string): { ok: true } | { ok: false; error: string } {
  const today = getTodayDateKeyForApi()
  if (entryDate !== today) {
    return {
      ok: false,
      error: `Entries can only be logged for today (${today}).`,
    }
  }
  return { ok: true }
}
