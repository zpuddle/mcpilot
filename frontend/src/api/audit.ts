import client from './client';

export interface AuditLog {
  id: number;
  user_id: number | null;
  username: string;
  action: string;
  resource_type: string;
  resource_id: number | null;
  resource_name: string | null;
  detail: Record<string, any>;
  ip_address: string | null;
  created_at: string;
}

export interface AuditLogListResponse {
  total: number;
  page: number;
  size: number;
  data: AuditLog[];
}

export async function getAuditLogs(params: {
  page?: number;
  size?: number;
  user_id?: number;
  action?: string;
  resource_type?: string;
}): Promise<AuditLogListResponse> {
  const response = await client.get('/audit-logs', { params });
  return response.data;
}
