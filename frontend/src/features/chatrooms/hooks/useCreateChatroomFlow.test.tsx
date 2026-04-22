import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ROUTES } from '../../../routes/paths'
import { useCreateChatroomFlow } from './useCreateChatroomFlow'

const navigateSpy = vi.hoisted(() => vi.fn())
const mutateAsyncSpy = vi.hoisted(() => vi.fn())
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
    mutateAsync: mutateAsyncSpy,
    get isPending() {
      return isPending
    },
  }),
}))

describe('useCreateChatroomFlow', () => {
  beforeEach(() => {
    isPending = false
    navigateSpy.mockReset()
    mutateAsyncSpy.mockReset()
    mutateAsyncSpy.mockResolvedValue({ id: 42 })
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

  it('triggers create mutation and navigates on success', async () => {
    const { result } = renderHook(() => useCreateChatroomFlow())
    const payload = { name: 'Room', basePrompt: 'You are assistant' }

    await act(async () => {
      await result.current.handleCreateChatroom(payload)
    })

    expect(mutateAsyncSpy).toHaveBeenCalledWith(payload)
    expect(result.current.isCreateModalOpen).toBe(false)
    expect(navigateSpy).toHaveBeenCalledWith(ROUTES.CHATROOM('42'))
  })

  it('maps mutation pending state into isCreating', () => {
    isPending = true
    const { result } = renderHook(() => useCreateChatroomFlow())
    expect(result.current.isCreating).toBe(true)
  })
})
