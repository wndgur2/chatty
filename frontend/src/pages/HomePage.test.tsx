import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import HomePage from './HomePage'

const useLocationSpy = vi.hoisted(() => vi.fn())
const useChatroomsSpy = vi.hoisted(() => vi.fn())
const useCreateChatroomFlowSpy = vi.hoisted(() => vi.fn())

vi.mock('react-router', async () => {
  const actual = await vi.importActual<typeof import('react-router')>('react-router')
  return {
    ...actual,
    Navigate: ({ to }: { to: string }) => <div>redirect:{to}</div>,
    useLocation: useLocationSpy,
  }
})

vi.mock('../features/chatrooms/hooks/useChatrooms', () => ({
  useChatrooms: useChatroomsSpy,
}))
vi.mock('../features/chatrooms/hooks/useCreateChatroomFlow', () => ({
  useCreateChatroomFlow: useCreateChatroomFlowSpy,
}))
vi.mock('../features/chatrooms/components/CreateChatroomModal', () => ({
  default: () => <div>create-chatroom-modal</div>,
}))
vi.mock('../shared/ui/GithubLink', () => ({ default: () => <div>github-link</div> }))

describe('HomePage', () => {
  beforeEach(() => {
    vi.unstubAllEnvs()
    useLocationSpy.mockReturnValue({ state: null })
    useChatroomsSpy.mockReturnValue({ data: [], isLoading: false, isError: false })
    useCreateChatroomFlowSpy.mockReturnValue({
      isCreateModalOpen: false,
      openCreateModal: vi.fn(),
      closeCreateModal: vi.fn(),
      handleCreateChatroom: vi.fn(),
      isCreating: false,
    })
  })

  it('renders welcome view when no redirect is needed', () => {
    render(<HomePage />)
    expect(screen.getByRole('heading', { name: "Let's get talking." })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Create New Buddy' })).toBeTruthy()
    expect(screen.getByText('github-link')).toBeTruthy()
    expect(screen.getByText('create-chatroom-modal')).toBeTruthy()
  })

  it('redirects from login when chatrooms exist', () => {
    useLocationSpy.mockReturnValue({ state: { fromLogin: true } })
    useChatroomsSpy.mockReturnValue({
      data: [
        {
          id: 88,
          name: 'Room',
          updatedAt: '2026-01-01T00:00:00.000Z',
          createdAt: '2026-01-01T00:00:00.000Z',
        },
      ],
      isLoading: false,
      isError: false,
    })
    render(<HomePage />)
    expect(screen.getByText('redirect:/chat/88')).toBeTruthy()
  })
})
