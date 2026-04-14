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
export function isNonPublicIP(ip: string): boolean {
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
 * Calculate distance between two coordinates using Haversine formula
 */
export function haversineDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

async function fetchFromIpapiCo(ip: string): Promise<IPLocation | null> {
  const apiKey = process.env.IPAPI_KEY
  const url = apiKey
    ? `https://ipapi.co/${encodeURIComponent(ip)}/json/?key=${apiKey}`
    : `https://ipapi.co/${encodeURIComponent(ip)}/json/`

  try {
    const controller = new AbortController()
    const t = setTimeout(() => controller.abort(), 5000)
    const response = await fetch(url, { signal: controller.signal, cache: 'no-store' })
    clearTimeout(t)

    if (!response.ok) return null

    const data = (await response.json()) as Record<string, unknown>
    if (data && (data.error || data.reason === 'RateLimited')) return null

    const lat = data.latitude
    const lng = data.longitude
    return {
      ip,
      city: typeof data.city === 'string' ? data.city : 'Unknown',
      region: typeof data.region === 'string' ? data.region : 'Unknown',
      country:
        typeof data.country_name === 'string'
          ? data.country_name
          : typeof data.country === 'string'
            ? String(data.country)
            : 'Unknown',
      latitude: typeof lat === 'number' ? lat : lat != null ? parseFloat(String(lat)) || null : null,
      longitude: typeof lng === 'number' ? lng : lng != null ? parseFloat(String(lng)) || null : null,
    }
  } catch {
    return null
  }
}

async function fetchFromIpApiCom(ip: string): Promise<IPLocation | null> {
  try {
    const controller = new AbortController()
    const t = setTimeout(() => controller.abort(), 5000)
    const response = await fetch(
      `https://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,message,country,regionName,city,lat,lon`,
      { signal: controller.signal, cache: 'no-store' }
    )
    clearTimeout(t)

    if (!response.ok) return null

    const data = (await response.json()) as Record<string, unknown>
    if (data && (data.status === 'fail' || data.message)) return null

    const lat = data.lat
    const lng = data.lon
    return {
      ip,
      city: typeof data.city === 'string' ? data.city : 'Unknown',
      region: typeof data.regionName === 'string' ? data.regionName : 'Unknown',
      country: typeof data.country === 'string' ? String(data.country) : 'Unknown',
      latitude: typeof lat === 'number' ? lat : lat != null ? parseFloat(String(lat)) || null : null,
      longitude: typeof lng === 'number' ? lng : lng != null ? parseFloat(String(lng)) || null : null,
    }
  } catch {
    return null
  }
}

async function fetchFromIpinfoIo(ip: string): Promise<IPLocation | null> {
  const apiKey = process.env.IPINFO_KEY
  const url = apiKey
    ? `https://ipinfo.io/${encodeURIComponent(ip)}?token=${apiKey}`
    : `https://ipinfo.io/${encodeURIComponent(ip)}/json`

  try {
    const controller = new AbortController()
    const t = setTimeout(() => controller.abort(), 5000)
    const response = await fetch(url, { signal: controller.signal, cache: 'no-store' })
    clearTimeout(t)

    if (!response.ok) return null

    const data = (await response.json()) as Record<string, unknown>
    if (data && data.error) return null

    const loc = typeof data.loc === 'string' ? data.loc.split(',') : null
    const lat = loc ? parseFloat(loc[0]) : null
    const lng = loc ? parseFloat(loc[1]) : null

    return {
      ip,
      city: typeof data.city === 'string' ? data.city : 'Unknown',
      region: typeof data.region === 'string' ? data.region : 'Unknown',
      country: typeof data.country === 'string' ? String(data.country) : 'Unknown',
      latitude: lat,
      longitude: lng,
    }
  } catch {
    return null
  }
}

export async function getIPLocation(ipAddress: string): Promise<IPLocation> {
  if (isNonPublicIP(ipAddress)) {
    return unknownLocation(ipAddress)
  }

  const services = [
    fetchFromIpapiCo,
    fetchFromIpApiCom,
    fetchFromIpinfoIo,
  ]

  for (const service of services) {
    try {
      const result = await service(ipAddress)
      if (result && result.latitude !== null && result.longitude !== null) {
        return result
      }
    } catch (err) {
      console.error(`IP geolocation service ${service.name} failed:`, err)
      continue
    }
  }

  console.error('All IP geolocation services failed for IP:', ipAddress)
  return unknownLocation(ipAddress)
}

export function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0].trim() : '127.0.0.1'
  return ip
}
