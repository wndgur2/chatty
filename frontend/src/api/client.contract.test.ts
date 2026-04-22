import { beforeEach, describe, expect, it, vi } from 'vitest'

interface InterceptorHandler<TArg, TResult> {
  fulfilled?: (value: TArg) => TResult
  rejected?: (error: unknown) => Promise<unknown>
}

interface RequestInterceptors {
  handlers: Array<InterceptorHandler<{ headers: Record<string, string> }, { headers: Record<string, string> }>>
}

interface ResponseInterceptors {
  handlers: Array<InterceptorHandler<unknown, unknown>>
}

const clearAuthSpy = vi.hoisted(() => vi.fn())
const getAccessTokenSpy = vi.hoisted(() => vi.fn())
const notifySessionExpiredSpy = vi.hoisted(() => vi.fn())
const clearQueryClientSpy = vi.hoisted(() => vi.fn())

vi.mock('../shared/lib/auth', () => ({
  clearAuth: clearAuthSpy,
  getAccessToken: getAccessTokenSpy,
}))

vi.mock('../shared/lib/sessionExpired', () => ({
  notifySessionExpired: notifySessionExpiredSpy,
}))

vi.mock('../app/providers/queryClient', () => ({
  queryClient: {
    clear: clearQueryClientSpy,
  },
}))

describe('api client contract', () => {
  beforeEach(() => {
    clearAuthSpy.mockClear()
    getAccessTokenSpy.mockClear()
    notifySessionExpiredSpy.mockClear()
    clearQueryClientSpy.mockClear()
  })

  it('attaches bearer token in request interceptor when token exists', async () => {
    getAccessTokenSpy.mockReturnValue('token')
    const { apiClient } = await import('./client')
    const requestHandlers = (apiClient.interceptors.request as unknown as RequestInterceptors).handlers
    const requestInterceptor = requestHandlers[0]?.fulfilled
    expect(requestInterceptor).toBeTypeOf('function')

    const nextConfig = requestInterceptor?.({ headers: {} })

    expect(nextConfig?.headers.Authorization).toBe('Bearer token')
  })

  it('clears auth/session state for non-login 401 responses', async () => {
    const { apiClient } = await import('./client')
    const responseHandlers = (apiClient.interceptors.response as unknown as ResponseInterceptors).handlers
    const responseInterceptor = responseHandlers[0]?.rejected
    expect(responseInterceptor).toBeTypeOf('function')

    await expect(
      responseInterceptor?.({
        response: { status: 401 },
        config: { url: '/chatrooms' },
      }),
    ).rejects.toBeTruthy()

    expect(clearAuthSpy).toHaveBeenCalledTimes(1)
    expect(clearQueryClientSpy).toHaveBeenCalledTimes(1)
    expect(notifySessionExpiredSpy).toHaveBeenCalledTimes(1)
  })

  it('skips auth clear for login 401 responses', async () => {
    const { apiClient } = await import('./client')
    const responseHandlers = (apiClient.interceptors.response as unknown as ResponseInterceptors).handlers
    const responseInterceptor = responseHandlers[0]?.rejected
    expect(responseInterceptor).toBeTypeOf('function')

    await expect(
      responseInterceptor?.({
        response: { status: 401 },
        config: { url: '/auth/login' },
      }),
    ).rejects.toBeTruthy()

    expect(clearAuthSpy).not.toHaveBeenCalled()
    expect(clearQueryClientSpy).not.toHaveBeenCalled()
    expect(notifySessionExpiredSpy).not.toHaveBeenCalled()
  })
})
