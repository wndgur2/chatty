import { useRef } from 'react'
import { MoreVertical, Copy, Split } from 'lucide-react'
import Button from '../../../shared/ui/Button'
import ConfirmModal from '../../../shared/ui/ConfirmModal'
import MessageList from './MessageList'
import Composer from './Composer'
import { useChatroom } from '../hooks/useChatroom'
import { useMessages } from '../hooks/useMessages'
import { useChatroomActions } from '../hooks/useChatroomActions'
import { useChatroomMessageComposer } from '../hooks/useChatroomMessageComposer'
import { useMessageAutoScroll } from '../hooks/useMessageAutoScroll'
import { useWebSocketStream } from '../hooks/useWebSocketStream'
import EditChatroomModal from './EditChatroomModal'

export interface ChatroomScreenProps {
  chatroomId: number
}

export default function ChatroomScreen({ chatroomId }: ChatroomScreenProps) {
  const { data: chatroom, isLoading: isChatroomLoading } = useChatroom(chatroomId)
  const { data: messages = [], isLoading: isMessagesLoading } = useMessages(chatroomId)
  const { isTyping, streamingContent } = useWebSocketStream(chatroomId)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const {
    inputValue,
    setInputValue,
    displayMessages,
    isSendLocked,
    isLoadingIndicatorVisible,
    sendMessageMutation,
    handleSendMessage,
  } = useChatroomMessageComposer({
    chatroomId,
    messages,
    isTyping,
    streamingContent,
  })

  const {
    isEditModalOpen,
    setIsEditModalOpen,
    isBranchConfirmOpen,
    setIsBranchConfirmOpen,
    isCloneConfirmOpen,
    setIsCloneConfirmOpen,
    isDeleteConfirmOpen,
    setIsDeleteConfirmOpen,
    isNavigating,
    updateChatroomMutation,
    deleteChatroomMutation,
    branchChatroomMutation,
    cloneChatroomMutation,
    handleEditChatroom,
    handleBranch,
    handleClone,
    handleDeleteRequest,
    handleConfirmDelete,
  } = useChatroomActions(chatroomId)

  const { messagesScrollRef, messagesEndRef, handleComposerFocus } = useMessageAutoScroll({
    displayMessagesCount: displayMessages.length,
    isSending: sendMessageMutation.isPending,
    isTyping,
  })

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
          messages={displayMessages}
          isMessagesLoading={isMessagesLoading}
          isLoadingIndicatorVisible={isLoadingIndicatorVisible}
          streamingContent={streamingContent}
        />
        <div className="max-w-4xl mx-auto">
          <div ref={messagesEndRef} className="h-4" />
        </div>
      </div>

      <div
        className="px-3 sm:px-4 pt-3 pb-2 bg-white border-t shrink-0 z-10"
        style={{
          borderColor: 'var(--border-color)',
          paddingBottom: 'calc(0.5rem + env(safe-area-inset-bottom, 0px))',
        }}
      >
        <Composer
          inputRef={inputRef}
          inputValue={inputValue}
          isSendLocked={isSendLocked}
          onInputChange={setInputValue}
          onInputFocus={handleComposerFocus}
          onSubmit={(event) => handleSendMessage(event, inputRef)}
        />
        <div className="text-center mt-1.5 mb-0.5 px-4">
          <span className="text-[11px] text-gray-400 leading-snug">
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
