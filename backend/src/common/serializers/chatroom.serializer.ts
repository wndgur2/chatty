import { Chatroom } from '@prisma/client';

export function serializeChatroom(chatroom: Chatroom) {
  return {
    ...chatroom,
    id: chatroom.id.toString(),
    userId: chatroom.userId !== null ? chatroom.userId.toString() : null,
    guestSessionId: chatroom.guestSessionId,
  };
}
