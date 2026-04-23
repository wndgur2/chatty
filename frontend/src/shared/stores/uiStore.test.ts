import { beforeEach, describe, expect, it } from 'vitest'
import { useUIStore } from './uiStore'

describe('useUIStore', () => {
  beforeEach(() => {
    useUIStore.setState({ isSidebarOpen: false })
  })

  it('sets sidebar open state explicitly', () => {
    useUIStore.getState().setSidebarOpen(true)
    expect(useUIStore.getState().isSidebarOpen).toBe(true)
  })

  it('toggles sidebar open state', () => {
    useUIStore.getState().toggleSidebar()
    expect(useUIStore.getState().isSidebarOpen).toBe(true)
    useUIStore.getState().toggleSidebar()
    expect(useUIStore.getState().isSidebarOpen).toBe(false)
  })
})
