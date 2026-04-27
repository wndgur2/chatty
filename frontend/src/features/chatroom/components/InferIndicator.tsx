import { useState } from 'react'
import type { Chatroom, Message } from '../../../types/api'
import ChatBubble from './ChatBubble'
import { STREAMING_MESSAGE_ID } from '../hooks/useWebSocketStream'

interface InferIndicatorProps {
  chatroom: Chatroom
  content?: string
}

export default function InferIndicator({ chatroom, content = '' }: InferIndicatorProps) {
  const [createdAt] = useState(() => new Date().toISOString())
  const message: Message = {
    id: STREAMING_MESSAGE_ID,
    sender: 'ai',
    content,
    createdAt,
  }

  return (
    <ChatBubble chatroom={chatroom} message={message} />
  )
}
