import type { ReactNode } from 'react'
import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Outlet, Route, Routes } from 'react-router'
import { ROUTES } from '../../../routes/paths'
import { useFcmForeground } from './useFcmForeground'

const unsubscribeSpy = vi.hoisted(() => vi.fn())
const onForegroundMessageSpy = vi.hoisted(() => vi.fn())
const isBrowserPushMessagingSupportedSpy = vi.hoisted(() => vi.fn())

vi.mock('../../../shared/notifications/firebase', () => ({
  isBrowserPushMessagingSupported: isBrowserPushMessagingSupportedSpy,
  getFirebaseApp: () => ({}),
  getMessagingInstance: () => ({}),
  onForegroundMessage: onForegroundMessageSpy,
}))

function createRouterWrapper(initialEntries: string[]) {
  return function RouterWrapper({ children }: { children: ReactNode }) {
    return (
      <MemoryRouter initialEntries={initialEntries}>
        <Routes>
          <Route
            path="/"
            element={
              <>
                {children}
                <Outlet />
              </>
            }
          >
            <Route index element={<div />} />
            <Route path={ROUTES.CHATROOM(':id')} element={<div />} />
          </Route>
        </Routes>
      </MemoryRouter>
    )
  }
}

describe('useFcmForeground', () => {
  beforeEach(() => {
    unsubscribeSpy.mockClear()
    onForegroundMessageSpy.mockReset()
    isBrowserPushMessagingSupportedSpy.mockResolvedValue(true)

    onForegroundMessageSpy.mockReturnValue(unsubscribeSpy)
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      value: 'visible',
    })
  })

  it('maps push payload into popup state', async () => {
    const { result } = renderHook(() => useFcmForeground(), {
      wrapper: createRouterWrapper(['/']),
    })

    await waitFor(() => {
      expect(onForegroundMessageSpy).toHaveBeenCalledTimes(1)
    })

    const callback = onForegroundMessageSpy.mock.calls[0][1] as (payload: {
      data?: Record<string, string>
    }) => void

    act(() => {
      callback({
        data: {
          chatroomId: '3',
          chatroomName: 'AI',
          messagePreview: 'New message',
        },
      })
    })

    await waitFor(() => {
      expect(result.current.popup).toEqual({
        chatroomId: '3',
        title: 'AI',
        body: 'New message',
      })
    })
    expect(result.current.getPopupChatroomPath()).toBe('/chat/3')
  })

  it('ignores payload when tab is hidden', async () => {
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      value: 'hidden',
    })
    const { result } = renderHook(() => useFcmForeground(), {
      wrapper: createRouterWrapper(['/']),
    })

    await waitFor(() => {
      expect(onForegroundMessageSpy).toHaveBeenCalledTimes(1)
    })

    const callback = onForegroundMessageSpy.mock.calls[0][1] as (payload: {
      data?: Record<string, string>
    }) => void

    act(() => {
      callback({
        data: {
          chatroomId: '3',
          chatroomName: 'AI',
          messagePreview: 'New message',
        },
      })
    })

    await waitFor(() => {
      expect(result.current.popup).toBeNull()
    })
  })

  it('does not show popup when message is for the open chatroom', async () => {
    const { result } = renderHook(() => useFcmForeground(), {
      wrapper: createRouterWrapper(['/chat/3']),
    })

    await waitFor(() => {
      expect(onForegroundMessageSpy).toHaveBeenCalledTimes(1)
    })

    const callback = onForegroundMessageSpy.mock.calls[0][1] as (payload: {
      data?: Record<string, string>
    }) => void

    act(() => {
      callback({
        data: {
          chatroomId: '3',
          chatroomName: 'AI',
          messagePreview: 'New message',
        },
      })
    })

    expect(result.current.popup).toBeNull()
  })

  it('unsubscribes on unmount', async () => {
    const { unmount } = renderHook(() => useFcmForeground(), {
      wrapper: createRouterWrapper(['/']),
    })

    await waitFor(() => {
      expect(onForegroundMessageSpy).toHaveBeenCalledTimes(1)
    })

    unmount()
    expect(unsubscribeSpy).toHaveBeenCalledTimes(1)
  })

  it('clears popup and chatroom path', async () => {
    const { result } = renderHook(() => useFcmForeground(), {
      wrapper: createRouterWrapper(['/']),
    })

    await waitFor(() => {
      expect(onForegroundMessageSpy).toHaveBeenCalledTimes(1)
    })

    const callback = onForegroundMessageSpy.mock.calls[0][1] as (payload: {
      data?: Record<string, string>
    }) => void
    act(() => {
      callback({
        data: {
          chatroomId: '99',
          title: 'Title',
          body: 'Body',
        },
      })
    })

    await waitFor(() => {
      expect(result.current.popup?.chatroomId).toBe('99')
    })

    act(() => {
      result.current.clearPopup()
    })

    await waitFor(() => {
      expect(result.current.popup).toBeNull()
    })
    expect(result.current.getPopupChatroomPath()).toBeNull()
  })
})
