import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createChatroom, getChatrooms } from '../../../api/chatrooms'
import { chatroomKeys } from '../queryKeys'

export const useChatrooms = () => {
  return useQuery({
    queryKey: chatroomKeys.list(),
    queryFn: getChatrooms,
  })
}

export const useCreateChatroom = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createChatroom,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chatroomKeys.list() })
    },
  })
}
