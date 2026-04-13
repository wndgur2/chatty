import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import ForegroundNotificationPopup from './ForegroundNotificationPopup'

describe('ForegroundNotificationPopup', () => {
  it('does not render when open is false', () => {
    render(
      <ForegroundNotificationPopup
        open={false}
        title="title"
        body="body"
        onClick={vi.fn()}
        onClose={vi.fn()}
      />,
    )

    expect(screen.queryByText('title')).toBeNull()
  })

  it('calls onClick when popup is clicked', () => {
    const handleClick = vi.fn()
    render(
      <ForegroundNotificationPopup
        open
        title="New message"
        body="hello"
        onClick={handleClick}
        onClose={vi.fn()}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'New message hello' }))

    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('calls onClose without triggering onClick when dismissing', () => {
    const handleClick = vi.fn()
    const handleClose = vi.fn()
    render(
      <ForegroundNotificationPopup
        open
        title="New message"
        body="hello"
        onClick={handleClick}
        onClose={handleClose}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Dismiss notification popup' }))

    expect(handleClose).toHaveBeenCalledTimes(1)
    expect(handleClick).not.toHaveBeenCalled()
  })
})
