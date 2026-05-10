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
