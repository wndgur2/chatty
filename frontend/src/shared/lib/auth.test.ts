import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  clearAuth,
  getAccessToken,
  getCurrentUser,
  isAuthenticated,
  setAccessToken,
  setCurrentUser,
} from './auth'

const getStateSpy = vi.hoisted(() => vi.fn())

vi.mock('../stores/authStore', () => ({
  useAuthStore: {
    getState: getStateSpy,
  },
}))

describe('auth helpers', () => {
  const state = {
    accessToken: null as string | null,
    user: null as { id: string; username: string } | null,
    setAccessToken: vi.fn((token: string) => {
      state.accessToken = token
    }),
    setCurrentUser: vi.fn((user: { id: string; username: string }) => {
      state.user = user
    }),
    clearAuth: vi.fn(() => {
      state.accessToken = null
      state.user = null
    }),
  }

  beforeEach(() => {
    state.accessToken = null
    state.user = null
    state.setAccessToken.mockClear()
    state.setCurrentUser.mockClear()
    state.clearAuth.mockClear()
    getStateSpy.mockReturnValue(state)
  })

  it('sets and reads access token', () => {
    setAccessToken('token-1')
    expect(state.setAccessToken).toHaveBeenCalledWith('token-1')
    expect(getAccessToken()).toBe('token-1')
    expect(isAuthenticated()).toBe(true)
  })

  it('sets and reads current user', () => {
    const user = { id: '3', username: 'user' }
    setCurrentUser(user)
    expect(state.setCurrentUser).toHaveBeenCalledWith(user)
    expect(getCurrentUser()).toEqual(user)
  })

  it('clears auth state', () => {
    setAccessToken('token-2')
    setCurrentUser({ id: '7', username: 'admin' })
    clearAuth()
    expect(state.clearAuth).toHaveBeenCalledTimes(1)
    expect(isAuthenticated()).toBe(false)
    expect(getCurrentUser()).toBeNull()
  })
})
