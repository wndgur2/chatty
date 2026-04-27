import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { FormEvent, ReactNode, RefObject } from 'react'
import { useChatroomMessageComposer } from './useChatroomMessageComposer'
import { QueryClientProvider } from '@tanstack/react-query'
import { createTestQueryClient } from '../../../test/utils/createTestQueryClient'

const mutateAsyncSpy = vi.hoisted(() => vi.fn())
let isPending = false

vi.mock('./useMessages', () => ({
  useSendMessage: () => ({
    mutateAsync: mutateAsyncSpy,
    get isPending() {
      return isPending
    },
  }),
}))

function wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={createTestQueryClient()}>{children}</QueryClientProvider>
}

describe('useChatroomMessageComposer', () => {
  beforeEach(() => {
    isPending = false
    mutateAsyncSpy.mockReset()
    mutateAsyncSpy.mockResolvedValue({ messageId: 1, status: 'processing' })
  })

  it('locks sending when typing or streaming is active', () => {
    const { result: typingResult } = renderHook(() =>
      useChatroomMessageComposer({
        chatroomId: 3,
        messages: [],
        isTyping: true,
        streamingContent: '',
      }),
      { wrapper },
    )
    expect(typingResult.current.isSendLocked).toBe(true)

    const { result: streamingResult } = renderHook(() =>
      useChatroomMessageComposer({
        chatroomId: 3,
        messages: [],
        isTyping: false,
        streamingContent: 'chunk',
      }),
      { wrapper },
    )
    expect(streamingResult.current.isSendLocked).toBe(true)
  })

  it('sends message payload and clears input', async () => {
    const textarea = document.createElement('textarea')
    const blurSpy = vi.spyOn(textarea, 'blur')
    const inputRef = { current: textarea } as unknown as RefObject<HTMLTextAreaElement | null>
    const { result } = renderHook(() =>
      useChatroomMessageComposer({
        chatroomId: 12,
        messages: [],
        isTyping: false,
        streamingContent: '',
      }),
      { wrapper },
    )

    act(() => {
      result.current.setInputValue('hello world')
    })

    await act(async () => {
      const submitEvent = { preventDefault: vi.fn() } as unknown as FormEvent
      result.current.handleSendMessage(submitEvent, inputRef)
      await Promise.resolve()
    })

    expect(mutateAsyncSpy).toHaveBeenCalledWith({
      chatroomId: 12,
      request: { content: 'hello world' },
    })
    expect(result.current.inputValue).toBe('')
    expect(blurSpy).toHaveBeenCalled()
  })

  it('shows optimistic user message immediately while request is pending', async () => {
    mutateAsyncSpy.mockImplementationOnce(() => new Promise(() => {}))
    const textarea = document.createElement('textarea')
    const inputRef = { current: textarea } as unknown as RefObject<HTMLTextAreaElement | null>
    const { result } = renderHook(
      () =>
        useChatroomMessageComposer({
          chatroomId: 12,
          messages: [{ id: 1, sender: 'ai', content: 'ready', createdAt: '2026-01-01' }],
          isTyping: false,
          streamingContent: '',
        }),
      { wrapper },
    )

    act(() => {
      result.current.setInputValue('hello optimistic')
    })

    await act(async () => {
      const submitEvent = { preventDefault: vi.fn() } as unknown as FormEvent
      result.current.handleSendMessage(submitEvent, inputRef)
      await Promise.resolve()
    })

    expect(result.current.displayMessages).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          sender: 'user',
          content: 'hello optimistic',
        }),
      ]),
    )
    expect(mutateAsyncSpy).toHaveBeenCalledWith({
      chatroomId: 12,
      request: { content: 'hello optimistic' },
    })
  })
})
