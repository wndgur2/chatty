import { fireEvent, render, screen } from '@testing-library/react'
import { createRef } from 'react'
import { describe, expect, it, vi } from 'vitest'
import ChatroomConfiguration from './ChatroomConfiguration'

describe('ChatroomConfiguration', () => {
  const baseProps = () => ({
    nameFieldId: 'name',
    name: 'Room',
    onNameChange: vi.fn(),
    promptFieldId: 'prompt',
    basePrompt: 'Prompt',
    onBasePromptChange: vi.fn(),
    imageFieldId: 'image',
    previewUrl: null as string | null,
    fallbackChar: 'R',
    fileInputRef: createRef<HTMLInputElement>(),
    onProfileImageChange: vi.fn(),
    onClearProfileImage: vi.fn(),
  })

  it('renders avatar fallback and hides clear button without preview image', () => {
    render(<ChatroomConfiguration {...baseProps()} />)

    expect(screen.getByText('R')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Upload Image' })).toBeTruthy()
    expect(screen.queryByTitle('Remove image')).toBeNull()
  })

  it('renders preview image and clear action when preview exists', () => {
    const props = baseProps()
    props.previewUrl = 'https://cdn.example.com/avatar.png'
    render(<ChatroomConfiguration {...props} />)

    expect(screen.getByAltText('Preview')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Change Image' })).toBeTruthy()

    fireEvent.click(screen.getByTitle('Remove image'))
    expect(props.onClearProfileImage).toHaveBeenCalledTimes(1)
  })

  it('opens hidden file input when upload button is clicked', () => {
    const props = baseProps()
    const clickSpy = vi.spyOn(HTMLInputElement.prototype, 'click')

    render(<ChatroomConfiguration {...props} />)
    fireEvent.click(screen.getByRole('button', { name: 'Upload Image' }))

    expect(clickSpy).toHaveBeenCalledTimes(1)
    clickSpy.mockRestore()
  })

  it('supports promptRequired true/false', () => {
    const { rerender } = render(<ChatroomConfiguration {...baseProps()} promptRequired />)
    expect(screen.getByLabelText('Base Prompt')).toHaveProperty('required', true)

    rerender(<ChatroomConfiguration {...baseProps()} promptRequired={false} />)
    expect(screen.getByLabelText('Base Prompt')).toHaveProperty('required', false)
  })
})
