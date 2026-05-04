import { Navigate, useLocation } from 'react-router'
import Button from '../shared/ui/Button'
import GithubLink from '../shared/ui/GithubLink'
import CreateChatroomModal from '../features/chatrooms/components/CreateChatroomModal'
import { useCreateChatroomFlow } from '../features/chatrooms/hooks/useCreateChatroomFlow'
import { useChatrooms } from '../features/chatrooms/hooks/useChatrooms'
import { ROUTES } from '../routes/paths'
import { sortByChatroomActivityDesc } from '../shared/lib/chatroom'

function formatReleaseBuiltAt(value: string): string {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return value
  }

  return parsed.toISOString().replace('T', ' ').replace('.000Z', '')
}

export default function HomePage() {
  const releaseSha = import.meta.env.VITE_RELEASE_SHA?.slice(0, 7)
  const releaseBuiltAtValue = import.meta.env.VITE_RELEASE_BUILT_AT
  const formattedBuiltAt = releaseBuiltAtValue ? formatReleaseBuiltAt(releaseBuiltAtValue) : null
  const releaseLabel = releaseSha && formattedBuiltAt ? `${releaseSha} • ${formattedBuiltAt}` : null

  const location = useLocation()
  const fromLogin = (location.state as { fromLogin?: boolean } | null)?.fromLogin === true
  const { data: chatrooms = [], isLoading, isError } = useChatrooms()
  const sortedChatrooms = [...chatrooms].sort(sortByChatroomActivityDesc)

  const { isCreateModalOpen, openCreateModal, closeCreateModal, handleCreateChatroom, isCreating } =
    useCreateChatroomFlow()

  if (fromLogin && !isLoading && !isError && sortedChatrooms.length > 0) {
    return <Navigate to={ROUTES.CHATROOM(String(sortedChatrooms[0].id))} />
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center h-full">
      <h2 className="text-3xl font-bold text-gray-900 mb-5">Let's get talking.</h2>
      <p className="text-gray-500 max-w-lg mb-6">
        Chatty is AI chat that reads like a real thread—warm, quick, and natural, the way you text
        someone who gets you.
      </p>
      <Button variant="primary" size="lg" className="shadow-sm" onClick={openCreateModal}>
        Create New Buddy
      </Button>

      {releaseLabel ? (
        <span
          className="mt-16 text-[12px] text-gray-400 text-center max-w-full px-2 truncate"
          title={releaseLabel}
        >
          <span>{releaseLabel}</span>
        </span>
      ) : null}

      <div className="mt-1 text-gray-500 opacity-80">
        <GithubLink className="h-9" />
      </div>

      <CreateChatroomModal
        isOpen={isCreateModalOpen}
        onClose={closeCreateModal}
        onSubmit={handleCreateChatroom}
        isLoading={isCreating}
      />
    </div>
  )
}
