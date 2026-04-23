import { QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { createTestQueryClient } from '../../../test/utils/createTestQueryClient'
import { getMessagesQueryKey, messageKeys } from '../queryKeys'
import { useMessages, useSendMessage } from './useMessages'

const getMessagesSpy = vi.hoisted(() => vi.fn())
const sendMessageSpy = vi.hoisted(() => vi.fn())

vi.mock('../../../api/messages', () => ({
  getMessages: getMessagesSpy,
  sendMessage: sendMessageSpy,
}))

function wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={createTestQueryClient()}>{children}</QueryClientProvider>
}

describe('useMessages', () => {
  it('fetches messages with query params', async () => {
    getMessagesSpy.mockResolvedValueOnce([{ id: 1, sender: 'user', content: 'Hi', createdAt: '2026-01-01' }])

    const { result } = renderHook(() => useMessages(9, 20, 0), { wrapper })

    await waitFor(() => {
      expect(result.current.data?.[0]?.id).toBe(1)
    })
    expect(getMessagesSpy).toHaveBeenCalledWith({ chatroomId: 9, limit: 20, offset: 0 })
  })
})

describe('useSendMessage', () => {
  it('invalidates message list query on success', async () => {
    sendMessageSpy.mockResolvedValueOnce({ messageId: 1, status: 'processing' })
    const client = createTestQueryClient()
    const invalidateSpy = vi.spyOn(client, 'invalidateQueries')
    const localWrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    )

    const { result } = renderHook(() => useSendMessage(), { wrapper: localWrapper })
    result.current.mutate({ chatroomId: 12, request: { content: 'hello' } })

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: messageKeys.list(12) })
    })
    expect(getMessagesQueryKey(12)[0]).toBe('messages')
  })

  it('does not mutate cache optimistically before request resolves', async () => {
    sendMessageSpy.mockImplementationOnce(
      () => new Promise(() => {}),
    )
    const client = createTestQueryClient()
    const localWrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    )
    const queryKey = getMessagesQueryKey(12)
    client.setQueryData(queryKey, [{ id: 1, sender: 'ai', content: 'ready', createdAt: '2026-01-01' }])

    const { result } = renderHook(() => useSendMessage(), { wrapper: localWrapper })

    act(() => {
      result.current.mutate({ chatroomId: 12, request: { content: 'hello optimistic' } })
    })

    await waitFor(() => {
      const cachedMessages = client.getQueryData<
        Array<{ id: number; sender: 'ai' | 'user'; content: string; createdAt: string }>
      >(queryKey)
      expect(cachedMessages).toEqual([
        { id: 1, sender: 'ai', content: 'ready', createdAt: '2026-01-01' },
      ])
    })
  })
})
