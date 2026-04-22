import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getMessages, sendMessage } from '../../../api/messages'
import { getMessagesQueryKey, messageKeys } from '../queryKeys'
import type { Message } from '../../../types/api'

export const useMessages = (chatroomId: number, limit?: number, offset?: number) => {
  return useQuery({
    queryKey: getMessagesQueryKey(chatroomId, { limit, offset }),
    queryFn: () => getMessages({ chatroomId, limit, offset }),
    enabled: !!chatroomId,
  })
}

export const useSendMessage = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: sendMessage,
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: messageKeys.list(variables.chatroomId) })
      const optimisticId = -Date.now()
      const optimisticMessage: Message = {
        id: optimisticId,
        sender: 'user',
        content: variables.request.content,
        createdAt: new Date().toISOString(),
      }

      const previousEntries = queryClient.getQueriesData<Message[]>({
        queryKey: messageKeys.list(variables.chatroomId),
      })

      for (const [queryKey] of previousEntries) {
        queryClient.setQueryData<Message[]>(queryKey, (oldMessages) => {
          if (!oldMessages) return [optimisticMessage]
          return [...oldMessages, optimisticMessage]
        })
      }

      return {
        previousEntries,
        optimisticId,
      }
    },
    onError: (_, variables, context) => {
      if (!context) return
      for (const [queryKey, messages] of context.previousEntries) {
        queryClient.setQueryData(queryKey, messages)
      }
      queryClient.invalidateQueries({ queryKey: messageKeys.list(variables.chatroomId) })
    },
    onSuccess: (_, variables, context) => {
      if (context) {
        const queryEntries = queryClient.getQueriesData<Message[]>({
          queryKey: messageKeys.list(variables.chatroomId),
        })

        for (const [queryKey] of queryEntries) {
          queryClient.setQueryData<Message[]>(queryKey, (oldMessages) => {
            if (!oldMessages) return oldMessages
            return oldMessages.filter((message) => message.id !== context.optimisticId)
          })
        }
      }
      queryClient.invalidateQueries({ queryKey: messageKeys.list(variables.chatroomId) })
    },
    onSettled: (_, __, variables) => {
      queryClient.invalidateQueries({ queryKey: messageKeys.list(variables.chatroomId) })
    },
  })
}
