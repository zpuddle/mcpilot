import { apiClient } from './client'
import type { Template, ApiResponse } from '@/types'

export const templatesApi = {
  getTemplates: async (params?: { category?: string }): Promise<Template[]> => {
    return await apiClient.get('/templates', { params })
  },

  getTemplate: async (id: number): Promise<Template> => {
    return await apiClient.get(`/templates/${id}`)
  },

  createTemplate: async (data: Omit<Template, 'id' | 'is_builtin' | 'usage_count' | 'created_at'>): Promise<Template> => {
    return await apiClient.post('/templates', data)
  },

  updateTemplate: async (id: number, data: Partial<Template>): Promise<Template> => {
    return await apiClient.put(`/templates/${id}`, data)
  },

  deleteTemplate: async (id: number): Promise<{ message: string }> => {
    return await apiClient.delete(`/templates/${id}`)
  },

  createServiceFromTemplate: async (
    templateId: number,
    data: { name: string; description: string }
  ): Promise<{ id: number; name: string; slug: string; status: string; created_at: string; template_name: string }> => {
    return await apiClient.post(`/templates/${templateId}/create-service`, data)
  },
}
