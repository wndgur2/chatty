export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  CHATROOM: (id: string) => `/chat/${id}`,
} as const
