import { useState } from 'react'
import Modal from '../../../shared/ui/Modal'
import Button from '../../../shared/ui/Button'
import ModalFooter from '../../../shared/ui/ModalFooter'
import ChatroomConfiguration from '../../chatrooms/components/ChatroomConfiguration'
import type { UpdateChatroomRequest, Chatroom } from '../../../types/api'
import { useProfileImageInput } from '../../chatrooms/hooks/useProfileImageInput'

export interface EditChatroomModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (id: number, data: UpdateChatroomRequest) => void
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

  const handleClearImage = () => {
    clearProfileImage()
  }

  const displayPreviewUrl =
    previewUrl || (chatroom?.profileImageUrl ? chatroom.profileImageUrl : null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatroom || isLoading) return
    onSubmit(chatroom.id, {
      name: name.trim(),
      basePrompt: basePrompt.trim(),
      ...(profileImage && { profileImage }),
    })
  }

  const handleClose = () => {
    onClose()
  }

  const hasChanges =
    basePrompt.trim() !== chatroom?.basePrompt ||
    !!profileImage ||
    name.trim() !== chatroom?.name?.trim()

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Edit Chatroom">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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

        <ModalFooter
          className="w-full"
          leftSlot={
            onDelete &&
            chatroom && (
              <Button
                type="button"
                variant="danger"
                onClick={() => onDelete(chatroom.id)}
                disabled={isLoading}
              >
                Delete
              </Button>
            )
          }
        >
          <Button type="button" variant="secondary" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={isLoading || !hasChanges}>
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  )
}
