import { create } from 'zustand'
import type { Notification } from '@/types'

interface UIState {
  sidebarOpen: boolean
  notifications: Notification[]
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  addNotification: (notification: Omit<Notification, 'id' | 'created_at'>) => void
  markNotificationRead: (id: number) => void
  clearNotifications: () => void
}

let notificationId = 0

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  notifications: [],

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  setSidebarOpen: (open: boolean) => set({ sidebarOpen: open }),

  addNotification: (notification) =>
    set((state) => ({
      notifications: [
        {
          ...notification,
          id: ++notificationId,
          created_at: new Date().toISOString(),
          read: false,
        },
        ...state.notifications.slice(0, 49),
      ],
    })),

  markNotificationRead: (id: number) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
    })),

  clearNotifications: () => set({ notifications: [] }),
}))
