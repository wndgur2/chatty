import { memo } from 'react'
import ChatBubble from './ChatBubble'
import InferIndicator from './InferIndicator'
import type { Chatroom, Message } from '../../../types/api'

interface MessageListProps {
  chatroom: Chatroom
  messages: Message[]
  isMessagesLoading: boolean
  isLoadingIndicatorVisible: boolean
  streamingContent: string
}

function MessageListComponent({
  chatroom,
  messages,
  isMessagesLoading,
  isLoadingIndicatorVisible,
  streamingContent,
}: MessageListProps) {
  const shouldShowInferIndicator = isLoadingIndicatorVisible || !!streamingContent

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto">
      <div className="text-center">
        <span className="text-xs font-medium text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
          {new Date().toLocaleDateString(undefined, { dateStyle: 'medium' })}
        </span>
      </div>

      {isMessagesLoading ? (
        <div className="text-center text-sm text-gray-400 py-4">Loading messages...</div>
      ) : (
        messages.map((msg) => <ChatBubble key={msg.id} message={msg} chatroom={chatroom} />)
      )}

      {shouldShowInferIndicator && (
        <InferIndicator chatroom={chatroom} content={streamingContent} />
      )}
    </div>
  )
}

const MessageList = memo(MessageListComponent)

export default MessageList
