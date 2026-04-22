import { useActionState, useState } from 'react'
import Modal from '../../../shared/ui/Modal'
import Button from '../../../shared/ui/Button'
import ModalFooter from '../../../shared/ui/ModalFooter'
import ChatroomConfiguration from '../../chatrooms/components/ChatroomConfiguration'
import type { UpdateChatroomRequest, Chatroom } from '../../../types/api'
import { useProfileImageInput } from '../../chatrooms/hooks/useProfileImageInput'

export interface EditChatroomModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (id: number, data: UpdateChatroomRequest) => Promise<void> | void
  onDelete?: (id: number) => void
  chatroom: Chatroom | null
  isLoading?: boolean
}

export default function EditChatroomModal({
  isOpen,
  onClose,
  onSubmit,
  onDelete,
  chatroom,
  isLoading,
}: EditChatroomModalProps) {
  const [name, setName] = useState(chatroom?.name || '')
  const [basePrompt, setBasePrompt] = useState(chatroom?.basePrompt || '')
  const { profileImage, setProfileImage, previewUrl, clearProfileImage, fileInputRef } =
    useProfileImageInput()
  const [submitState, submitAction, isSubmitting] = useActionState(
    async (_: { error: string }, formData: FormData) => {
      if (!chatroom || isLoading) {
        return { error: 'Chatroom is not available.' }
      }

      const nextName = String(formData.get('name') ?? '').trim()
      const nextBasePrompt = String(formData.get('basePrompt') ?? '').trim()
      if (!nextName || !nextBasePrompt) {
        return { error: 'Name and base prompt are required.' }
      }

      await Promise.resolve(
        onSubmit(chatroom.id, {
          name: nextName,
          basePrompt: nextBasePrompt,
          ...(profileImage && { profileImage }),
        }),
      )
      return { error: '' }
    },
    { error: '' },
  )

  const handleClearImage = () => {
    clearProfileImage()
  }

  const displayPreviewUrl =
    previewUrl || (chatroom?.profileImageUrl ? chatroom.profileImageUrl : null)

  const handleClose = () => {
    onClose()
  }
  const isBusy = Boolean(isLoading || isSubmitting)

  const hasChanges =
    basePrompt.trim() !== chatroom?.basePrompt ||
    !!profileImage ||
    name.trim() !== chatroom?.name?.trim()

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Edit Chatroom">
      <form action={submitAction} className="flex flex-col gap-4">
        <ChatroomConfiguration
          nameFieldId="edit-chatroom-name"
          name={name}
          onNameChange={(e) => setName(e.target.value)}
          promptFieldId="edit-chatroom-prompt"
          basePrompt={basePrompt}
          onBasePromptChange={(e) => setBasePrompt(e.target.value)}
          imageFieldId="edit-chatroom-image"
          previewUrl={displayPreviewUrl}
          fallbackChar={chatroom ? chatroom.name.charAt(0).toUpperCase() : 'C'}
          fileInputRef={fileInputRef}
          onProfileImageChange={(e) => setProfileImage(e.target.files?.[0] || undefined)}
          onClearProfileImage={handleClearImage}
        />
        {submitState.error ? <p className="text-sm text-red-600">{submitState.error}</p> : null}

        <ModalFooter
          className="w-full"
          leftSlot={
            onDelete &&
            chatroom && (
              <Button
                type="button"
                variant="danger"
                onClick={() => onDelete(chatroom.id)}
                disabled={isBusy}
              >
                Delete
              </Button>
            )
          }
        >
          <Button type="button" variant="secondary" onClick={handleClose} disabled={isBusy}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={isBusy || !hasChanges}>
            {isBusy ? 'Saving...' : 'Save Changes'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  )
}
