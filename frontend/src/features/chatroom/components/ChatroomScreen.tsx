import { useState, useRef, useEffect, useTransition } from 'react'
import { useNavigate } from 'react-router'
import { MoreVertical, Copy, Split } from 'lucide-react'
import { ROUTES } from '../../../routes/paths'
import Button from '../../../shared/ui/Button'
import type { UpdateChatroomRequest } from '../../../types/api'
import ConfirmModal from '../../../shared/ui/ConfirmModal'
import MessageList from './MessageList'
import Composer from './Composer'

import {
  useChatroom,
  useUpdateChatroom,
  useDeleteChatroom,
  useBranchChatroom,
  useCloneChatroom,
} from '../hooks/useChatroom'

import { useMessages, useSendMessage } from '../hooks/useMessages'

import { useWebSocketStream } from '../hooks/useWebSocketStream'
import EditChatroomModal from './EditChatroomModal'

export interface ChatroomScreenProps {
  chatroomId: number
}

export default function ChatroomScreen({ chatroomId }: ChatroomScreenProps) {
  const navigate = useNavigate()

  const { data: chatroom, isLoading: isChatroomLoading } = useChatroom(chatroomId)
  const { data: messages = [], isLoading: isMessagesLoading } = useMessages(chatroomId)
  const { isTyping, streamingContent } = useWebSocketStream(chatroomId)

  const sendMessageMutation = useSendMessage()
  const updateChatroomMutation = useUpdateChatroom()
  const deleteChatroomMutation = useDeleteChatroom()
  const branchChatroomMutation = useBranchChatroom()
  const cloneChatroomMutation = useCloneChatroom()

  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [isWaitingForResponse, setIsWaitingForResponse] = useState(false)
  const messagesScrollRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const [isBranchConfirmOpen, setIsBranchConfirmOpen] = useState(false)
  const [isCloneConfirmOpen, setIsCloneConfirmOpen] = useState(false)
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)
  const [isNavigating, startNavigationTransition] = useTransition()

  const isStreaming = !!streamingContent
  const isSendLocked =
    sendMessageMutation.isPending || isWaitingForResponse || isTyping || isStreaming

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior })
  }

  const isNearBottom = () => {
    const container = messagesScrollRef.current
    if (!container) return true

    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight
    return distanceFromBottom < 120
  }

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>
    if (isStreaming) {
      timeoutId = setTimeout(() => setIsWaitingForResponse(false), 0)
    } else if (isWaitingForResponse && messages.length > 0) {
      const lastMsg = messages[messages.length - 1]
      if (lastMsg?.sender === 'ai') {
        timeoutId = setTimeout(() => setIsWaitingForResponse(false), 0)
      }
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [messages, isStreaming, isWaitingForResponse])

  useEffect(() => {
    scrollToBottom('smooth')
  }, [messages, sendMessageMutation.isPending, isTyping, isWaitingForResponse])

  const handleComposerFocus = () => {
    if (!isNearBottom()) return
    scrollToBottom('auto')
    setTimeout(() => scrollToBottom('smooth'), 300)
  }

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputValue.trim() || isSendLocked) return

    const content = inputValue.trim()
    setInputValue('')
    inputRef.current?.blur()
    setIsWaitingForResponse(true)

    // In a real app we might rely entirely on websockets returning the message,
    // but here we wait for the HTTP fallback or rely on invalidateQueries
    sendMessageMutation.mutate({
      chatroomId,
      request: { content },
    })
  }

  const handleEditChatroom = async (roomId: number, data: UpdateChatroomRequest) => {
    await updateChatroomMutation.mutateAsync({ id: roomId, data })
    setIsEditModalOpen(false)
  }

  const handleBranch = () => {
    branchChatroomMutation.mutate(chatroomId, {
      onSuccess: (newRoom) => {
        startNavigationTransition(() => {
          setIsBranchConfirmOpen(false)
          navigate(ROUTES.CHATROOM(newRoom.id.toString()))
        })
      },
    })
  }

  const handleClone = () => {
    cloneChatroomMutation.mutate(chatroomId, {
      onSuccess: (newRoom) => {
        startNavigationTransition(() => {
          setIsCloneConfirmOpen(false)
          navigate(ROUTES.CHATROOM(newRoom.id.toString()))
        })
      },
    })
  }

  const handleDeleteRequest = () => {
    setIsEditModalOpen(false)
    setIsDeleteConfirmOpen(true)
  }

  const handleConfirmDelete = () => {
    deleteChatroomMutation.mutate(chatroomId, {
      onSuccess: () => {
        startNavigationTransition(() => {
          setIsDeleteConfirmOpen(false)
          navigate(ROUTES.HOME)
        })
      },
    })
  }

  if (isChatroomLoading) {
    return <div className="flex-1 flex items-center justify-center">Loading...</div>
  }

  if (!chatroom) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500">
        Chatroom not found.
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden relative">
      <header
        className="h-14 px-6 flex items-center justify-between border-b bg-white shrink-0 z-10"
        style={{ borderColor: 'var(--border-color)' }}
      >
        <div className="flex flex-col">
          <h2 className="font-bold text-gray-900 leading-tight">{chatroom.name}</h2>
          <p className="text-xs text-gray-500">#{chatroom.id}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-gray-500"
            onClick={() => setIsBranchConfirmOpen(true)}
          >
            <Split className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-gray-500"
            onClick={() => setIsCloneConfirmOpen(true)}
          >
            <Copy className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-gray-500"
            onClick={() => setIsEditModalOpen(true)}
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <div ref={messagesScrollRef} className="flex-1 min-h-0 overflow-y-auto px-4 py-6 sm:px-6">
        <MessageList
          chatroom={chatroom}
          messages={messages}
          isMessagesLoading={isMessagesLoading}
          isLoadingIndicatorVisible={
            (sendMessageMutation.isPending || isWaitingForResponse || isTyping) && !isStreaming
          }
          streamingContent={streamingContent}
        />
        <div className="max-w-4xl mx-auto">
          <div ref={messagesEndRef} className="h-4" />
        </div>
      </div>

      <div
        className="p-4 bg-white border-t shrink-0 z-10"
        style={{
          borderColor: 'var(--border-color)',
          paddingBottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))',
        }}
      >
        <Composer
          inputRef={inputRef}
          inputValue={inputValue}
          isSendLocked={isSendLocked}
          onInputChange={setInputValue}
          onInputFocus={handleComposerFocus}
          onSubmit={handleSendMessage}
        />
        <div className="text-center mt-2">
          <span className="text-[10px] text-gray-400">
            Chatty can make mistakes. Consider verifying important information.
          </span>
        </div>
      </div>

      <EditChatroomModal
        key={`${chatroom.id}-${isEditModalOpen ? 'open' : 'closed'}`}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSubmit={handleEditChatroom}
        onDelete={handleDeleteRequest}
        chatroom={chatroom}
        isLoading={updateChatroomMutation.isPending}
      />

      <ConfirmModal
        isOpen={isBranchConfirmOpen}
        onClose={() => setIsBranchConfirmOpen(false)}
        onConfirm={handleBranch}
        title="Branch Chatroom"
        message="This will copy both configuration and chat history."
        confirmText={branchChatroomMutation.isPending || isNavigating ? 'Branching...' : 'Branch'}
        isLoading={branchChatroomMutation.isPending || isNavigating}
      />

      <ConfirmModal
        isOpen={isCloneConfirmOpen}
        onClose={() => setIsCloneConfirmOpen(false)}
        onConfirm={handleClone}
        title="Clone Chatroom"
        message="This will clone only the configuration (prompt, profile image)."
        confirmText={cloneChatroomMutation.isPending || isNavigating ? 'Cloning...' : 'Clone'}
        isLoading={cloneChatroomMutation.isPending || isNavigating}
      />

      <ConfirmModal
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Chatroom"
        message="Are you sure you want to delete this chatroom? This action cannot be undone."
        confirmText={deleteChatroomMutation.isPending || isNavigating ? 'Deleting...' : 'Delete'}
        variant="danger"
        isLoading={deleteChatroomMutation.isPending || isNavigating}
      />
    </div>
  )
}
