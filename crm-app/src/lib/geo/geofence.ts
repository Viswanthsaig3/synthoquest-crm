export type GeofenceReferenceType = 'office' | 'home' | 'none'

export interface GeoPoint {
  latitude: number
  longitude: number
}

export interface GeofenceReference extends GeoPoint {
  type: Exclude<GeofenceReferenceType, 'none'>
  radiusMeters: number
}

export interface GeofenceEvaluation {
  nearestType: GeofenceReferenceType
  distanceMeters: number | null
  radiusMeters: number | null
  inRadius: boolean | null
  reason:
    | 'ok'
    | 'missing_coordinates'
    | 'invalid_coordinates'
    | 'no_reference_location'
}

export function isValidLatitude(value: number): boolean {
  return Number.isFinite(value) && value >= -90 && value <= 90
}

export function isValidLongitude(value: number): boolean {
  return Number.isFinite(value) && value >= -180 && value <= 180
}

export function isValidGeoPoint(point?: Partial<GeoPoint> | null): point is GeoPoint {
  if (!point) return false
  return isValidLatitude(Number(point.latitude)) && isValidLongitude(Number(point.longitude))
}

export function haversineDistanceMeters(a: GeoPoint, b: GeoPoint): number {
  const toRadians = (deg: number) => (deg * Math.PI) / 180
  const earthRadiusMeters = 6371000

  const dLat = toRadians(b.latitude - a.latitude)
  const dLng = toRadians(b.longitude - a.longitude)
  const lat1 = toRadians(a.latitude)
  const lat2 = toRadians(b.latitude)

  const h =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2)

  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h))
  return Math.round(earthRadiusMeters * c)
}

export function evaluateGeofence(input: {
  latitude?: number | null
  longitude?: number | null
  office?: Omit<GeofenceReference, 'type'> | null
  home?: Omit<GeofenceReference, 'type'> | null
}): GeofenceEvaluation {
  const point: GeoPoint | null =
    input.latitude !== undefined && input.latitude !== null && input.longitude !== undefined && input.longitude !== null
      ? { latitude: Number(input.latitude), longitude: Number(input.longitude) }
      : null

  if (!point) {
    return {
      nearestType: 'none',
      distanceMeters: null,
      radiusMeters: null,
      inRadius: null,
      reason: 'missing_coordinates',
    }
  }

  if (!isValidGeoPoint(point)) {
    return {
      nearestType: 'none',
      distanceMeters: null,
      radiusMeters: null,
      inRadius: null,
      reason: 'invalid_coordinates',
    }
  }

  const candidates: GeofenceReference[] = []
  if (input.office && isValidGeoPoint(input.office)) {
    candidates.push({
      type: 'office',
      latitude: Number(input.office.latitude),
      longitude: Number(input.office.longitude),
      radiusMeters: Math.max(1, Number(input.office.radiusMeters || 0)),
    })
  }
  if (input.home && isValidGeoPoint(input.home)) {
    candidates.push({
      type: 'home',
      latitude: Number(input.home.latitude),
      longitude: Number(input.home.longitude),
      radiusMeters: Math.max(1, Number(input.home.radiusMeters || 0)),
    })
  }

  if (candidates.length === 0) {
    return {
      nearestType: 'none',
      distanceMeters: null,
      radiusMeters: null,
      inRadius: null,
      reason: 'no_reference_location',
    }
  }

  const nearest = candidates
    .map((candidate) => ({
      ...candidate,
      distanceMeters: haversineDistanceMeters(point, {
        latitude: candidate.latitude,
        longitude: candidate.longitude,
      }),
    }))
    .sort((a, b) => a.distanceMeters - b.distanceMeters)[0]

  return {
    nearestType: nearest.type,
    distanceMeters: nearest.distanceMeters,
    radiusMeters: nearest.radiusMeters,
    inRadius: nearest.distanceMeters <= nearest.radiusMeters,
    reason: 'ok',
  }
}
