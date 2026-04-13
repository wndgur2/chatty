import { Message } from '@prisma/client';

export function serializeMessage(message: Message) {
  return {
    ...message,
    id: message.id.toString(),
    chatroomId: message.chatroomId.toString(),
  };
}
