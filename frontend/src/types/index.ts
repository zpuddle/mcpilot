// 服务相关类型
export type ServiceLifecycleStatus = 'draft' | 'building' | 'running' | 'stopped' | 'error';
export type TransportType = 'sse' | 'streamable_http' | 'both';

export interface Service {
  id: number;
  name: string;
  slug: string;
  description: string;
  status: ServiceLifecycleStatus;
  transport_type: TransportType;
  port: number | null;
  current_version: number;
  owner_name: string;
  created_at: string;
  updated_at: string;
  env_vars?: Record<string, string>;
  extra_dependencies?: string;
}

export interface ServiceStats {
  total: number;
  draft: number;
  running: number;
  stopped: number;
  errors: number;
  error?: number;
  building: number;
}

export interface DashboardRecentService {
  id: number;
  name: string;
  status: ServiceLifecycleStatus;
  updatedAt: string;
  transport_type: TransportType;
  port: number | null;
  current_version: number;
}

export interface DashboardActivity {
  id: number;
  type: 'build' | 'start' | 'stop' | 'restart' | string;
  service: string;
  user: string;
  status: 'pending' | 'running' | 'success' | 'failed' | string;
  time: string;
}

export interface DashboardOverview {
  stats: ServiceStats;
  health: {
    running_rate: number;
    attention_count: number;
    ready_count: number;
  };
  status_breakdown: {
    status: ServiceLifecycleStatus;
    count: number;
  }[];
  recent_services: DashboardRecentService[];
  recent_activities: DashboardActivity[];
}

// 工具相关类型
export interface Tool {
  id: number;
  service_id: number;
  name: string;
  description: string;
  handler_name: string;
  input_schema: Record<string, any>;
  output_schema: Record<string, any>;
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
}

// 资源相关类型
export interface Resource {
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

// 版本相关类型
export interface Version {
  id: number;
  service_id: number;
  version_tag: string;
  changelog: string;
  created_by: number;
  created_at: string;
  code_snapshot?: string;
}

// 用户相关类型
export interface User {
  id: number;
  username: string;
  email: string;
  role_name: string;
  is_active: boolean;
  permissions: string[];
}

// 通知相关类型
export interface Notification {
  id: number;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}

// 活动相关类型
export interface Activity {
  id: number;
  type: 'deploy' | 'start' | 'stop' | 'restart' | 'create' | 'update' | 'delete';
  service_id: number;
  service_name: string;
  user_id: number;
  user_name: string;
  status: 'success' | 'failed' | 'pending';
  created_at: string;
}

// 模板相关类型
export interface Template {
  id: number;
  name: string;
  slug: string;
  description: string;
  category: string;
  icon: string;
  code_template: string;
  tools_template: any[];
  resources_template: any[];
  env_vars_template: Record<string, any>;
  dependencies: string;
  is_builtin: boolean;
  author_id: number;
  usage_count: number;
  created_at: string;
}

// 审计日志类型
export interface AuditLog {
  id: number;
  user_id: number;
  username: string;
  action: string;
  resource_type: string;
  resource_id: number;
  resource_name: string;
  detail: string;
  ip_address?: string;
  created_at: string;
}

// API响应类型
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}

export interface PaginatedResponse<T = any> {
  success: boolean;
  message: string;
  data: T[];
  total: number;
  page: number;
  page_size: number;
}

// 认证相关类型
export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

// 服务代码类型
export interface ServiceCode {
  code: string;
  updated_at: string;
}

// 服务部署状态
export interface ServiceStatus {
  service_status: string;
  container_status: string;
  port?: number;
  image_tag?: string;
  version?: number;
}

// 服务日志
export interface ServiceLogs {
  logs: string;
}
