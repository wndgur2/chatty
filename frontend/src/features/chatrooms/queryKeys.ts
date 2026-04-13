export const chatroomKeys = {
  all: ['chatrooms'] as const,
  list: () => [...chatroomKeys.all, 'list'] as const,
  detail: (id: number | string) => [...chatroomKeys.all, 'detail', Number(id)] as const,
}
