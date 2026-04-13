import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UIState {
  isSidebarOpen: boolean
  setSidebarOpen: (isOpen: boolean) => void
  toggleSidebar: () => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      isSidebarOpen: false,
      setSidebarOpen: (isOpen) => set({ isSidebarOpen: isOpen }),
      toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
    }),
    {
      name: 'chatty-ui-store',
      partialize: (state) => ({ isSidebarOpen: state.isSidebarOpen }),
    },
  ),
)
