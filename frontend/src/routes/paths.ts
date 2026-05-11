export const ROUTES = {
  HOME: '/',
  CHATROOM: (id: string) => `/chat/${id}`,
} as const
