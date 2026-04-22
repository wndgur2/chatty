import { QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { createTestQueryClient } from '../../../test/utils/createTestQueryClient'
import { chatroomKeys } from '../../chatrooms/queryKeys'
import { useBranchChatroom, useCloneChatroom, useDeleteChatroom, useUpdateChatroom } from './useChatroom'

const updateSpy = vi.hoisted(() => vi.fn())
const deleteSpy = vi.hoisted(() => vi.fn())
const cloneSpy = vi.hoisted(() => vi.fn())
const branchSpy = vi.hoisted(() => vi.fn())

vi.mock('../../../api/chatrooms', () => ({
  updateChatroom: updateSpy,
  deleteChatroom: deleteSpy,
  cloneChatroom: cloneSpy,
  branchChatroom: branchSpy,
  getChatroom: vi.fn(),
}))

function createWrapper(client = createTestQueryClient()) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>
  }
}

describe('chatroom mutation hooks', () => {
  it('invalidates list and detail after update', async () => {
    updateSpy.mockResolvedValueOnce({ id: 3 })
    const client = createTestQueryClient()
    const invalidateSpy = vi.spyOn(client, 'invalidateQueries')
    const { result } = renderHook(() => useUpdateChatroom(), { wrapper: createWrapper(client) })
    result.current.mutate({ id: 3, data: { name: 'new name' } })

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: chatroomKeys.list() })
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: chatroomKeys.detail(3) })
    })
  })

  it('invalidates list after delete/clone/branch success', async () => {
    deleteSpy.mockResolvedValueOnce(undefined)
    cloneSpy.mockResolvedValueOnce({ id: 10 })
    branchSpy.mockResolvedValueOnce({ id: 11 })
    const client = createTestQueryClient()
    const invalidateSpy = vi.spyOn(client, 'invalidateQueries')
    const wrapper = createWrapper(client)
    const deleteHook = renderHook(() => useDeleteChatroom(), { wrapper })
    const cloneHook = renderHook(() => useCloneChatroom(), { wrapper })
    const branchHook = renderHook(() => useBranchChatroom(), { wrapper })

    deleteHook.result.current.mutate(3)
    cloneHook.result.current.mutate(3)
    branchHook.result.current.mutate(3)

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: chatroomKeys.list() })
    })
  })

  it('optimistically removes deleted room and restores on failure', async () => {
    let rejectDelete: ((reason?: unknown) => void) | undefined
    deleteSpy.mockImplementationOnce(
      () =>
        new Promise((_resolve, reject) => {
          rejectDelete = reject
        }),
    )
    const client = createTestQueryClient()
    const wrapper = createWrapper(client)
    client.setQueryData(chatroomKeys.list(), [
      { id: 3, name: 'Room', basePrompt: 'prompt', profileImageUrl: null, createdAt: '2026-01-01' },
    ])

    const { result } = renderHook(() => useDeleteChatroom(), { wrapper })
    result.current.mutate(3)

    await waitFor(() => {
      const optimisticList = client.getQueryData<Array<{ id: number }>>(chatroomKeys.list())
      expect(optimisticList).toEqual([])
    })

    if (rejectDelete) {
      rejectDelete(new Error('failed delete'))
    }

    await waitFor(() => {
      const restoredList = client.getQueryData<Array<{ id: number; name: string }>>(chatroomKeys.list())
      expect(restoredList?.[0]?.id).toBe(3)
      expect(restoredList?.[0]?.name).toBe('Room')
    })
  })
})
