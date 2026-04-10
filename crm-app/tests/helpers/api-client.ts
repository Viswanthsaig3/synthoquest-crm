/**
 * API Test Helper
 * Provides utilities for making authenticated API requests in tests
 */

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

export interface TestResponse<T = any> {
  status: number
  data: T
  headers: Headers
}

export class APIClient {
  private baseUrl: string
  private accessToken: string | null = null

  constructor(baseUrl: string = BASE_URL) {
    this.baseUrl = baseUrl
  }

  setAccessToken(token: string) {
    this.accessToken = token
  }

  clearAccessToken() {
    this.accessToken = null
  }

  private async request<T>(
    method: string,
    endpoint: string,
    options: {
      body?: any
      customHeaders?: Record<string, string>
    } = {}
  ): Promise<TestResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`
    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.customHeaders,
    }

    if (this.accessToken) {
      requestHeaders['Authorization'] = `Bearer ${this.accessToken}`
    }

    const fetchOptions: RequestInit = {
      method,
      headers: requestHeaders,
    }

    if (options.body && method !== 'GET') {
      fetchOptions.body = JSON.stringify(options.body)
    }

    const response = await fetch(url, fetchOptions)

    let data: any
    const contentType = response.headers.get('content-type')
    if (contentType?.includes('application/json')) {
      data = await response.json()
    } else {
      data = await response.text()
    }

    return {
      status: response.status,
      data,
      headers: response.headers,
    }
  }

  async get<T = any>(endpoint: string, customHeaders?: Record<string, string>) {
    return this.request<T>('GET', endpoint, { customHeaders })
  }

  async post<T = any>(endpoint: string, body?: any, customHeaders?: Record<string, string>) {
    return this.request<T>('POST', endpoint, { body, customHeaders })
  }

  async put<T = any>(endpoint: string, body?: any, customHeaders?: Record<string, string>) {
    return this.request<T>('PUT', endpoint, { body, customHeaders })
  }

  async patch<T = any>(endpoint: string, body?: any, customHeaders?: Record<string, string>) {
    return this.request<T>('PATCH', endpoint, { body, customHeaders })
  }

  async delete<T = any>(endpoint: string, customHeaders?: Record<string, string>) {
    return this.request<T>('DELETE', endpoint, { customHeaders })
  }
}

// Singleton instance for tests
export const apiClient = new APIClient()