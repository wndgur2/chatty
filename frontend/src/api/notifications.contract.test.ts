import { describe, expect, it, vi } from 'vitest'
import { registerDeviceToken, sendTestNotification } from './notifications'

const postSpy = vi.hoisted(() => vi.fn())

vi.mock('./client', () => ({
  apiClient: {
    post: postSpy,
  },
}))

describe('notifications api contract', () => {
  it('sends test notification request with chatroomId payload', async () => {
    postSpy.mockResolvedValueOnce({ status: 'success', message: 'ok' })

    await sendTestNotification({ chatroomId: '42' })

    expect(postSpy).toHaveBeenCalledWith('/notifications/test', { chatroomId: '42' })
  })

  it('registers device token with backend', async () => {
    postSpy.mockResolvedValueOnce({ status: 'success', message: 'ok' })

    await registerDeviceToken({ deviceToken: 'fcm-token' })

    expect(postSpy).toHaveBeenCalledWith('/notifications/register', { deviceToken: 'fcm-token' })
  })
})
