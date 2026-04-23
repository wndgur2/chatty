import { fireEvent, render, screen } from '@testing-library/react'
import { createRef, type FormEvent } from 'react'
import { describe, expect, it, vi } from 'vitest'
import Composer from './Composer'

describe('Composer', () => {
  it('disables submit button when input is blank', () => {
    render(
      <Composer
        inputRef={createRef<HTMLTextAreaElement>()}
        inputValue="   "
        isSendLocked={false}
        onInputChange={vi.fn()}
        onSubmit={vi.fn()}
      />,
    )

    expect(screen.getByRole('button', { name: 'Send message' }).hasAttribute('disabled')).toBe(true)
  })

  it('calls callbacks for typing and submit', () => {
    const handleInputChange = vi.fn()
    const handleSubmit = vi.fn((event: FormEvent) => event.preventDefault())

    render(
      <Composer
        inputRef={createRef<HTMLTextAreaElement>()}
        inputValue="hello"
        isSendLocked={false}
        onInputChange={handleInputChange}
        onSubmit={handleSubmit}
      />,
    )

    fireEvent.change(screen.getByPlaceholderText('Message Chatty...'), { target: { value: 'new value' } })
    fireEvent.submit(screen.getByRole('button', { name: 'Send message' }).closest('form') as HTMLFormElement)

    expect(handleInputChange).toHaveBeenCalledWith('new value')
    expect(handleSubmit).toHaveBeenCalledTimes(1)
  })

  it('expands textarea rows up to 6 lines', () => {
    render(
      <Composer
        inputRef={createRef<HTMLTextAreaElement>()}
        inputValue={'1\n2\n3\n4\n5\n6\n7'}
        isSendLocked={false}
        onInputChange={vi.fn()}
        onSubmit={vi.fn()}
      />,
    )

    expect(screen.getByPlaceholderText('Message Chatty...').getAttribute('rows')).toBe('6')
  })
})
