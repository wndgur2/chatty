import { describe, expect, it, vi } from 'vitest'
import { getMessages, sendMessage } from './messages'

const getSpy = vi.hoisted(() => vi.fn())
const postSpy = vi.hoisted(() => vi.fn())

vi.mock('./client', () => ({
  apiClient: {
    get: getSpy,
    post: postSpy,
  },
}))

describe('messages api contract', () => {
  it('requests message list with pagination params', async () => {
    getSpy.mockResolvedValueOnce([])

    await getMessages({ chatroomId: 12, limit: 30, offset: 60 })

    expect(getSpy).toHaveBeenCalledWith('/chatrooms/12/messages', {
      params: { limit: 30, offset: 60 },
    })
  })

  it('posts a new message to chatroom endpoint', async () => {
    postSpy.mockResolvedValueOnce({ messageId: 1, status: 'processing' })

    await sendMessage({ chatroomId: 12, request: { content: 'Hello' } })

    expect(postSpy).toHaveBeenCalledWith('/chatrooms/12/messages', { content: 'Hello' })
  })
})
