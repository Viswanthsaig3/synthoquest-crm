export interface IPLocation {
  ip: string
  city: string
  region: string
  country: string
  latitude: number | null
  longitude: number | null
}

function unknownLocation(ip: string): IPLocation {
  return {
    ip,
    city: 'Unknown',
    region: 'Unknown',
    country: 'Unknown',
    latitude: null,
    longitude: null,
  }
}

/** True when geolocation APIs are not meaningful (local dev, private networks). */
function isNonPublicIP(ip: string): boolean {
  const trimmed = ip.trim()
  if (
    trimmed === '127.0.0.1' ||
    trimmed === '::1' ||
    trimmed === 'localhost' ||
    trimmed.startsWith('192.168.') ||
    trimmed.startsWith('10.') ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(trimmed)
  ) {
    return true
  }
  return false
}

/**
 * Best-effort IP geolocation for login logs. Never throws; returns Unknown on failure.
 * Skips external calls for localhost/private IPs to avoid noisy errors in dev.
 */
export async function getIPLocation(ipAddress: string): Promise<IPLocation> {
  if (isNonPublicIP(ipAddress)) {
    return unknownLocation(ipAddress)
  }

  try {
    const controller = new AbortController()
    const t = setTimeout(() => controller.abort(), 5000)
    const response = await fetch(
      `https://ipapi.co/${encodeURIComponent(ipAddress)}/json/`,
      { signal: controller.signal, cache: 'no-store' }
    )
    clearTimeout(t)

    if (!response.ok) {
      return unknownLocation(ipAddress)
    }

    const data = (await response.json()) as Record<string, unknown>
    if (data && data.error) {
      return unknownLocation(ipAddress)
    }

    const lat = data.latitude
    const lng = data.longitude
    return {
      ip: ipAddress,
      city: typeof data.city === 'string' ? data.city : 'Unknown',
      region: typeof data.region === 'string' ? data.region : 'Unknown',
      country:
        typeof data.country_name === 'string'
          ? data.country_name
          : typeof data.country === 'string'
            ? data.country
            : 'Unknown',
      latitude: typeof lat === 'number' ? lat : lat != null ? parseFloat(String(lat)) || null : null,
      longitude: typeof lng === 'number' ? lng : lng != null ? parseFloat(String(lng)) || null : null,
    }
  } catch {
    return unknownLocation(ipAddress)
  }
}

export function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0].trim() : '127.0.0.1'
  return ip
}
