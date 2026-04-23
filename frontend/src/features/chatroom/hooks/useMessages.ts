import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getMessages, sendMessage } from '../../../api/messages'
import { getMessagesQueryKey, messageKeys } from '../queryKeys'

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
    onSettled: (_, __, variables) => {
      queryClient.invalidateQueries({ queryKey: messageKeys.list(variables.chatroomId) })
    },
  })
}
