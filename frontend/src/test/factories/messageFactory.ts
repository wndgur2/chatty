import type { Message } from '../../types/api'

export function messageFactory(overrides?: Partial<Message>): Message {
  return {
    id: 1,
    sender: 'user',
    content: 'fixture-message',
    createdAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}
