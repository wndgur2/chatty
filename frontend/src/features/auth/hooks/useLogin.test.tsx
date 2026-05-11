import { QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createTestQueryClient } from '../../../test/utils/createTestQueryClient'
import { useLogin } from './useLogin'

const loginSpy = vi.hoisted(() => vi.fn())
const mergeGuestSessionSpy = vi.hoisted(() => vi.fn())
const setAccessTokenSpy = vi.hoisted(() => vi.fn())
const setCurrentUserSpy = vi.hoisted(() => vi.fn())
const getGuestAccessTokenSpy = vi.hoisted(() => vi.fn())
const clearGuestSessionSpy = vi.hoisted(() => vi.fn())

vi.mock('../../../api/auth', () => ({
  login: loginSpy,
  mergeGuestSession: mergeGuestSessionSpy,
}))

vi.mock('../../../shared/lib/auth', () => ({
  setAccessToken: setAccessTokenSpy,
  setCurrentUser: setCurrentUserSpy,
  getGuestAccessToken: getGuestAccessTokenSpy,
  clearGuestSession: clearGuestSessionSpy,
}))

function wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={createTestQueryClient()}>{children}</QueryClientProvider>
}

describe('useLogin', () => {
  beforeEach(() => {
    loginSpy.mockReset()
    mergeGuestSessionSpy.mockReset()
    setAccessTokenSpy.mockReset()
    setCurrentUserSpy.mockReset()
    getGuestAccessTokenSpy.mockReset()
    clearGuestSessionSpy.mockReset()
    getGuestAccessTokenSpy.mockReturnValue(null)
  })

  it('stores token and user when login succeeds', async () => {
    loginSpy.mockResolvedValueOnce({
      accessToken: 'access-token',
      user: { id: '1', username: 'jun' },
    })

    const { result } = renderHook(() => useLogin(), { wrapper })
    result.current.mutate({ username: 'jun' })

    await waitFor(() => {
      expect(setAccessTokenSpy).toHaveBeenCalledWith('access-token')
      expect(setCurrentUserSpy).toHaveBeenCalledWith({ id: '1', username: 'jun' })
    })
  })

  it('clears guest session after successful merge', async () => {
    loginSpy.mockResolvedValueOnce({
      accessToken: 'access-token',
      user: { id: '1', username: 'jun' },
    })
    getGuestAccessTokenSpy.mockReturnValue('guest-token')
    mergeGuestSessionSpy.mockResolvedValueOnce({ success: true })

    const { result } = renderHook(() => useLogin(), { wrapper })
    result.current.mutate({ username: 'jun' })

    await waitFor(() => {
      expect(mergeGuestSessionSpy).toHaveBeenCalledWith('guest-token')
      expect(clearGuestSessionSpy).toHaveBeenCalledTimes(1)
    })
  })

  it('does not clear guest session when merge fails', async () => {
    loginSpy.mockResolvedValueOnce({
      accessToken: 'access-token',
      user: { id: '1', username: 'jun' },
    })
    getGuestAccessTokenSpy.mockReturnValue('guest-token')
    mergeGuestSessionSpy.mockRejectedValueOnce(new Error('temporary outage'))

    const { result } = renderHook(() => useLogin(), { wrapper })
    result.current.mutate({ username: 'jun' })

    await waitFor(() => {
      expect(mergeGuestSessionSpy).toHaveBeenCalledWith('guest-token')
    })
    expect(clearGuestSessionSpy).not.toHaveBeenCalled()
  })
})
