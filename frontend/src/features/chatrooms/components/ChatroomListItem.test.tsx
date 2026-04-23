import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import ChatroomListItem from './ChatroomListItem'

const formatRelativeTimeSpy = vi.hoisted(() => vi.fn())

vi.mock('../../../shared/lib/date', () => ({
  formatRelativeTime: formatRelativeTimeSpy,
}))

describe('ChatroomListItem', () => {
  const room = {
    id: 12,
    name: 'Alpha Room',
    basePrompt: 'Prompt text',
    profileImageUrl: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-02T00:00:00.000Z',
  }

  it('renders route, fallback avatar and prompt details', () => {
    formatRelativeTimeSpy.mockReturnValue('2h')
    render(
      <MemoryRouter initialEntries={['/']}>
        <ChatroomListItem {...room} />
      </MemoryRouter>,
    )

    const link = screen.getByRole('link')
    expect(link.getAttribute('href')).toBe('/chat/12')
    expect(screen.getByText('Alpha Room')).toBeTruthy()
    expect(screen.getByText('Prompt text')).toBeTruthy()
    expect(screen.getByText('2h')).toBeTruthy()
    expect(screen.getByText('A')).toBeTruthy()
  })

  it('uses active class when route matches', () => {
    formatRelativeTimeSpy.mockReturnValue('now')
    render(
      <MemoryRouter initialEntries={['/chat/12']}>
        <Routes>
          <Route path="/chat/:id" element={<ChatroomListItem {...room} />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByRole('link').className).toContain('bg-gray-100')
  })

  it('uses inactive class when route does not match', () => {
    formatRelativeTimeSpy.mockReturnValue('now')
    render(
      <MemoryRouter initialEntries={['/chat/99']}>
        <Routes>
          <Route path="/chat/:id" element={<ChatroomListItem {...room} />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByRole('link').className).toContain('hover:bg-gray-50')
  })
})
