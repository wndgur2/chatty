import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createChatroom, getChatrooms } from '../../../api/chatrooms'
import { chatroomKeys } from '../queryKeys'
import type { Chatroom } from '../../../types/api'

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
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: chatroomKeys.list() })
      const previousChatrooms = queryClient.getQueryData<Chatroom[]>(chatroomKeys.list()) ?? []
      const optimisticChatroom: Chatroom = {
        id: -Date.now(),
        name: variables.name,
        basePrompt: variables.basePrompt,
        profileImageUrl: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      queryClient.setQueryData<Chatroom[]>(chatroomKeys.list(), (oldChatrooms = []) => [
        ...oldChatrooms,
        optimisticChatroom,
      ])

      return {
        previousChatrooms,
        optimisticId: optimisticChatroom.id,
      }
    },
    onError: (_error, _variables, context) => {
      if (!context) return
      queryClient.setQueryData(chatroomKeys.list(), context.previousChatrooms)
    },
    onSuccess: (createdChatroom, _variables, context) => {
      if (context) {
        queryClient.setQueryData<Chatroom[]>(chatroomKeys.list(), (oldChatrooms = []) =>
          oldChatrooms.map((chatroom) =>
            chatroom.id === context.optimisticId ? createdChatroom : chatroom,
          ),
        )
      }
      queryClient.invalidateQueries({ queryKey: chatroomKeys.list() })
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: chatroomKeys.list() })
    },
  })
}
