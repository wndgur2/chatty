import { describe, expect, it, vi } from 'vitest'
import { login } from './auth'

const postSpy = vi.hoisted(() => vi.fn())

vi.mock('./client', () => ({
  apiClient: {
    post: postSpy,
  },
}))

describe('auth api contract', () => {
  it('posts login payload to auth endpoint', async () => {
    postSpy.mockResolvedValueOnce({ accessToken: 'token', user: { id: '1', username: 'jun' } })

    await login({ username: 'jun' })

    expect(postSpy).toHaveBeenCalledWith('/auth/login', { username: 'jun' })
  })
})
