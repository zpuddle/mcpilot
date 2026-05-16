import client from './client';
import type { McpService, PaginatedResponse, ApiResponse, ServiceStatus } from '../types';

export async function listServices(page = 1, pageSize = 20, status?: ServiceStatus) {
  const params: Record<string, unknown> = { page, page_size: pageSize };
  if (status) params.status = status;
  const res = await client.get<PaginatedResponse<McpService>>('/services', { params });
  return res.data;
}

export async function getService(id: number): Promise<McpService> {
  const res = await client.get(`/services/${id}`);
  return res.data;
}

export async function createService(data: { name: string; description?: string; transport_type?: string }) {
  const res = await client.post<McpService>('/services', data);
  return res.data;
}

export async function updateService(id: number, data: Record<string, unknown>) {
  const res = await client.put<McpService>(`/services/${id}`, data);
  return res.data;
}

export async function deleteService(id: number) {
  const res = await client.delete<ApiResponse>(`/services/${id}`);
  return res.data;
}

// Code
export async function getServiceCode(id: number) {
  const res = await client.get<{ code: string; updated_at: string | null }>(`/services/${id}/code`);
  return res.data;
}

export async function saveServiceCode(id: number, code: string) {
  const res = await client.put<ApiResponse>(`/services/${id}/code`, { code });
  return res.data;
}

export async function validateCode(id: number, code: string) {
  const res = await client.post<{ valid: boolean; errors: string[]; warnings: string[] }>(
    `/services/${id}/code/validate`, { code }
  );
  return res.data;
}

// Deploy & Lifecycle
export async function deployService(id: number) {
  const res = await client.post<ApiResponse>(`/services/${id}/deploy`);
  return res.data;
}

export async function startService(id: number) {
  const res = await client.post<ApiResponse>(`/services/${id}/start`);
  return res.data;
}

export async function stopService(id: number) {
  const res = await client.post<ApiResponse>(`/services/${id}/stop`);
  return res.data;
}

export async function restartService(id: number) {
  const res = await client.post<ApiResponse>(`/services/${id}/restart`);
  return res.data;
}

export async function getServiceStatus(id: number) {
  const res = await client.get(`/services/${id}/status`);
  return res.data;
}

export async function getServiceLogs(id: number, tail = 100) {
  const res = await client.get<{ logs: string }>(`/services/${id}/logs`, { params: { tail } });
  return res.data;
}

export async function removeContainer(id: number) {
  const res = await client.delete<ApiResponse>(`/services/${id}/container`);
  return res.data;
}

// Dependencies
export interface ServiceDependency {
  id: number;
  service_id: number;
  depends_on_id: number;
  depends_on_name?: string;
  dependency_type: string;
  description: string | null;
  created_at: string;
}

export async function getServiceDependencies(serviceId: number): Promise<ServiceDependency[]> {
  const res = await client.get(`/services/${serviceId}/dependencies`);
  return res.data;
}

export async function addServiceDependency(serviceId: number, data: {
  depends_on_id: number;
  dependency_type?: string;
  description?: string;
}): Promise<ServiceDependency> {
  const res = await client.post(`/services/${serviceId}/dependencies`, data);
  return res.data;
}

export async function removeServiceDependency(serviceId: number, depId: number): Promise<void> {
  await client.delete(`/services/${serviceId}/dependencies/${depId}`);
}

// Dashboard
export async function getDashboardStats() {
  const res = await client.get<{ total: number; running: number; stopped: number; errors: number; building: number }>('/services/dashboard/stats');
  return res.data;
}

// Multi-Instance
export interface ServiceInstance {
  id: number;
  service_id: number;
  instance_index: number;
  container_id: string | null;
  internal_port: number;
  status: string;
}

export async function scaleService(serviceId: number, replicas: number): Promise<ApiResponse> {
  const res = await client.put<ApiResponse>(`/services/${serviceId}/scale`, { replicas });
  return res.data;
}

export async function getServiceInstances(serviceId: number): Promise<ServiceInstance[]> {
  const res = await client.get<ServiceInstance[]>(`/services/${serviceId}/instances`);
  return res.data;
}
