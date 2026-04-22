import { QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { createTestQueryClient } from '../../../test/utils/createTestQueryClient'
import { useLogin } from './useLogin'

const loginSpy = vi.hoisted(() => vi.fn())
const setAccessTokenSpy = vi.hoisted(() => vi.fn())
const setCurrentUserSpy = vi.hoisted(() => vi.fn())

vi.mock('../../../api/auth', () => ({
  login: loginSpy,
}))

vi.mock('../../../shared/lib/auth', () => ({
  setAccessToken: setAccessTokenSpy,
  setCurrentUser: setCurrentUserSpy,
}))

function wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={createTestQueryClient()}>{children}</QueryClientProvider>
}

describe('useLogin', () => {
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
})
