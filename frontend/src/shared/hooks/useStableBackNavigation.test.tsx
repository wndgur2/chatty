import { act, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useStableBackNavigation } from './useStableBackNavigation'

function HookHarness({
  isSidebarOpen = false,
  setSidebarOpen = vi.fn(),
}: {
  isSidebarOpen?: boolean
  setSidebarOpen?: (isOpen: boolean) => void
}) {
  const { showExitHint, handlePopNavigation } = useStableBackNavigation({
    isSidebarOpen,
    setSidebarOpen,
  })

  return (
    <div>
      <button
        onClick={() => {
          const shouldBlock = handlePopNavigation()
          document.body.setAttribute('data-blocked', String(shouldBlock))
        }}
      >
        trigger-pop
      </button>
      <span>{showExitHint ? 'hint-visible' : 'hint-hidden'}</span>
    </div>
  )
}

describe('useStableBackNavigation', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
    document.body.removeAttribute('data-blocked')
  })

  it('blocks first back at root and allows second back within exit window', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<HookHarness />} />
        </Routes>
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByText('trigger-pop'))
    expect(document.body.getAttribute('data-blocked')).toBe('true')
    expect(screen.getByText('hint-visible')).toBeTruthy()

    fireEvent.click(screen.getByText('trigger-pop'))
    expect(document.body.getAttribute('data-blocked')).toBe('false')
    expect(screen.getByText('hint-hidden')).toBeTruthy()
  })

  it('allows normal POP navigation on non-root routes', () => {
    render(
      <MemoryRouter initialEntries={['/chat/1']}>
        <Routes>
          <Route path="/chat/:id" element={<HookHarness />} />
        </Routes>
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByText('trigger-pop'))
    expect(document.body.getAttribute('data-blocked')).toBe('false')
    expect(screen.getByText('hint-hidden')).toBeTruthy()
  })

  it('closes sidebar first on mobile viewport and consumes back press', () => {
    const setSidebarOpen = vi.fn()
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockImplementation(() => ({
        matches: true,
        media: '(max-width: 767px)',
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    )

    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<HookHarness isSidebarOpen setSidebarOpen={setSidebarOpen} />} />
        </Routes>
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByText('trigger-pop'))

    expect(setSidebarOpen).toHaveBeenCalledWith(false)
    expect(document.body.getAttribute('data-blocked')).toBe('true')
  })

  it('resets exit hint when timeout expires', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<HookHarness />} />
        </Routes>
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByText('trigger-pop'))
    expect(screen.getByText('hint-visible')).toBeTruthy()

    act(() => {
      vi.advanceTimersByTime(2000)
    })

    expect(screen.getByText('hint-hidden')).toBeTruthy()
  })
})
