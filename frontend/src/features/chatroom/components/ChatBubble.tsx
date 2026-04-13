import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import Avatar from '../../../shared/ui/Avatar'
import type { Chatroom, Message } from '../../../types/api'
import { formatTime } from '../../../shared/lib/date'
import { AiMarkdownContent } from './AiMarkdownContent'

interface ChatBubbleProps {
  message: Message
  chatroom: Chatroom
}

export default function ChatBubble({ message, chatroom }: ChatBubbleProps) {
  const isUser = message.sender === 'user'
  const timeString = formatTime(message.createdAt)

  return (
    <div
      className={twMerge(
        clsx('flex w-full min-w-0 gap-4 group', isUser ? 'flex-row-reverse' : 'flex-row'),
      )}
    >
      {!isUser && (
        <div className="shrink-0 pt-0.5">
          <Avatar
            fallback={chatroom.name}
            src={chatroom.profileImageUrl || undefined}
            className={
              isUser ? 'w-12 h-12 bg-gray-200 text-gray-700' : 'w-12 h-12 bg-brand-500 text-white'
            }
          />
        </div>
      )}
      <div
        className={twMerge(
          clsx('flex min-w-0 max-w-[85%] flex-col', isUser ? 'items-end' : 'items-start'),
        )}
      >
        <div className="flex items-baseline gap-2 mb-1 px-1">
          {isUser && <span className="text-[10px] text-gray-500">{timeString}</span>}
          <span className="text-sm font-semibold text-gray-900">{isUser ? 'You' : chatroom.name}</span>
          {!isUser && <span className="text-[10px] text-gray-500">{timeString}</span>}
        </div>

        {message.content ? (
          <div
            className={twMerge(
              clsx(
                'min-w-0 max-w-full px-4 py-2.5 rounded-2xl break-words shadow-sm',
                !isUser && 'w-full',
                isUser
                  ? 'whitespace-pre-wrap text-[15px] leading-relaxed bg-brand-500 text-white rounded-tr-sm'
                  : 'bg-white border border-gray-100 rounded-tl-sm',
              ),
            )}
          >
            {isUser ? (
              message.content
            ) : (
              <AiMarkdownContent content={message.content} />
            )}
          </div>
        ) : (
          <div className="flex bg-white border border-gray-100 px-4 py-3.5 rounded-2xl rounded-tl-sm shadow-sm gap-1 items-center h-10 w-[60px] justify-center">
            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
          </div>
        )}
      </div>
    </div>
  )
}

