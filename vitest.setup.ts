import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeAll, afterAll } from 'vitest'
import { setupServer } from 'msw/node'
import { handlers } from './__tests__/mocks/handlers'

// Mock ResizeObserver (not available in jsdom)
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

// Setup MSW server for API mocking
export const server = setupServer(...handlers)

// Start server before all tests
beforeAll(() => {
  // Use 'warn' instead of 'error' to avoid breaking tests that don't use MSW
  server.listen({ onUnhandledRequest: 'warn' })
})

// Reset handlers after each test (important for test isolation)
afterEach(() => {
  cleanup()
  server.resetHandlers()
})

// Clean up after all tests
afterAll(() => {
  server.close()
})

