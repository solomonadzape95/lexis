import { describe, it, expect } from 'vitest'

/**
 * Basic setup test to verify Vitest is working correctly
 */
describe('Test Setup', () => {
  it('should run tests', () => {
    expect(true).toBe(true)
  })

  it('should have access to vitest globals', () => {
    expect(typeof describe).toBe('function')
    expect(typeof it).toBe('function')
    expect(typeof expect).toBe('function')
  })
})
