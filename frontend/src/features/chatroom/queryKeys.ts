export const messageKeys = {
  all: ['messages'] as const,
  list: (chatroomId: number) => [...messageKeys.all, chatroomId] as const,
}

export const getMessagesQueryKey = (
  chatroomId: number,
  params?: {
    limit?: number
    offset?: number
  },
) => [...messageKeys.list(chatroomId), { limit: params?.limit, offset: params?.offset }] as const
