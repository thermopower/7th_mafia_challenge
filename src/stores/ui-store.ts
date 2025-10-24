/**
 * Zustand UI 상태 스토어
 * 전역 UI 상태 관리 (모달, 사이드바 등)
 */

import { create } from 'zustand'

type UIStore = {
  // 사이드바 상태
  isSidebarOpen: boolean
  toggleSidebar: () => void
  closeSidebar: () => void

  // 모달 상태
  activeModal: string | null
  openModal: (modalId: string) => void
  closeModal: () => void
}

export const useUIStore = create<UIStore>((set) => ({
  // 사이드바
  isSidebarOpen: false,
  toggleSidebar: () =>
    set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  closeSidebar: () => set({ isSidebarOpen: false }),

  // 모달
  activeModal: null,
  openModal: (modalId) => set({ activeModal: modalId }),
  closeModal: () => set({ activeModal: null }),
}))
