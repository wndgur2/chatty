import { ChatMessage } from './chat-message';

type MessageLike = {
  sender: 'user' | 'ai';
  content: string;
};

export function toChatHistory(messages: MessageLike[]): ChatMessage[] {
  return [...messages].reverse().map((message) => ({
    role: message.sender === 'user' ? 'user' : 'assistant',
    content: message.content,
  }));
}

/**
 * `messages` must be newest-first (e.g. Prisma `orderBy: { createdAt: 'desc' }`).
 * Counts consecutive `ai` from the newest message; the first such AI after a `user` is treated as
 * the non-proactive reply, so proactive count is max(0, tailAiCount - 1).
 */
export function proactiveAiCountInRowFromNewestFirst(
  messages: { sender: 'user' | 'ai' }[],
): number {
  let tailAiCount = 0;
  for (const m of messages) {
    if (m.sender === 'ai') {
      tailAiCount += 1;
    } else {
      break;
    }
  }
  return Math.max(0, tailAiCount - 1);
}
