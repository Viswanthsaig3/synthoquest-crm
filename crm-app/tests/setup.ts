import { beforeAll, afterAll, afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'

// Clean up after each test
afterEach(() => {
  cleanup()
})

// Global test configuration
beforeAll(() => {
  // Set test environment variables
  process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000'
})

// Cleanup after all tests
afterAll(() => {
  // Any global cleanup
})