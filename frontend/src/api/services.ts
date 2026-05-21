import { apiClient } from './client'
import type {
  Service,
  ServiceStats,
  PaginatedResponse,
  ApiResponse,
  Tool,
  Resource,
  Version,
  ServiceCode,
  ServiceStatus,
  ServiceLogs,
} from '@/types'

export const servicesApi = {
  getStats: async (): Promise<ServiceStats> => {
    return await apiClient.get('/services/dashboard/stats')
  },

  getRecentActivities: async (): Promise<{
    id: number
    type: string
    service: string
    user: string
    status: string
    time: string
  }[]> => {
    return await apiClient.get('/services/dashboard/recent-activities')
  },

  getRecentServices: async (): Promise<{
    id: number
    name: string
    status: string
    updatedAt: string
  }[]> => {
    return await apiClient.get('/services/dashboard/recent-services')
  },

  getServices: async (params?: {
    page?: number
    page_size?: number
    status?: string
  }): Promise<PaginatedResponse<Service>> => {
    return await apiClient.get('/services/', { params })
  },

  getService: async (id: number): Promise<Service> => {
    return await apiClient.get(`/services/${id}`)
  },

  createService: async (data: {
    name: string
    description: string
    transport_type: 'sse' | 'stdio'
  }): Promise<Service> => {
    return await apiClient.post('/services/', data)
  },

  updateService: async (
    id: number,
    data: {
      name?: string
      description?: string
      transport_type?: 'sse' | 'stdio'
      env_vars?: Record<string, string>
      extra_dependencies?: string
    }
  ): Promise<Service> => {
    return await apiClient.put(`/services/${id}`, data)
  },

  deleteService: async (id: number): Promise<ApiResponse> => {
    return await apiClient.delete(`/services/${id}`)
  },

  getServiceCode: async (id: number): Promise<ServiceCode> => {
    return await apiClient.get(`/services/${id}/code`)
  },

  saveServiceCode: async (id: number, code: string): Promise<ApiResponse> => {
    return await apiClient.put(`/services/${id}/code`, { code })
  },

  validateServiceCode: async (id: number, code: string): Promise<{ valid: boolean; errors: string[]; warnings: string[] }> => {
    return await apiClient.post(`/services/${id}/code/validate`, { code })
  },

  getTools: async (serviceId: number): Promise<Tool[]> => {
    return await apiClient.get(`/services/${serviceId}/tools`)
  },

  createTool: async (serviceId: number, data: Omit<Tool, 'id' | 'service_id' | 'created_at' | 'updated_at'>): Promise<Tool> => {
    return await apiClient.post(`/services/${serviceId}/tools`, data)
  },

  updateTool: async (serviceId: number, toolId: number, data: Partial<Tool>): Promise<Tool> => {
    return await apiClient.put(`/services/${serviceId}/tools/${toolId}`, data)
  },

  deleteTool: async (serviceId: number, toolId: number): Promise<ApiResponse> => {
    return await apiClient.delete(`/services/${serviceId}/tools/${toolId}`)
  },

  getResources: async (serviceId: number): Promise<Resource[]> => {
    return await apiClient.get(`/services/${serviceId}/resources`)
  },

  createResource: async (serviceId: number, data: Omit<Resource, 'id' | 'service_id' | 'created_at'>): Promise<Resource> => {
    return await apiClient.post(`/services/${serviceId}/resources`, data)
  },

  updateResource: async (serviceId: number, resourceId: number, data: Partial<Resource>): Promise<Resource> => {
    return await apiClient.put(`/services/${serviceId}/resources/${resourceId}`, data)
  },

  deleteResource: async (serviceId: number, resourceId: number): Promise<ApiResponse> => {
    return await apiClient.delete(`/services/${serviceId}/resources/${resourceId}`)
  },

  getVersions: async (serviceId: number): Promise<Version[]> => {
    return await apiClient.get(`/services/${serviceId}/versions/`)
  },

  createVersion: async (serviceId: number, changelog: string): Promise<Version> => {
    return await apiClient.post(`/services/${serviceId}/versions/`, { changelog })
  },

  getVersion: async (serviceId: number, versionId: number): Promise<Version> => {
    return await apiClient.get(`/services/${serviceId}/versions/${versionId}`)
  },

  rollbackToVersion: async (serviceId: number, versionId: number): Promise<ApiResponse> => {
    return await apiClient.post(`/services/${serviceId}/versions/${versionId}/rollback`)
  },

  deployService: async (serviceId: number, force?: boolean): Promise<ApiResponse<{ version: number; port: number; container_id: string }>> => {
    return await apiClient.post(`/services/${serviceId}/deploy`, null, { params: { force } })
  },

  startService: async (serviceId: number): Promise<ApiResponse> => {
    return await apiClient.post(`/services/${serviceId}/start`)
  },

  stopService: async (serviceId: number): Promise<ApiResponse> => {
    return await apiClient.post(`/services/${serviceId}/stop`)
  },

  restartService: async (serviceId: number): Promise<ApiResponse> => {
    return await apiClient.post(`/services/${serviceId}/restart`)
  },

  getServiceStatus: async (serviceId: number): Promise<ServiceStatus> => {
    return await apiClient.get(`/services/${serviceId}/status`)
  },

  getServiceLogs: async (serviceId: number, tail?: number): Promise<ServiceLogs> => {
    return await apiClient.get(`/services/${serviceId}/logs`, { params: { tail } })
  },

  deleteContainer: async (serviceId: number): Promise<ApiResponse> => {
    return await apiClient.delete(`/services/${serviceId}/container`)
  },

  scaleService: async (serviceId: number, replicas: number): Promise<ApiResponse<{ replicas: number }>> => {
    return await apiClient.put(`/services/${serviceId}/scale`, { replicas })
  },

  getInstances: async (serviceId: number): Promise<any[]> => {
    return await apiClient.get(`/services/${serviceId}/instances`)
  },
}
