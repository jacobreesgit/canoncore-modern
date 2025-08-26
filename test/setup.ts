// Test setup file for Vitest
import { beforeAll, afterAll, beforeEach } from 'vitest'
import { config } from 'dotenv'

// Load test environment variables
config({ path: '.env.test' })

// Global test setup
beforeAll(async () => {
  // Setup test database or other global test resources
  console.log('🧪 Setting up test environment...')

  // Set NODE_ENV to development for tests to enable console.error statements
  Object.defineProperty(process.env, 'NODE_ENV', {
    value: 'development',
    writable: true,
    enumerable: true,
    configurable: true,
  })
})

afterAll(async () => {
  // Cleanup after all tests
  console.log('🧹 Cleaning up test environment...')
})

beforeEach(() => {
  // Reset any global state before each test
})
