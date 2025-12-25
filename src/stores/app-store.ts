import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { AppState } from '@/lib/types'

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      sidebarOpen: false,
      theme: 'system',
      currentPage: 'discover',
      useMockMode: true,
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setTheme: (theme) => set({ theme }),
      setCurrentPage: (page) => set({ currentPage: page }),
      setMockMode: (mock) => set({ useMockMode: mock }),
    }),
    { name: 'app-storage', storage: createJSONStorage(() => localStorage) }
  )
)
