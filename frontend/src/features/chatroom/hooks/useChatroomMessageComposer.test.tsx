import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { FormEvent, RefObject } from 'react'
import { useChatroomMessageComposer } from './useChatroomMessageComposer'

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
    )
    expect(typingResult.current.isSendLocked).toBe(true)

    const { result: streamingResult } = renderHook(() =>
      useChatroomMessageComposer({
        chatroomId: 3,
        messages: [],
        isTyping: false,
        streamingContent: 'chunk',
      }),
    )
    expect(streamingResult.current.isSendLocked).toBe(true)
  })

  it('sends message payload and clears input', async () => {
    const input = document.createElement('input')
    const blurSpy = vi.spyOn(input, 'blur')
    const inputRef = { current: input } as unknown as RefObject<HTMLInputElement | null>
    const { result } = renderHook(() =>
      useChatroomMessageComposer({
        chatroomId: 12,
        messages: [],
        isTyping: false,
        streamingContent: '',
      }),
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
})
