import { apiClient } from './client'
import type { LoginRequest, RegisterRequest, AuthResponse, User, ApiResponse } from '@/types'

export const authApi = {
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    return await apiClient.post<AuthResponse>('/auth/login', data)
  },

  register: async (data: RegisterRequest): Promise<ApiResponse<{ id: number; username: string }>> => {
    return await apiClient.post('/auth/register', data)
  },

  refresh: async (refreshToken: string): Promise<AuthResponse> => {
    return await apiClient.post('/auth/refresh', { refresh_token: refreshToken })
  },

  getMe: async (): Promise<User> => {
    return await apiClient.get<User>('/auth/me')
  },

  updateProfile: async (data: { email?: string; password?: string }): Promise<ApiResponse> => {
    return await apiClient.put('/auth/me', data)
  },
}
