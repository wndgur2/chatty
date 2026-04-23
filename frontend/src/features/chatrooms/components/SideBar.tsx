import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useQueryClient } from '@tanstack/react-query'
import ChatroomListItem from './ChatroomListItem'
import Button from '../../../shared/ui/Button'
import CreateChatroomModal from './CreateChatroomModal'
import ConfirmModal from '../../../shared/ui/ConfirmModal'
import { useChatrooms } from '../hooks/useChatrooms'
import { useCreateChatroomFlow } from '../hooks/useCreateChatroomFlow'
import { sortByChatroomActivityDesc } from '../../../shared/lib/chatroom'
import { clearAuth } from '../../../shared/lib/auth'
import { ROUTES } from '../../../routes/paths'
import { useUIStore } from '../../../shared/stores/uiStore'

export default function SideBar() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: chatrooms = [], isLoading, isError } = useChatrooms()
  const sortedChatrooms = [...chatrooms].sort(sortByChatroomActivityDesc)
  const { isCreateModalOpen, openCreateModal, closeCreateModal, handleCreateChatroom, isCreating } =
    useCreateChatroomFlow()
  const setSidebarOpen = useUIStore((state) => state.setSidebarOpen)
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false)

  const handleLogout = () => {
    clearAuth()
    setSidebarOpen(false)
    queryClient.clear()
    setIsLogoutConfirmOpen(false)
    navigate(ROUTES.LOGIN, { replace: true })
  }

  return (
    <aside
      className="w-full h-full flex flex-col md:border-r bg-white"
      style={{ borderColor: 'var(--border-color)' }}
    >
      <div
        className="p-4 font-bold text-lg border-b text-gray-800 flex justify-between items-center"
        style={{ borderColor: 'var(--border-color)' }}
      >
        <span>Messages</span>
        {isLoading && <span className="text-sm text-gray-500 font-normal">Loading...</span>}
      </div>
      <div className="flex-1 overflow-y-auto flex flex-col p-4 shrink-0" style={{ minHeight: 0 }}>
        {isError && <div className="text-center text-red-500 text-sm mb-4">Failed to load chatrooms.</div>}

        {sortedChatrooms.length > 0 ? (
          <>
            <div
              className="flex-1 overflow-y-auto flex flex-col gap-2 mb-4 shrink-0 border"
              style={{ minHeight: '0px', border: 'none' }}
            >
              <div className="flex-1 flex flex-col gap-2">
                {sortedChatrooms.map((room) => (
                  <ChatroomListItem key={room.id} {...room} />
                ))}
              </div>
            </div>
            <Button
              className="w-full mt-auto shrink-0"
              variant="primary"
              onClick={openCreateModal}
              disabled={isCreating}
            >
              Create Chatroom
            </Button>
          </>
        ) : (
          !isLoading &&
          !isError && (
            <>
              <Button
                className="w-full mb-6 shrink-0"
                variant="primary"
                onClick={openCreateModal}
                disabled={isCreating}
              >
                Create Chatroom
              </Button>
              <div className="text-center text-gray-500 text-sm">No chatrooms available.</div>
            </>
          )
        )}
      </div>

      <CreateChatroomModal
        isOpen={isCreateModalOpen}
        onClose={closeCreateModal}
        onSubmit={handleCreateChatroom}
        isLoading={isCreating}
      />

      <div
        className="p-4 border-t"
        style={{ borderColor: 'var(--border-color)' }}
      >
        <Button
          variant="danger"
          className="w-full"
          onClick={() => setIsLogoutConfirmOpen(true)}
        >
          Logout
        </Button>
      </div>

      <ConfirmModal
        isOpen={isLogoutConfirmOpen}
        onClose={() => setIsLogoutConfirmOpen(false)}
        onConfirm={handleLogout}
        title="Logout"
        message="Are you sure you want to logout?"
        confirmText="Logout"
        variant="danger"
      />
    </aside>
  )
}

