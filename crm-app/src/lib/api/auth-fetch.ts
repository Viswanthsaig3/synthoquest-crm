'use client'

import { getAccessToken, setAccessToken } from './client'

export async function fetchWithAccessTokenRefresh(
  input: RequestInfo | URL,
  init: RequestInit = {}
): Promise<Response> {
  const baseHeaders = new Headers(init.headers)
  const token = getAccessToken()
  if (token && !baseHeaders.has('Authorization')) {
    baseHeaders.set('Authorization', `Bearer ${token}`)
  }

  const credentials = init.credentials ?? 'include'

  const doFetch = () =>
    fetch(input, {
      ...init,
      headers: baseHeaders,
      credentials,
    })

  let res = await doFetch()
  if (res.status !== 401) return res

  const refreshRes = await fetch('/api/auth/refresh', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'X-Requested-With': 'XMLHttpRequest',
    },
  })

  if (!refreshRes.ok) return res

  const json = (await refreshRes.json().catch(() => null)) as {
    data?: { accessToken?: string }
  } | null
  const newToken = json?.data?.accessToken
  if (!newToken) return res

  setAccessToken(newToken)
  baseHeaders.set('Authorization', `Bearer ${newToken}`)

  return fetch(input, {
    ...init,
    headers: baseHeaders,
    credentials,
  })
}