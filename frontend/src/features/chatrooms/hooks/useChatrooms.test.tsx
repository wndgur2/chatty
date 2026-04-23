import { QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createTestQueryClient } from '../../../test/utils/createTestQueryClient'
import { chatroomKeys } from '../queryKeys'
import { useChatrooms, useCreateChatroom } from './useChatrooms'

const getChatroomsSpy = vi.hoisted(() => vi.fn())
const createChatroomSpy = vi.hoisted(() => vi.fn())

vi.mock('../../../api/chatrooms', () => ({
  getChatrooms: getChatroomsSpy,
  createChatroom: createChatroomSpy,
}))

describe('useChatrooms', () => {
  beforeEach(() => {
    getChatroomsSpy.mockReset()
    createChatroomSpy.mockReset()
  })

  const makeWrapper = () => {
    const client = createTestQueryClient()
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    )
    return { client, wrapper }
  }

  it('wires list query key and fetch function', async () => {
    getChatroomsSpy.mockResolvedValueOnce([{ id: 1, name: 'Room A' }])
    const { wrapper } = makeWrapper()

    const { result } = renderHook(() => useChatrooms(), { wrapper })

    await waitFor(() => {
      expect(result.current.data?.[0]?.id).toBe(1)
    })
    expect(getChatroomsSpy).toHaveBeenCalledTimes(1)
  })

  it('optimistically adds and replaces chatroom on success', async () => {
    createChatroomSpy.mockResolvedValueOnce({
      id: 99,
      name: 'Created',
      basePrompt: 'Prompt',
      profileImageUrl: null,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    })

    const { client, wrapper } = makeWrapper()
    const invalidateSpy = vi.spyOn(client, 'invalidateQueries')
    const listKey = chatroomKeys.list()
    client.setQueryData(listKey, [
      {
        id: 1,
        name: 'Existing',
        basePrompt: 'Keep',
        profileImageUrl: null,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    ])

    const { result } = renderHook(() => useCreateChatroom(), { wrapper })

    await act(async () => {
      await result.current.mutateAsync({ name: 'Created', basePrompt: 'Prompt' })
    })

    await waitFor(() => {
      const chatrooms = client.getQueryData<Array<{ id: number; name: string }>>(listKey) ?? []
      expect(chatrooms).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: 1, name: 'Existing' }),
          expect.objectContaining({ id: 99, name: 'Created' }),
        ]),
      )
    })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: listKey })
  })

  it('rolls back optimistic chatroom when mutation fails', async () => {
    createChatroomSpy.mockRejectedValueOnce(new Error('failed'))
    const { client, wrapper } = makeWrapper()
    const listKey = chatroomKeys.list()
    const seed = [
      {
        id: 7,
        name: 'Baseline',
        basePrompt: 'stable',
        profileImageUrl: null,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    ]
    client.setQueryData(listKey, seed)

    const { result } = renderHook(() => useCreateChatroom(), { wrapper })

    await expect(
      result.current.mutateAsync({ name: 'Will Fail', basePrompt: 'rollback' }),
    ).rejects.toThrow('failed')

    await waitFor(() => {
      expect(client.getQueryData(listKey)).toEqual(seed)
    })
  })
})
