import client from './client';

export interface ContainerMetrics {
  cpu_percent: number;
  memory_usage_mb: number;
  memory_limit_mb: number;
  memory_percent: number;
  restart_count: number;
  status: string;
  error?: string;
}

export interface AlertRule {
  id: number;
  name: string;
  service_id: number | null;
  condition_type: string;
  threshold: string | null;
  is_enabled: boolean;
  notify_method: string;
  webhook_url: string | null;
  created_by: number | null;
  created_at: string;
}

export interface AlertHistoryItem {
  id: number;
  rule_id: number | null;
  service_id: number | null;
  service_name: string | null;
  alert_type: string;
  message: string;
  resolved: boolean;
  resolved_at: string | null;
  created_at: string;
}

export async function getServiceMetrics(serviceId: number): Promise<ContainerMetrics> {
  const response = await client.get(`/services/${serviceId}/metrics`);
  return response.data;
}

export async function listAlertRules(): Promise<AlertRule[]> {
  const response = await client.get('/alert-rules');
  return response.data;
}

export async function createAlertRule(data: Partial<AlertRule>): Promise<AlertRule> {
  const response = await client.post('/alert-rules', data);
  return response.data;
}

export async function updateAlertRule(id: number, data: Partial<AlertRule>): Promise<AlertRule> {
  const response = await client.put(`/alert-rules/${id}`, data);
  return response.data;
}

export async function deleteAlertRule(id: number): Promise<void> {
  await client.delete(`/alert-rules/${id}`);
}

export async function listAlerts(params?: { page?: number; size?: number }): Promise<{
  total: number;
  data: AlertHistoryItem[];
}> {
  const response = await client.get('/alerts', { params });
  return response.data;
}

export async function resolveAlert(id: number): Promise<void> {
  await client.post(`/alerts/${id}/resolve`);
}
