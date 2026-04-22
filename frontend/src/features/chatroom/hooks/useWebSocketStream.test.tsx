import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getMessagesQueryKey } from '../queryKeys'
import type { Message } from '../../../types/api'
import { useWebSocketStream } from './useWebSocketStream'

type SocketEventHandler = (payload?: unknown) => void

interface MockSocket {
  connected: boolean
  handlers: Record<string, SocketEventHandler>
  on: (event: string, handler: SocketEventHandler) => void
  off: ReturnType<typeof vi.fn>
  emit: ReturnType<typeof vi.fn>
  disconnect: ReturnType<typeof vi.fn>
}

const mockSocket: MockSocket = {
  connected: false,
  handlers: {},
  on(event, handler) {
    this.handlers[event] = handler
  },
  off: vi.fn(),
  emit: vi.fn(),
  disconnect: vi.fn(),
}

vi.mock('socket.io-client', () => ({
  io: vi.fn(() => mockSocket),
}))

function createWrapper(client: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>
  }
}

describe('useWebSocketStream', () => {
  beforeEach(() => {
    mockSocket.connected = false
    mockSocket.handlers = {}
    mockSocket.emit.mockClear()
    mockSocket.off.mockClear()
    mockSocket.disconnect.mockClear()
  })

  it('joins room on socket connect and appends stream chunks', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    })

    const { result } = renderHook(() => useWebSocketStream(7), {
      wrapper: createWrapper(queryClient),
    })

    await waitFor(() => {
      expect(mockSocket.handlers.connect).toBeTypeOf('function')
    })

    act(() => {
      mockSocket.handlers.connect()
    })

    expect(mockSocket.emit).toHaveBeenCalledWith('joinRoom', { chatroomId: 7 })

    act(() => {
      mockSocket.handlers.ai_message_chunk({ chatroomId: 7, chunk: 'Hello ' })
      mockSocket.handlers.ai_message_chunk({ chatroomId: 7, chunk: 'world' })
    })

    expect(result.current.streamingContent).toBe('Hello world')
    expect(result.current.isTyping).toBe(false)
  })

  it('stores completed ai message in query cache', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    })
    const chatroomId = 12
    const queryKey = getMessagesQueryKey(chatroomId)
    const previousMessages: Message[] = [
      { id: 1, sender: 'user', content: 'ping', createdAt: '2026-01-01T00:00:00.000Z' },
    ]
    queryClient.setQueryData(queryKey, previousMessages)

    const { result } = renderHook(() => useWebSocketStream(chatroomId), {
      wrapper: createWrapper(queryClient),
    })

    await waitFor(() => {
      expect(mockSocket.handlers.ai_message_complete).toBeTypeOf('function')
    })

    act(() => {
      mockSocket.handlers.ai_message_chunk({ chatroomId, chunk: 'partial' })
      mockSocket.handlers.ai_message_complete({
        chatroomId,
        content: 'final',
        messageId: 99,
      })
    })

    const nextMessages = queryClient.getQueryData<Message[]>(queryKey)
    expect(nextMessages).toHaveLength(2)
    expect(nextMessages?.[1]).toMatchObject({
      id: 99,
      sender: 'ai',
      content: 'final',
    })
    expect(result.current.streamingContent).toBe('')
  })
})
