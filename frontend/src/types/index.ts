export interface User {
  id: number;
  username: string;
  email: string;
  role_name: string;
  permissions: string[];
  is_active: boolean;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface McpService {
  id: number;
  name: string;
  slug: string;
  description: string;
  owner_id: number;
  owner_name: string;
  status: ServiceStatus;
  transport_type: TransportType;
  port: number | null;
  container_id: string | null;
  image_tag: string | null;
  current_version: number;
  env_vars: Record<string, string>;
  extra_dependencies: string;
  created_at: string;
  updated_at: string;
}

export type ServiceStatus = 'draft' | 'building' | 'running' | 'stopped' | 'error';
export type TransportType = 'sse' | 'streamable_http' | 'both';

export interface ServiceTool {
  id: number;
  service_id: number;
  name: string;
  description: string;
  handler_name: string;
  input_schema: Record<string, unknown>;
  output_schema: Record<string, unknown>;
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface ServiceResource {
  id: number;
  service_id: number;
  uri_template: string;
  name: string;
  description: string;
  mime_type: string;
  handler_name: string;
  is_enabled: boolean;
  created_at: string;
}

export interface ServiceVersion {
  id: number;
  service_id: number;
  version_tag: string;
  changelog: string;
  created_by: number | null;
  created_at: string;
  code_snapshot?: string;
  tools_snapshot?: unknown[];
  config_snapshot?: Record<string, unknown>;
}

export interface DeployLog {
  id: number;
  action: string;
  status: string;
  log_output: string;
  triggered_by: number | null;
  created_at: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
}

export interface PaginatedResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T[];
  total: number;
  page: number;
  page_size: number;
}

export interface Role {
  id: number;
  name: string;
  permissions: string[];
}
