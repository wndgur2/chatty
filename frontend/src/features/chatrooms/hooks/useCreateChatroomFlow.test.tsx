import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ROUTES } from '../../../routes/paths'
import { useCreateChatroomFlow } from './useCreateChatroomFlow'

const navigateSpy = vi.hoisted(() => vi.fn())
const mutateSpy = vi.hoisted(() => vi.fn())
let isPending = false

vi.mock('react-router', async () => {
  const actual = await vi.importActual<typeof import('react-router')>('react-router')
  return {
    ...actual,
    useNavigate: () => navigateSpy,
  }
})

vi.mock('./useChatrooms', () => ({
  useCreateChatroom: () => ({
    mutate: mutateSpy,
    get isPending() {
      return isPending
    },
  }),
}))

describe('useCreateChatroomFlow', () => {
  beforeEach(() => {
    isPending = false
    navigateSpy.mockReset()
    mutateSpy.mockReset()
  })

  it('opens and closes create modal state', () => {
    const { result } = renderHook(() => useCreateChatroomFlow())

    expect(result.current.isCreateModalOpen).toBe(false)

    act(() => {
      result.current.openCreateModal()
    })
    expect(result.current.isCreateModalOpen).toBe(true)

    act(() => {
      result.current.closeCreateModal()
    })
    expect(result.current.isCreateModalOpen).toBe(false)
  })

  it('triggers create mutation and navigates on success', () => {
    const { result } = renderHook(() => useCreateChatroomFlow())
    const payload = { name: 'Room', basePrompt: 'You are assistant' }

    act(() => {
      result.current.handleCreateChatroom(payload)
    })

    expect(mutateSpy).toHaveBeenCalledWith(
      payload,
      expect.objectContaining({
        onSuccess: expect.any(Function),
      }),
    )

    const options = mutateSpy.mock.calls[0][1] as { onSuccess: (room: { id: number }) => void }

    act(() => {
      options.onSuccess({ id: 42 })
    })

    expect(result.current.isCreateModalOpen).toBe(false)
    expect(navigateSpy).toHaveBeenCalledWith(ROUTES.CHATROOM('42'))
  })

  it('maps mutation pending state into isCreating', () => {
    isPending = true
    const { result } = renderHook(() => useCreateChatroomFlow())
    expect(result.current.isCreating).toBe(true)
  })
})
