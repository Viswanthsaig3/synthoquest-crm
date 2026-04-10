'use client'

export type GeolocationResult =
  | { ok: true; latitude: number; longitude: number }
  | { ok: false; message: string }

/**
 * Browser GPS for attendance. Requires HTTPS (or localhost) and user permission.
 */
export function getCurrentPositionForAttendance(): Promise<GeolocationResult> {
  if (typeof window === 'undefined' || !navigator.geolocation) {
    return Promise.resolve({
      ok: false,
      message:
        'Location is not available in this browser. Use a device with GPS and allow location access.',
    })
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          ok: true,
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        })
      },
      (err) => {
        const code = err.code
        if (code === 1) {
          resolve({
            ok: false,
            message:
              'Location permission denied. Allow location access in your browser or system settings to check in or out.',
          })
        } else if (code === 2) {
          resolve({
            ok: false,
            message:
              'Location could not be determined. Enable GPS or Wi‑Fi positioning and try again.',
          })
        } else if (code === 3) {
          resolve({
            ok: false,
            message: 'Location request timed out. Move outdoors or try again.',
          })
        } else {
          resolve({
            ok: false,
            message: err.message || 'Could not read your location.',
          })
        }
      },
      { enableHighAccuracy: true, timeout: 25000, maximumAge: 0 }
    )
  })
}
