export const CORRELATION_ID_HEADER = 'x-correlation-id'
export const CORRELATION_ID_KEY = 'correlationId'

export function generateCorrelationId(): string {
  // Use Web Crypto API (works in Edge Runtime) instead of Node.js crypto
  return crypto.randomUUID()
}

export function getCorrelationIdFromHeaders(headers: Headers): string | null {
  return headers.get(CORRELATION_ID_HEADER)
}

export function setCorrelationIdHeader(response: Headers, correlationId: string): void {
  response.set(CORRELATION_ID_HEADER, correlationId)
}

export function formatLogMessage(correlationId: string | null, message: string): string {
  if (correlationId) {
    return `[${correlationId}] ${message}`
  }
  return message
}

export function createErrorResponse(correlationId: string, error: string, status: number, additionalData?: Record<string, unknown>): { body: Record<string, unknown>; headers: Record<string, string> } {
  return {
    body: {
      error,
      correlationId,
      ...additionalData,
    },
    headers: {
      [CORRELATION_ID_HEADER]: correlationId,
    },
  }
}