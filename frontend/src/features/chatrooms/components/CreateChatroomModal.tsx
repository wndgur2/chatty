import { useState } from 'react'
import Modal from '../../../shared/ui/Modal'
import Button from '../../../shared/ui/Button'
import ModalFooter from '../../../shared/ui/ModalFooter'
import ChatroomConfiguration from './ChatroomConfiguration'
import type { CreateChatroomRequest } from '../../../types/api'
import { useProfileImageInput } from '../hooks/useProfileImageInput'

export interface CreateChatroomModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: CreateChatroomRequest) => void
  isLoading?: boolean
}

export default function CreateChatroomModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
}: CreateChatroomModalProps) {
  const [name, setName] = useState('')
  const [basePrompt, setBasePrompt] = useState('')
  const { profileImage, setProfileImage, previewUrl, clearProfileImage, fileInputRef } =
    useProfileImageInput()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !basePrompt.trim() || isLoading) return
    onSubmit({
      name: name.trim(),
      basePrompt: basePrompt.trim(),
      ...(profileImage && { profileImage }),
    })
  }

  const handleClearImage = () => {
    clearProfileImage()
  }

  // Reset state when modal is closed
  const handleClose = () => {
    setName('')
    setBasePrompt('')
    handleClearImage()
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Create Chatroom">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <ChatroomConfiguration
          nameFieldId="chatroom-name"
          name={name}
          onNameChange={(e) => setName(e.target.value)}
          promptFieldId="chatroom-prompt"
          basePrompt={basePrompt}
          onBasePromptChange={(e) => setBasePrompt(e.target.value)}
          imageFieldId="chatroom-image"
          previewUrl={previewUrl}
          fallbackChar={name.trim() ? name.charAt(0).toUpperCase() : 'C'}
          fileInputRef={fileInputRef}
          onProfileImageChange={(e) => setProfileImage(e.target.files?.[0] || undefined)}
          onClearProfileImage={handleClearImage}
        />

        <ModalFooter>
          <Button type="button" variant="secondary" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={!name.trim() || !basePrompt.trim() || isLoading}
          >
            {isLoading ? 'Creating...' : 'Create'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  )
}
