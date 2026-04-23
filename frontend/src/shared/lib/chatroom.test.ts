import { describe, expect, it } from 'vitest'
import { getChatroomActivityAt, sortByChatroomActivityDesc } from './chatroom'

describe('chatroom utils', () => {
  it('prefers updatedAt over createdAt for activity date', () => {
    expect(
      getChatroomActivityAt({
        id: 1,
        name: 'A',
        basePrompt: null,
        profileImageUrl: null,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-02-01T00:00:00.000Z',
      }),
    ).toBe('2026-02-01T00:00:00.000Z')
  })

  it('sorts chatrooms by descending activity time', () => {
    const older = {
      id: 1,
      name: 'Older',
      basePrompt: null,
      profileImageUrl: null,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-02T00:00:00.000Z',
    }
    const newer = {
      id: 2,
      name: 'Newer',
      basePrompt: null,
      profileImageUrl: null,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-03T00:00:00.000Z',
    }

    expect(sortByChatroomActivityDesc(older, newer)).toBeGreaterThan(0)
    expect(sortByChatroomActivityDesc(newer, older)).toBeLessThan(0)
  })
})
