import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import SendTestNotificationButton from './SendTestNotificationButton'

const mutateAsyncSpy = vi.hoisted(() => vi.fn().mockResolvedValue(undefined))

vi.mock('../hooks/useSendTestNotification', () => ({
  useSendTestNotification: () => ({
    mutateAsync: mutateAsyncSpy,
    isPending: false,
    error: null,
  }),
}))

function renderWithRoute(route: string, isDevOverride: boolean) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <Routes>
        <Route
          path="/chat/:id"
          element={<SendTestNotificationButton isDevOverride={isDevOverride} />}
        />
      </Routes>
    </MemoryRouter>,
  )
}

describe('SendTestNotificationButton', () => {
  beforeEach(() => {
    mutateAsyncSpy.mockClear()
  })

  it('calls test notification mutation with chatroomId', () => {
    renderWithRoute('/chat/7', true)

    fireEvent.click(screen.getByRole('button', { name: 'Send test notification' }))

    expect(mutateAsyncSpy).toHaveBeenCalledWith({ chatroomId: 7 })
  })

  it('does not render in non-dev mode', () => {
    renderWithRoute('/chat/7', false)

    expect(screen.queryByRole('button', { name: 'Send test notification' })).toBeNull()
  })
})
