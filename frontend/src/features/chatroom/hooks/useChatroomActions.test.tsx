import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ROUTES } from '../../../routes/paths'
import { useChatroomActions } from './useChatroomActions'

const navigateSpy = vi.hoisted(() => vi.fn())
const updateMutateAsyncSpy = vi.hoisted(() => vi.fn())
const deleteMutateSpy = vi.hoisted(() => vi.fn())
const branchMutateSpy = vi.hoisted(() => vi.fn())
const cloneMutateSpy = vi.hoisted(() => vi.fn())

vi.mock('react-router', async () => {
  const actual = await vi.importActual<typeof import('react-router')>('react-router')
  return {
    ...actual,
    useNavigate: () => navigateSpy,
  }
})

vi.mock('./useChatroom', () => ({
  useUpdateChatroom: () => ({ mutateAsync: updateMutateAsyncSpy, isPending: false }),
  useDeleteChatroom: () => ({ mutate: deleteMutateSpy, isPending: false }),
  useBranchChatroom: () => ({ mutate: branchMutateSpy, isPending: false }),
  useCloneChatroom: () => ({ mutate: cloneMutateSpy, isPending: false }),
}))

describe('useChatroomActions', () => {
  beforeEach(() => {
    navigateSpy.mockReset()
    updateMutateAsyncSpy.mockReset()
    deleteMutateSpy.mockReset()
    branchMutateSpy.mockReset()
    cloneMutateSpy.mockReset()
    updateMutateAsyncSpy.mockResolvedValue({})
  })

  it('opens and closes modal states', () => {
    const { result } = renderHook(() => useChatroomActions(10))

    expect(result.current.isEditModalOpen).toBe(false)
    act(() => {
      result.current.setIsEditModalOpen(true)
      result.current.setIsBranchConfirmOpen(true)
      result.current.setIsCloneConfirmOpen(true)
    })

    expect(result.current.isEditModalOpen).toBe(true)
    expect(result.current.isBranchConfirmOpen).toBe(true)
    expect(result.current.isCloneConfirmOpen).toBe(true)
  })

  it('navigates to branched room on mutation success', () => {
    branchMutateSpy.mockImplementation((_chatroomId: number, options: { onSuccess: (room: { id: number }) => void }) => {
      options.onSuccess({ id: 99 })
    })

    const { result } = renderHook(() => useChatroomActions(10))
    act(() => {
      result.current.setIsBranchConfirmOpen(true)
      result.current.handleBranch()
    })

    expect(branchMutateSpy).toHaveBeenCalled()
    expect(navigateSpy).toHaveBeenCalledWith(ROUTES.CHATROOM('99'))
  })
})
