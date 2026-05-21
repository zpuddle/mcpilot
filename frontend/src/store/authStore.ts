import { create } from 'zustand'
import { apiClient } from '@/api/client'
import { authApi } from '@/api/auth'
import type { User, LoginRequest, RegisterRequest } from '@/types'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (data: LoginRequest) => Promise<void>
  register: (data: RegisterRequest) => Promise<void>
  logout: () => void
  fetchUser: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: apiClient.isAuthenticated(),
  isLoading: false,

  login: async (data: LoginRequest) => {
    set({ isLoading: true })
    try {
      const response = await authApi.login(data)
      apiClient.setTokens(response.access_token, response.refresh_token)
      const user = await authApi.getMe()
      set({ user, isAuthenticated: true, isLoading: false })
    } catch (error) {
      set({ isLoading: false })
      throw error
    }
  },

  register: async (data: RegisterRequest) => {
    set({ isLoading: true })
    try {
      await authApi.register(data)
      set({ isLoading: false })
    } catch (error) {
      set({ isLoading: false })
      throw error
    }
  },

  logout: () => {
    apiClient.clearTokens()
    set({ user: null, isAuthenticated: false })
  },

  fetchUser: async () => {
    if (!apiClient.isAuthenticated()) return
    try {
      const user = await authApi.getMe()
      set({ user, isAuthenticated: true })
    } catch (error) {
      apiClient.clearTokens()
      set({ user: null, isAuthenticated: false })
    }
  },
}))
