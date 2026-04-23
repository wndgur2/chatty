import { useState, useTransition } from 'react'
import { useNavigate } from 'react-router'
import { ROUTES } from '../../../routes/paths'
import type { UpdateChatroomRequest } from '../../../types/api'
import {
  useBranchChatroom,
  useCloneChatroom,
  useDeleteChatroom,
  useUpdateChatroom,
} from './useChatroom'

export const useChatroomActions = (chatroomId: number) => {
  const navigate = useNavigate()
  const [isNavigating, startNavigationTransition] = useTransition()

  const updateChatroomMutation = useUpdateChatroom()
  const deleteChatroomMutation = useDeleteChatroom()
  const branchChatroomMutation = useBranchChatroom()
  const cloneChatroomMutation = useCloneChatroom()

  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isBranchConfirmOpen, setIsBranchConfirmOpen] = useState(false)
  const [isCloneConfirmOpen, setIsCloneConfirmOpen] = useState(false)
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)

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

  return {
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
  }
}
