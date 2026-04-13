import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  branchChatroom,
  cloneChatroom,
  deleteChatroom,
  getChatroom,
  updateChatroom,
} from '../../../api/chatrooms'
import { chatroomKeys } from '../../chatrooms/queryKeys'

export const useChatroom = (id: number) => {
  return useQuery({
    queryKey: chatroomKeys.detail(id),
    queryFn: () => getChatroom(id),
    enabled: !!id,
  })
}

export const useUpdateChatroom = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updateChatroom,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: chatroomKeys.list() })
      queryClient.invalidateQueries({ queryKey: chatroomKeys.detail(variables.id) })
    },
  })
}

export const useDeleteChatroom = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteChatroom,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chatroomKeys.list() })
    },
  })
}

export const useCloneChatroom = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: cloneChatroom,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chatroomKeys.list() })
    },
  })
}

export const useBranchChatroom = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: branchChatroom,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chatroomKeys.list() })
    },
  })
}
