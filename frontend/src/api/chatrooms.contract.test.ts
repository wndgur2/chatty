import { describe, expect, it, vi } from 'vitest'
import { branchChatroom, cloneChatroom, createChatroom, deleteChatroom, updateChatroom } from './chatrooms'

const postSpy = vi.hoisted(() => vi.fn())
const patchSpy = vi.hoisted(() => vi.fn())
const deleteSpy = vi.hoisted(() => vi.fn())

vi.mock('./client', () => ({
  apiClient: {
    post: postSpy,
    patch: patchSpy,
    delete: deleteSpy,
    get: vi.fn(),
  },
}))

describe('chatrooms api contract', () => {
  it('sends multipart form data when creating a chatroom', async () => {
    postSpy.mockResolvedValueOnce({ id: 1 })

    await createChatroom({ name: 'Room', basePrompt: 'Prompt' })

    const [, formData, options] = postSpy.mock.calls[0] as [string, FormData, { headers: Record<string, string> }]
    expect(postSpy).toHaveBeenCalledWith(
      '/chatrooms',
      expect.any(FormData),
      expect.objectContaining({ headers: { 'Content-Type': 'multipart/form-data' } }),
    )
    expect(formData.get('name')).toBe('Room')
    expect(formData.get('basePrompt')).toBe('Prompt')
    expect(options.headers['Content-Type']).toBe('multipart/form-data')
  })

  it('sends only provided fields when updating chatroom', async () => {
    patchSpy.mockResolvedValueOnce({ id: 2 })

    await updateChatroom({ id: 2, data: { name: 'Renamed' } })

    const [, formData] = patchSpy.mock.calls[0] as [string, FormData]
    expect(patchSpy).toHaveBeenCalledWith(
      '/chatrooms/2',
      expect.any(FormData),
      expect.objectContaining({ headers: { 'Content-Type': 'multipart/form-data' } }),
    )
    expect(formData.get('name')).toBe('Renamed')
    expect(formData.get('basePrompt')).toBeNull()
  })

  it('calls clone, branch, and delete endpoints', async () => {
    postSpy.mockResolvedValue({ id: 3 })
    deleteSpy.mockResolvedValue(undefined)

    await cloneChatroom(3)
    await branchChatroom(3)
    await deleteChatroom(3)

    expect(postSpy).toHaveBeenCalledWith('/chatrooms/3/clone')
    expect(postSpy).toHaveBeenCalledWith('/chatrooms/3/branch')
    expect(deleteSpy).toHaveBeenCalledWith('/chatrooms/3')
  })
})
