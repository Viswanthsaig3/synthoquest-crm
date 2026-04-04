export interface IPLocation {
  ip: string
  city: string
  region: string
  country: string
  latitude: number | null
  longitude: number | null
}

export async function getIPLocation(ipAddress: string): Promise<IPLocation | null> {
  try {
    const response = await fetch(`https://ipapi.co/${ipAddress}/json/`)
    
    if (!response.ok) {
      throw new Error('Failed to fetch IP location')
    }

    const data = await response.json()

    return {
      ip: ipAddress,
      city: data.city || 'Unknown',
      region: data.region || 'Unknown',
      country: data.country_name || 'Unknown',
      latitude: parseFloat(data.latitude) || 0,
      longitude: parseFloat(data.longitude) || 0,
    }
  } catch (error) {
    console.error('Error fetching IP location:', error)
    
    return {
      ip: ipAddress,
      city: 'Unknown',
      region: 'Unknown',
      country: 'Unknown',
      latitude: 0,
      longitude: 0,
    }
  }
}

export function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0].trim() : '127.0.0.1'
  return ip
}
