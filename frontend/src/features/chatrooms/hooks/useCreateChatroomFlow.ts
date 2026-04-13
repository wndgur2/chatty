import { useState } from 'react'
import { useNavigate } from 'react-router'
import { ROUTES } from '../../../routes/paths'
import type { CreateChatroomRequest } from '../../../types/api'
import { useCreateChatroom } from './useChatrooms'

export const useCreateChatroomFlow = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const navigate = useNavigate()
  const createChatroomMutation = useCreateChatroom()

  const closeCreateModal = () => setIsCreateModalOpen(false)
  const openCreateModal = () => setIsCreateModalOpen(true)

  const handleCreateChatroom = (data: CreateChatroomRequest) => {
    createChatroomMutation.mutate(data, {
      onSuccess: (newChatroom) => {
        closeCreateModal()
        navigate(ROUTES.CHATROOM(newChatroom.id.toString()))
      },
    })
  }

  return {
    isCreateModalOpen,
    openCreateModal,
    closeCreateModal,
    handleCreateChatroom,
    isCreating: createChatroomMutation.isPending,
  }
}
