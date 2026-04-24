import { Navigate, useLocation } from 'react-router'
import Button from '../shared/ui/Button'
import CreateChatroomModal from '../features/chatrooms/components/CreateChatroomModal'
import { useCreateChatroomFlow } from '../features/chatrooms/hooks/useCreateChatroomFlow'
import { useChatrooms } from '../features/chatrooms/hooks/useChatrooms'
import { ROUTES } from '../routes/paths'
import { sortByChatroomActivityDesc } from '../shared/lib/chatroom'

export default function HomePage() {
  const location = useLocation()
  const fromLogin = (location.state as { fromLogin?: boolean } | null)?.fromLogin === true
  const { data: chatrooms = [], isLoading, isError } = useChatrooms()
  const sortedChatrooms = [...chatrooms].sort(sortByChatroomActivityDesc)

  const { isCreateModalOpen, openCreateModal, closeCreateModal, handleCreateChatroom, isCreating } =
    useCreateChatroomFlow()

  if (fromLogin && !isLoading && !isError && sortedChatrooms.length > 0) {
    return <Navigate to={ROUTES.CHATROOM(String(sortedChatrooms[0].id))} replace />
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center h-full">
      <div className="w-20 h-20 bg-brand-100 rounded-full flex items-center justify-center mb-6">
        <svg
          className="w-10 h-10 text-brand-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to Chatty</h2>
      <p className="text-gray-500 max-w-md mb-8">
        Select a chatroom from the sidebar to start messaging, or create a new one to begin a fresh
        conversation with your AI assistant.
      </p>
      <Button variant="primary" size="lg" className="shadow-sm" onClick={openCreateModal}>
        Create New Chatroom
      </Button>

      <CreateChatroomModal
        isOpen={isCreateModalOpen}
        onClose={closeCreateModal}
        onSubmit={handleCreateChatroom}
        isLoading={isCreating}
      />
    </div>
  )
}
