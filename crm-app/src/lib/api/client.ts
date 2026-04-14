const API_BASE = '/api'

let accessToken: string | null = null

export function setAccessToken(token: string | null) {
  accessToken = token
}

export function getAccessToken() {
  return accessToken
}

async function refreshToken(): Promise<string | null> {
  try {
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'X-Requested-With': 'XMLHttpRequest',
      },
    })

    if (response.ok) {
      const result = await response.json()
      const newToken = result.data?.accessToken
      if (newToken) {
        setAccessToken(newToken)
        return newToken
      }
    }
    return null
  } catch {
    return null
  }
}

export async function apiFetch<T>(endpoint: string, options?: RequestInit, retryOn401 = true): Promise<T> {
  const doFetch = async (token: string | null): Promise<Response> => {
    return fetch(`${API_BASE}${endpoint}`, {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options?.headers,
      },
    })
  }

  let response = await doFetch(accessToken)

  if (response.status === 401 && retryOn401) {
    const newToken = await refreshToken()
    if (newToken) {
      response = await doFetch(newToken)
    }
  }

  const text = await response.text()
  let data: unknown
  try {
    data = text ? JSON.parse(text) : {}
  } catch {
    throw new Error(
      response.status === 404 ? 'Not found' : 'Invalid response from server'
    )
  }

  if (!response.ok) {
    const err = data as { error?: string; details?: Array<{ message?: string; path?: (string | number)[] }> }
    if (err?.details?.length) {
      const fieldErrors = err.details
        .filter(d => d.message)
        .map(d => {
          const field = d.path?.join('.') || ''
          return field ? `${field}: ${d.message}` : d.message
        })
        .join('; ')
      throw new Error(fieldErrors || err?.error || 'Validation error')
    }
    throw new Error(err?.error || 'API request failed')
  }

  return data as T
}