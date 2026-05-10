import client from './client';
import type { ServiceTool, ServiceResource, ApiResponse } from '../types';

// Tools
export async function listTools(serviceId: number): Promise<ServiceTool[]> {
  const res = await client.get(`/services/${serviceId}/tools`);
  return res.data;
}

export async function createTool(serviceId: number, data: Partial<ServiceTool>) {
  const res = await client.post<ServiceTool>(`/services/${serviceId}/tools`, data);
  return res.data;
}

export async function updateTool(serviceId: number, toolId: number, data: Partial<ServiceTool>) {
  const res = await client.put<ServiceTool>(`/services/${serviceId}/tools/${toolId}`, data);
  return res.data;
}

export async function deleteTool(serviceId: number, toolId: number) {
  const res = await client.delete<ApiResponse>(`/services/${serviceId}/tools/${toolId}`);
  return res.data;
}

// Resources
export async function listResources(serviceId: number): Promise<ServiceResource[]> {
  const res = await client.get(`/services/${serviceId}/resources`);
  return res.data;
}

export async function createResource(serviceId: number, data: Partial<ServiceResource>) {
  const res = await client.post<ServiceResource>(`/services/${serviceId}/resources`, data);
  return res.data;
}

export async function updateResource(serviceId: number, resourceId: number, data: Partial<ServiceResource>) {
  const res = await client.put<ServiceResource>(`/services/${serviceId}/resources/${resourceId}`, data);
  return res.data;
}

export async function deleteResource(serviceId: number, resourceId: number) {
  const res = await client.delete<ApiResponse>(`/services/${serviceId}/resources/${resourceId}`);
  return res.data;
}

// Versions
export async function listVersions(serviceId: number) {
  const res = await client.get(`/services/${serviceId}/versions`);
  return res.data;
}

export async function createVersion(serviceId: number, changelog: string) {
  const res = await client.post(`/services/${serviceId}/versions`, { changelog });
  return res.data;
}

export async function rollbackVersion(serviceId: number, versionId: number) {
  const res = await client.post<ApiResponse>(`/services/${serviceId}/versions/${versionId}/rollback`);
  return res.data;
}

// Deploy Logs
export async function getDeployLogs(serviceId: number) {
  const res = await client.get(`/services/${serviceId}/deploy-logs`);
  return res.data;
}
