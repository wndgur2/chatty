import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import MessageList from './MessageList'

const chatroom = {
  id: 1,
  name: 'AI Room',
  basePrompt: null,
  profileImageUrl: null,
  createdAt: '2026-01-01T00:00:00.000Z',
}

describe('MessageList', () => {
  it('renders loading state', () => {
    render(
      <MessageList
        chatroom={chatroom}
        messages={[]}
        isMessagesLoading
        isLoadingIndicatorVisible={false}
        streamingContent=""
      />,
    )

    expect(screen.getByText('Loading messages...')).toBeTruthy()
  })

  it('renders messages and streaming content', () => {
    render(
      <MessageList
        chatroom={chatroom}
        messages={[{ id: 7, sender: 'user', content: 'hello', createdAt: '2026-01-01T00:00:00.000Z' }]}
        isMessagesLoading={false}
        isLoadingIndicatorVisible={false}
        streamingContent="partial ai response"
      />,
    )

    expect(screen.getByText('hello')).toBeTruthy()
    expect(screen.getByText('partial ai response')).toBeTruthy()
  })
})
