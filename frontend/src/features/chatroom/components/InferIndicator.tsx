import type { Chatroom } from '../../../types/api'
import ChatBubble from './ChatBubble'

interface InferIndicatorProps {
  chatroom: Chatroom
}

export default function InferIndicator({ chatroom }: InferIndicatorProps) {
  return (
    <ChatBubble
      chatroom={chatroom}
      message={{ id: -1, sender: 'ai', content: '', createdAt: new Date().toISOString() }}
    />
  )
}

