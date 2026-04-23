import { describe, expect, it, vi } from 'vitest'
import { notifySessionExpired, registerSessionExpiredHandler } from './sessionExpired'

describe('sessionExpired handlers', () => {
  it('calls the registered session-expired handler', () => {
    const handler = vi.fn()
    registerSessionExpiredHandler(handler)

    notifySessionExpired()
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('does not throw when handler is cleared', () => {
    registerSessionExpiredHandler(null)
    expect(() => notifySessionExpired()).not.toThrow()
  })
})
