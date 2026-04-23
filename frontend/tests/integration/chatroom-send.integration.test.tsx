import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import React from 'react'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ChatroomScreen from '../../src/features/chatroom/components/ChatroomScreen'

const navigateSpy = vi.hoisted(() => vi.fn())
const sendMutateSpy = vi.hoisted(() => vi.fn())
const branchMutateSpy = vi.hoisted(() => vi.fn())
const cloneMutateSpy = vi.hoisted(() => vi.fn())
const deleteMutateSpy = vi.hoisted(() => vi.fn())
const updateMutateSpy = vi.hoisted(() => vi.fn())

let chatroomData: {
  id: number
  name: string
  basePrompt: string | null
  profileImageUrl: string | null
  createdAt: string
} | null = null
let isChatroomLoading = false
let messagesData: Array<{ id: number; sender: 'user' | 'ai'; content: string }> = []
let isMessagesLoading = false
let sendPending = false
let branchPending = false
let clonePending = false
let deletePending = false
let updatePending = false
let isTypingValue = false
let streamingContentValue = ''

vi.mock('react-router', async () => {
  const actual = await vi.importActual<typeof import('react-router')>('react-router')
  return {
    ...actual,
    useNavigate: () => navigateSpy,
  }
})

vi.mock('../../src/features/chatroom/hooks/useChatroom', () => ({
  useChatroom: () => ({
    data: chatroomData,
    isLoading: isChatroomLoading,
  }),
  useUpdateChatroom: () => ({ mutate: updateMutateSpy, isPending: updatePending }),
  useDeleteChatroom: () => ({ mutate: deleteMutateSpy, isPending: deletePending }),
  useBranchChatroom: () => ({ mutate: branchMutateSpy, isPending: branchPending }),
  useCloneChatroom: () => ({ mutate: cloneMutateSpy, isPending: clonePending }),
}))

vi.mock('../../src/features/chatroom/hooks/useMessages', () => ({
  useMessages: () => ({
    data: messagesData,
    isLoading: isMessagesLoading,
  }),
  useSendMessage: () => ({
    mutate: sendMutateSpy,
    mutateAsync: sendMutateSpy,
    isPending: sendPending,
  }),
}))

vi.mock('../../src/features/chatroom/hooks/useWebSocketStream', () => ({
  useWebSocketStream: () => ({
    isTyping: isTypingValue,
    streamingContent: streamingContentValue,
  }),
}))

describe('chatroom send flow integration', () => {
  beforeEach(() => {
    chatroomData = {
      id: 9,
      name: 'Test room',
      basePrompt: null,
      profileImageUrl: null,
      createdAt: '2026-01-01T00:00:00.000Z',
    }
    isChatroomLoading = false
    messagesData = []
    isMessagesLoading = false
    sendPending = false
    branchPending = false
    clonePending = false
    deletePending = false
    updatePending = false
    isTypingValue = false
    streamingContentValue = ''
    navigateSpy.mockReset()
    sendMutateSpy.mockReset()
    branchMutateSpy.mockReset()
    cloneMutateSpy.mockReset()
    deleteMutateSpy.mockReset()
    updateMutateSpy.mockReset()
  })

  it('submits trimmed message payload from composer', async () => {
    render(
      <MemoryRouter>
        <ChatroomScreen chatroomId={9} />
      </MemoryRouter>,
    )

    fireEvent.change(screen.getByPlaceholderText('Message Chatty...'), {
      target: { value: '  hello chatty  ' },
    })
    fireEvent.click(document.querySelector('button[type="submit"]') as HTMLButtonElement)

    await waitFor(() => {
      expect(sendMutateSpy).toHaveBeenCalledWith({
        chatroomId: 9,
        request: { content: 'hello chatty' },
      })
    })
  })

  it('renders loading and not-found states', () => {
    isChatroomLoading = true
    const { rerender } = render(
      <MemoryRouter>
        <ChatroomScreen chatroomId={9} />
      </MemoryRouter>,
    )
    expect(screen.getByText('Loading...')).toBeTruthy()

    isChatroomLoading = false
    chatroomData = null
    rerender(
      <MemoryRouter>
        <ChatroomScreen chatroomId={9} />
      </MemoryRouter>,
    )
    expect(screen.getByText('Chatroom not found.')).toBeTruthy()
  })

  it('blocks submit when sending is locked', () => {
    sendPending = true
    render(
      <MemoryRouter>
        <ChatroomScreen chatroomId={9} />
      </MemoryRouter>,
    )

    fireEvent.change(screen.getByPlaceholderText('Message Chatty...'), {
      target: { value: 'hello while locked' },
    })
    fireEvent.click(document.querySelector('button[type="submit"]') as HTMLButtonElement)

    expect(sendMutateSpy).not.toHaveBeenCalled()
  })

  it('runs branch/clone/delete flows and navigates on success', async () => {
    const { container } = render(
      <MemoryRouter>
        <ChatroomScreen chatroomId={9} />
      </MemoryRouter>,
    )

    const headerButtons = container.querySelectorAll('header button')
    const branchButton = headerButtons[0] as HTMLButtonElement
    const cloneButton = headerButtons[1] as HTMLButtonElement
    const editButton = headerButtons[2] as HTMLButtonElement

    fireEvent.click(branchButton)
    fireEvent.click(screen.getByRole('button', { name: 'Branch' }))
    const branchOptions = branchMutateSpy.mock.calls[0][1] as {
      onSuccess: (room: { id: number }) => void
    }
    act(() => {
      branchOptions.onSuccess({ id: 101 })
    })

    fireEvent.click(cloneButton)
    fireEvent.click(screen.getByRole('button', { name: 'Clone' }))
    const cloneOptions = cloneMutateSpy.mock.calls[0][1] as {
      onSuccess: (room: { id: number }) => void
    }
    act(() => {
      cloneOptions.onSuccess({ id: 102 })
    })

    fireEvent.click(editButton)
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))
    fireEvent.click(screen.getAllByRole('button', { name: 'Delete' }).at(-1) as HTMLButtonElement)
    const deleteOptions = deleteMutateSpy.mock.calls[0][1] as { onSuccess: () => void }
    act(() => {
      deleteOptions.onSuccess()
    })

    await waitFor(() => {
      expect(navigateSpy).toHaveBeenCalledWith('/chat/101')
      expect(navigateSpy).toHaveBeenCalledWith('/chat/102')
      expect(navigateSpy).toHaveBeenCalledWith('/')
    })
  })
})
