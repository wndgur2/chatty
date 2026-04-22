import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import CreateChatroomModal from './CreateChatroomModal'

const clearProfileImageSpy = vi.hoisted(() => vi.fn())
const setProfileImageSpy = vi.hoisted(() => vi.fn())
const mockFileRef = vi.hoisted(() => ({ current: document.createElement('input') }))
let profileImageValue: File | undefined
let previewUrlValue: string | null

vi.mock('../hooks/useProfileImageInput', () => ({
  useProfileImageInput: () => ({
    profileImage: profileImageValue,
    setProfileImage: setProfileImageSpy,
    previewUrl: previewUrlValue,
    clearProfileImage: clearProfileImageSpy,
    fileInputRef: mockFileRef,
  }),
}))

describe('CreateChatroomModal', () => {
  beforeEach(() => {
    profileImageValue = undefined
    previewUrlValue = null
    clearProfileImageSpy.mockReset()
    setProfileImageSpy.mockReset()
  })

  it('disables submit when required fields are blank', () => {
    render(<CreateChatroomModal isOpen onClose={vi.fn()} onSubmit={vi.fn()} />)

    expect(screen.getByRole('button', { name: 'Create' })).toHaveProperty('disabled', true)
  })

  it('submits trimmed values when fields are filled', () => {
    const onSubmit = vi.fn()
    render(<CreateChatroomModal isOpen onClose={vi.fn()} onSubmit={onSubmit} />)

    fireEvent.change(screen.getByLabelText('Name'), { target: { value: '  Team Alpha  ' } })
    fireEvent.change(screen.getByLabelText('Base Prompt'), { target: { value: '  Be concise  ' } })
    fireEvent.click(screen.getByRole('button', { name: 'Create' }))

    expect(onSubmit).toHaveBeenCalledWith({
      name: 'Team Alpha',
      basePrompt: 'Be concise',
    })
  })

  it('includes selected profile image in payload', () => {
    const onSubmit = vi.fn()
    profileImageValue = new File(['image'], 'avatar.png', { type: 'image/png' })

    render(<CreateChatroomModal isOpen onClose={vi.fn()} onSubmit={onSubmit} />)

    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Room' } })
    fireEvent.change(screen.getByLabelText('Base Prompt'), { target: { value: 'Prompt' } })
    fireEvent.click(screen.getByRole('button', { name: 'Create' }))

    expect(onSubmit).toHaveBeenCalledWith({
      name: 'Room',
      basePrompt: 'Prompt',
      profileImage: profileImageValue,
    })
  })

  it('resets form and image input on cancel', () => {
    const onClose = vi.fn()
    render(<CreateChatroomModal isOpen onClose={onClose} onSubmit={vi.fn()} />)

    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'To reset' } })
    fireEvent.change(screen.getByLabelText('Base Prompt'), { target: { value: 'To reset prompt' } })

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(clearProfileImageSpy).toHaveBeenCalledTimes(1)
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
