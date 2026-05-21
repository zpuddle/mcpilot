import { apiClient } from './client'
import type { ApiResponse, AuditLog } from '@/types'

// ─── Users ────────────────────────────────────────────────────────────────

export interface AdminUser {
  id: number
  username: string
  email: string
  role_name: string
  is_active: boolean
  created_at: string | null
}

export interface AdminRole {
  id: number
  name: string
  permissions: string[]
}

export const usersApi = {
  getUsers: async (): Promise<AdminUser[]> => {
    return await apiClient.get('/users/')
  },

  createUser: async (data: {
    username: string
    email: string
    password: string
    role_id: number
  }): Promise<ApiResponse> => {
    return await apiClient.post('/users/', data)
  },

  updateUserRole: async (userId: number, roleId: number): Promise<ApiResponse> => {
    return await apiClient.put(`/users/${userId}/role`, { role_id: roleId })
  },

  updateUserStatus: async (userId: number, isActive: boolean): Promise<ApiResponse> => {
    return await apiClient.put(`/users/${userId}/status`, { is_active: isActive })
  },

  deleteUser: async (userId: number): Promise<ApiResponse> => {
    return await apiClient.delete(`/users/${userId}`)
  },

  getRoles: async (): Promise<AdminRole[]> => {
    return await apiClient.get('/roles/')
  },
}

// ─── Alerts ───────────────────────────────────────────────────────────────

export interface Alert {
  id: number
  rule_id: number | null
  service_id: number | null
  service_name: string | null
  alert_type: string
  message: string
  resolved: boolean
  resolved_at: string | null
  created_at: string | null
}

export interface AlertRule {
  id: number
  name: string
  service_id: number | null
  condition_type: string
  threshold: string | null
  is_enabled: boolean
  notify_method: string
  webhook_url: string | null
  created_by: number | null
  created_at: string | null
}

export const alertsApi = {
  getAlerts: async (params?: {
    service_id?: number
    resolved?: boolean
    page?: number
    page_size?: number
  }): Promise<{ alerts: Alert[]; total: number; page: number; page_size: number }> => {
    return await apiClient.get('/alerts', { params })
  },

  resolveAlert: async (alertId: number): Promise<ApiResponse> => {
    return await apiClient.post(`/alerts/${alertId}/resolve`)
  },

  getAlertRules: async (params?: {
    service_id?: number
  }): Promise<{ rules: AlertRule[]; total: number }> => {
    return await apiClient.get('/alert-rules', { params })
  },

  createAlertRule: async (data: {
    name: string
    service_id?: number
    condition_type: string
    threshold?: string
    is_enabled?: boolean
    notify_method?: string
    webhook_url?: string
  }): Promise<ApiResponse> => {
    return await apiClient.post('/alert-rules', data)
  },

  updateAlertRule: async (ruleId: number, data: Partial<{
    name: string
    service_id: number
    condition_type: string
    threshold: string
    is_enabled: boolean
    notify_method: string
    webhook_url: string
  }>): Promise<ApiResponse> => {
    return await apiClient.put(`/alert-rules/${ruleId}`, data)
  },

  deleteAlertRule: async (ruleId: number): Promise<ApiResponse> => {
    return await apiClient.delete(`/alert-rules/${ruleId}`)
  },
}

// ─── Docker ───────────────────────────────────────────────────────────────

export interface DockerContainer {
  id: string
  name: string
  status: string
  image: string
}

export const dockerApi = {
  getContainers: async (): Promise<{ containers: DockerContainer[]; count: number }> => {
    return await apiClient.get('/admin/docker/containers')
  },

  getImages: async (): Promise<{ images: any[]; count: number }> => {
    return await apiClient.get('/admin/docker/images')
  },

  startContainer: async (containerId: string): Promise<ApiResponse> => {
    return await apiClient.post(`/admin/docker/containers/${containerId}/start`)
  },

  stopContainer: async (containerId: string): Promise<ApiResponse> => {
    return await apiClient.post(`/admin/docker/containers/${containerId}/stop`)
  },

  removeContainer: async (containerId: string): Promise<ApiResponse> => {
    return await apiClient.delete(`/admin/docker/containers/${containerId}`)
  },

  cleanupImages: async (keepLatest?: number): Promise<ApiResponse> => {
    return await apiClient.post('/admin/docker/cleanup/images', null, {
      params: { keep_latest: keepLatest },
    })
  },

  cleanupContainers: async (): Promise<ApiResponse> => {
    return await apiClient.post('/admin/docker/cleanup/containers')
  },
}

// ─── Audit Logs ───────────────────────────────────────────────────────────

export const auditApi = {
  getLogs: async (params?: {
    page?: number
    size?: number
    user_id?: number
    action?: string
    resource_type?: string
  }): Promise<{ data: AuditLog[]; total: number; page: number; size: number }> => {
    return await apiClient.get('/audit-logs', { params })
  },

  exportLogs: async (params?: {
    user_id?: number
    action?: string
    resource_type?: string
  }): Promise<Blob> => {
    const response = await apiClient.get('/audit-logs/export', {
      params,
      responseType: 'blob',
    })
    return response as any
  },
}
