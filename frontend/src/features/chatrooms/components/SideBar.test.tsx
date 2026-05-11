import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import SideBar from './SideBar'
import { ROUTES } from '../../../routes/paths'

const navigateSpy = vi.hoisted(() => vi.fn())
const clearAuthSpy = vi.hoisted(() => vi.fn())
const clearGuestSessionSpy = vi.hoisted(() => vi.fn())
const queryClientClearSpy = vi.hoisted(() => vi.fn())
const useChatroomsSpy = vi.hoisted(() => vi.fn())
const useCreateChatroomFlowSpy = vi.hoisted(() => vi.fn())
const setSidebarOpenSpy = vi.hoisted(() => vi.fn())

vi.mock('react-router', async () => {
  const actual = await vi.importActual<typeof import('react-router')>('react-router')
  return {
    ...actual,
    useNavigate: () => navigateSpy,
  }
})

vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual<typeof import('@tanstack/react-query')>('@tanstack/react-query')
  return {
    ...actual,
    useQueryClient: () => ({
      clear: queryClientClearSpy,
    }),
  }
})

vi.mock('../../../shared/lib/auth', () => ({
  clearAuth: clearAuthSpy,
  clearGuestSession: clearGuestSessionSpy,
}))

const authStoreAccessToken = vi.hoisted(() => ({ value: 'member-session' as string | null }))

vi.mock('../../../shared/stores/authStore', () => ({
  useAuthStore: <T,>(selector: (state: { accessToken: string | null }) => T) =>
    selector({ accessToken: authStoreAccessToken.value }),
}))

vi.mock('../../../shared/stores/uiStore', () => ({
  useUIStore: (selector: (state: { setSidebarOpen: (isOpen: boolean) => void }) => unknown) =>
    selector({ setSidebarOpen: setSidebarOpenSpy }),
}))

vi.mock('../hooks/useChatrooms', () => ({
  useChatrooms: () => useChatroomsSpy(),
}))

vi.mock('../hooks/useCreateChatroomFlow', () => ({
  useCreateChatroomFlow: () => useCreateChatroomFlowSpy(),
}))

describe('SideBar', () => {
  beforeEach(() => {
    authStoreAccessToken.value = 'member-session'
    navigateSpy.mockReset()
    clearAuthSpy.mockReset()
    clearGuestSessionSpy.mockReset()
    queryClientClearSpy.mockReset()
    setSidebarOpenSpy.mockReset()
    useChatroomsSpy.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
    })
    useCreateChatroomFlowSpy.mockReturnValue({
      isCreateModalOpen: false,
      openCreateModal: vi.fn(),
      closeCreateModal: vi.fn(),
      handleCreateChatroom: vi.fn(),
      isCreating: false,
    })
  })

  it('renders loading and error states', () => {
    useChatroomsSpy.mockReturnValue({ data: [], isLoading: true, isError: true })
    render(
      <MemoryRouter>
        <SideBar />
      </MemoryRouter>,
    )

    expect(screen.getByText('Loading...')).toBeTruthy()
    expect(screen.getByText('Failed to load chatrooms.')).toBeTruthy()
  })

  it('renders empty state and opens create modal', () => {
    const openCreateModal = vi.fn()
    useCreateChatroomFlowSpy.mockReturnValue({
      isCreateModalOpen: false,
      openCreateModal,
      closeCreateModal: vi.fn(),
      handleCreateChatroom: vi.fn(),
      isCreating: false,
    })

    render(
      <MemoryRouter>
        <SideBar />
      </MemoryRouter>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Create Chatroom' }))

    expect(screen.getByText('No chatrooms available.')).toBeTruthy()
    expect(openCreateModal).toHaveBeenCalledTimes(1)
  })

  it('renders sorted chatroom list by activity descending', () => {
    useChatroomsSpy.mockReturnValue({
      data: [
        {
          id: 2,
          name: 'Older',
          basePrompt: 'old',
          profileImageUrl: null,
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-02T00:00:00.000Z',
        },
        {
          id: 1,
          name: 'Newest',
          basePrompt: 'new',
          profileImageUrl: null,
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-03T00:00:00.000Z',
        },
      ],
      isLoading: false,
      isError: false,
    })
    render(
      <MemoryRouter>
        <SideBar />
      </MemoryRouter>,
    )

    const labels = screen.getAllByRole('heading', { level: 3 }).map((el) => el.textContent)
    expect(labels).toEqual(['Newest', 'Older'])
  })

  it('hides Logout when not logged in (no member access token)', () => {
    authStoreAccessToken.value = null
    render(
      <MemoryRouter>
        <SideBar />
      </MemoryRouter>,
    )

    expect(screen.queryByRole('button', { name: 'Logout' })).toBeNull()
  })

  it('clears auth/cache and navigates home on logout confirm', () => {
    render(
      <MemoryRouter>
        <SideBar />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Logout' }))
    fireEvent.click(screen.getAllByRole('button', { name: 'Logout' }).at(-1) as HTMLButtonElement)

    expect(clearAuthSpy).toHaveBeenCalledTimes(1)
    expect(clearGuestSessionSpy).toHaveBeenCalledTimes(1)
    expect(setSidebarOpenSpy).toHaveBeenCalledWith(false)
    expect(queryClientClearSpy).toHaveBeenCalledTimes(1)
    expect(navigateSpy).toHaveBeenCalledWith(ROUTES.HOME, { replace: true })
  })
})
