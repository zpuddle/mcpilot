# MCPilot Backend API 文档

## 基础信息

- **Base URL**: `/api/v1`
- **认证方式**: JWT Bearer Token
- **数据格式**: JSON

## 通用响应结构

### ApiResponse
```json
{
  "success": true,
  "message": "ok",
  "data": {}
}
```

### PaginatedResponse
```json
{
  "success": true,
  "message": "ok",
  "data": [],
  "total": 0,
  "page": 1,
  "page_size": 20
}
```

---

## 1. 认证与授权 (Auth)

### 1.1 用户登录
- **Endpoint**: `POST /auth/login`
- **描述**: 使用用户名密码登录，返回 access_token 和 refresh_token

**请求体**:
```json
{
  "username": "string",
  "password": "string"
}
```

**响应体 (200)**:
```json
{
  "access_token": "string",
  "refresh_token": "string",
  "token_type": "bearer"
}
```

---

### 1.2 用户注册
- **Endpoint**: `POST /auth/register`
- **描述**: 注册新用户账号

**请求体**:
```json
{
  "username": "string",
  "email": "user@example.com",
  "password": "string"
}
```

**响应体 (200)**:
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "id": 1,
    "username": "string"
  }
}
```

---

### 1.3 刷新令牌
- **Endpoint**: `POST /auth/refresh`
- **描述**: 使用 refresh_token 获取新的 access_token

**请求体**:
```json
{
  "refresh_token": "string"
}
```

**响应体 (200)**:
```json
{
  "access_token": "string",
  "refresh_token": "string",
  "token_type": "bearer"
}
```

---

### 1.4 获取当前用户
- **Endpoint**: `GET /auth/me`
- **描述**: 获取当前登录用户的信息
- **认证**: 需要 Bearer Token

**响应体 (200)**:
```json
{
  "id": 1,
  "username": "string",
  "email": "user@example.com",
  "role_name": "string",
  "permissions": [],
  "is_active": true
}
```

---

### 1.5 更新用户资料
- **Endpoint**: `PUT /auth/me`
- **描述**: 更新当前用户的个人信息
- **认证**: 需要 Bearer Token

**请求体**:
```json
{
  "email": "user@example.com",
  "password": "string"
}
```

**响应体 (200)**:
```json
{
  "success": true,
  "message": "Profile updated",
  "data": null
}
```

---

## 2. 服务管理 (Services)

### 2.1 获取仪表板统计
- **Endpoint**: `GET /services/dashboard/stats`
- **描述**: 获取仪表板统计数据
- **认证**: 需要 Bearer Token

**响应体 (200)**:
```json
{
  "total": 0,
  "running": 0,
  "stopped": 0,
  "errors": 0,
  "building": 0
}
```

---

### 2.2 获取服务列表
- **Endpoint**: `GET /services/`
- **描述**: 获取 MCP 服务列表，支持分页和状态过滤
- **认证**: 需要 Bearer Token

**查询参数**:
- `page` (可选): 页码，默认 1
- `page_size` (可选): 每页数量，默认 20
- `status` (可选): 服务状态过滤

**响应体 (200)**:
```json
{
  "success": true,
  "message": "ok",
  "data": [
    {
      "id": 1,
      "name": "string",
      "slug": "string",
      "description": "string",
      "status": "draft",
      "transport_type": "sse",
      "port": 8000,
      "current_version": 1,
      "owner_name": "string",
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ],
  "total": 0,
  "page": 1,
  "page_size": 20
}
```

---

### 2.3 创建服务
- **Endpoint**: `POST /services/`
- **描述**: 创建新的 MCP 服务配置
- **认证**: 需要 Bearer Token + `services:write` 权限

**请求体**:
```json
{
  "name": "string",
  "description": "string",
  "transport_type": "sse"
}
```

**响应体 (200)**:
```json
{
  "id": 1,
  "name": "string",
  "slug": "string",
  "description": "string",
  "owner_id": 1,
  "owner_name": "string",
  "status": "draft",
  "transport_type": "sse",
  "port": null,
  "container_id": null,
  "image_tag": null,
  "current_version": 0,
  "env_vars": {},
  "extra_dependencies": "",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

---

### 2.4 获取服务详情
- **Endpoint**: `GET /services/{service_id}`
- **描述**: 获取指定服务的详细信息
- **认证**: 需要 Bearer Token

**路径参数**:
- `service_id`: 服务 ID

**响应体 (200)**:
```json
{
  "id": 1,
  "name": "string",
  "slug": "string",
  "description": "string",
  "owner_id": 1,
  "owner_name": "string",
  "status": "draft",
  "transport_type": "sse",
  "port": null,
  "container_id": null,
  "image_tag": null,
  "current_version": 0,
  "env_vars": {},
  "extra_dependencies": "",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

---

### 2.5 更新服务
- **Endpoint**: `PUT /services/{service_id}`
- **描述**: 更新服务的基本配置
- **认证**: 需要 Bearer Token + `services:write` 权限

**路径参数**:
- `service_id`: 服务 ID

**请求体**:
```json
{
  "name": "string",
  "description": "string",
  "transport_type": "sse",
  "env_vars": {},
  "extra_dependencies": ""
}
```

**响应体 (200)**:
```json
{
  "id": 1,
  "name": "string",
  "slug": "string",
  "description": "string",
  "owner_id": 1,
  "owner_name": "string",
  "status": "draft",
  "transport_type": "sse",
  "port": null,
  "container_id": null,
  "image_tag": null,
  "current_version": 0,
  "env_vars": {},
  "extra_dependencies": "",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

---

### 2.6 删除服务
- **Endpoint**: `DELETE /services/{service_id}`
- **描述**: 删除服务及其所有关联数据
- **认证**: 需要 Bearer Token + `services:write` 权限

**路径参数**:
- `service_id`: 服务 ID

**响应体 (200)**:
```json
{
  "success": true,
  "message": "Service deleted",
  "data": null
}
```

---

### 2.7 获取服务代码
- **Endpoint**: `GET /services/{service_id}/code`
- **描述**: 获取服务的 Python handler 代码
- **认证**: 需要 Bearer Token

**路径参数**:
- `service_id`: 服务 ID

**响应体 (200)**:
```json
{
  "code": "string",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

---

### 2.8 保存服务代码
- **Endpoint**: `PUT /services/{service_id}/code`
- **描述**: 保存或更新服务的 handler 代码
- **认证**: 需要 Bearer Token + `services:write` 权限

**路径参数**:
- `service_id`: 服务 ID

**请求体**:
```json
{
  "code": "string"
}
```

**响应体 (200)**:
```json
{
  "success": true,
  "message": "Code saved",
  "data": null
}
```

---

### 2.9 验证服务代码
- **Endpoint**: `POST /services/{service_id}/code/validate`
- **描述**: 对代码进行语法检查和安全扫描
- **认证**: 需要 Bearer Token

**路径参数**:
- `service_id`: 服务 ID

**请求体**:
```json
{
  "code": "string"
}
```

**响应体 (200)**:
```json
{
  "valid": true,
  "errors": [],
  "warnings": []
}
```

---

## 3. 工具与资源 (Tools & Resources)

### 3.1 获取工具列表
- **Endpoint**: `GET /services/{service_id}/tools`
- **描述**: 获取服务下所有工具配置
- **认证**: 需要 Bearer Token

**路径参数**:
- `service_id`: 服务 ID

**响应体 (200)**:
```json
[
  {
    "id": 1,
    "service_id": 1,
    "name": "string",
    "description": "string",
    "handler_name": "string",
    "input_schema": {},
    "output_schema": {},
    "is_enabled": true,
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
]
```

---

### 3.2 创建工具
- **Endpoint**: `POST /services/{service_id}/tools`
- **描述**: 为服务添加新的工具配置
- **认证**: 需要 Bearer Token + `services:write` 权限

**路径参数**:
- `service_id`: 服务 ID

**请求体**:
```json
{
  "name": "string",
  "description": "string",
  "handler_name": "string",
  "input_schema": {},
  "output_schema": {},
  "is_enabled": true
}
```

**响应体 (200)**:
```json
{
  "id": 1,
  "service_id": 1,
  "name": "string",
  "description": "string",
  "handler_name": "string",
  "input_schema": {},
  "output_schema": {},
  "is_enabled": true,
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

---

### 3.3 更新工具
- **Endpoint**: `PUT /services/{service_id}/tools/{tool_id}`
- **描述**: 更新指定工具的配置信息
- **认证**: 需要 Bearer Token + `services:write` 权限

**路径参数**:
- `service_id`: 服务 ID
- `tool_id`: 工具 ID

**请求体**:
```json
{
  "name": "string",
  "description": "string",
  "handler_name": "string",
  "input_schema": {},
  "output_schema": {},
  "is_enabled": true
}
```

**响应体 (200)**:
```json
{
  "id": 1,
  "service_id": 1,
  "name": "string",
  "description": "string",
  "handler_name": "string",
  "input_schema": {},
  "output_schema": {},
  "is_enabled": true,
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

---

### 3.4 删除工具
- **Endpoint**: `DELETE /services/{service_id}/tools/{tool_id}`
- **描述**: 删除指定的工具配置
- **认证**: 需要 Bearer Token + `services:write` 权限

**路径参数**:
- `service_id`: 服务 ID
- `tool_id`: 工具 ID

**响应体 (200)**:
```json
{
  "success": true,
  "message": "Tool deleted",
  "data": null
}
```

---

### 3.5 获取资源列表
- **Endpoint**: `GET /services/{service_id}/resources`
- **描述**: 获取服务下所有资源配置
- **认证**: 需要 Bearer Token

**路径参数**:
- `service_id`: 服务 ID

**响应体 (200)**:
```json
[
  {
    "id": 1,
    "service_id": 1,
    "uri_template": "string",
    "name": "string",
    "description": "string",
    "mime_type": "text/plain",
    "handler_name": "string",
    "is_enabled": true,
    "created_at": "2024-01-01T00:00:00Z"
  }
]
```

---

### 3.6 创建资源
- **Endpoint**: `POST /services/{service_id}/resources`
- **描述**: 为服务添加新的资源配置
- **认证**: 需要 Bearer Token + `services:write` 权限

**路径参数**:
- `service_id`: 服务 ID

**请求体**:
```json
{
  "uri_template": "string",
  "name": "string",
  "description": "string",
  "mime_type": "text/plain",
  "handler_name": "string",
  "is_enabled": true
}
```

**响应体 (200)**:
```json
{
  "id": 1,
  "service_id": 1,
  "uri_template": "string",
  "name": "string",
  "description": "string",
  "mime_type": "text/plain",
  "handler_name": "string",
  "is_enabled": true,
  "created_at": "2024-01-01T00:00:00Z"
}
```

---

### 3.7 更新资源
- **Endpoint**: `PUT /services/{service_id}/resources/{resource_id}`
- **描述**: 更新指定资源的配置信息
- **认证**: 需要 Bearer Token + `services:write` 权限

**路径参数**:
- `service_id`: 服务 ID
- `resource_id`: 资源 ID

**请求体**:
```json
{
  "uri_template": "string",
  "name": "string",
  "description": "string",
  "mime_type": "text/plain",
  "handler_name": "string",
  "is_enabled": true
}
```

**响应体 (200)**:
```json
{
  "id": 1,
  "service_id": 1,
  "uri_template": "string",
  "name": "string",
  "description": "string",
  "mime_type": "text/plain",
  "handler_name": "string",
  "is_enabled": true,
  "created_at": "2024-01-01T00:00:00Z"
}
```

---

### 3.8 删除资源
- **Endpoint**: `DELETE /services/{service_id}/resources/{resource_id}`
- **描述**: 删除指定的资源配置
- **认证**: 需要 Bearer Token + `services:write` 权限

**路径参数**:
- `service_id`: 服务 ID
- `resource_id`: 资源 ID

**响应体 (200)**:
```json
{
  "success": true,
  "message": "Resource deleted",
  "data": null
}
```

---

## 4. 部署与容器管理 (Deploy)

### 4.1 部署服务
- **Endpoint**: `POST /services/{service_id}/deploy`
- **描述**: 构建 Docker 镜像并启动 MCP 服务容器
- **认证**: 需要 Bearer Token + `services:deploy` 权限

**路径参数**:
- `service_id`: 服务 ID

**查询参数**:
- `force` (可选): 强制部署，忽略依赖检查

**响应体 (200)**:
```json
{
  "success": true,
  "message": "Service deployed successfully (v1)",
  "data": {
    "version": 1,
    "port": 8000,
    "container_id": "abc123"
  }
}
```

---

### 4.2 启动服务
- **Endpoint**: `POST /services/{service_id}/start`
- **描述**: 启动已停止的服务容器
- **认证**: 需要 Bearer Token + `services:deploy` 权限

**路径参数**:
- `service_id`: 服务 ID

**响应体 (200)**:
```json
{
  "success": true,
  "message": "Service started",
  "data": null
}
```

---

### 4.3 停止服务
- **Endpoint**: `POST /services/{service_id}/stop`
- **描述**: 停止运行中的服务容器
- **认证**: 需要 Bearer Token + `services:deploy` 权限

**路径参数**:
- `service_id`: 服务 ID

**响应体 (200)**:
```json
{
  "success": true,
  "message": "Service stopped",
  "data": null
}
```

---

### 4.4 重启服务
- **Endpoint**: `POST /services/{service_id}/restart`
- **描述**: 重启服务容器
- **认证**: 需要 Bearer Token + `services:deploy` 权限

**路径参数**:
- `service_id`: 服务 ID

**响应体 (200)**:
```json
{
  "success": true,
  "message": "Service restarted",
  "data": null
}
```

---

### 4.5 获取服务状态
- **Endpoint**: `GET /services/{service_id}/status`
- **描述**: 获取服务和容器的当前运行状态
- **认证**: 需要 Bearer Token

**路径参数**:
- `service_id`: 服务 ID

**响应体 (200)**:
```json
{
  "service_status": "running",
  "container_status": "running",
  "port": 8000,
  "image_tag": "mcp-svc-example:v1",
  "version": 1
}
```

---

### 4.6 获取容器日志
- **Endpoint**: `GET /services/{service_id}/logs`
- **描述**: 获取服务容器的运行日志
- **认证**: 需要 Bearer Token

**路径参数**:
- `service_id`: 服务 ID

**查询参数**:
- `tail` (可选): 返回最后 N 行，默认 100

**响应体 (200)**:
```json
{
  "logs": "string"
}
```

---

### 4.7 删除容器
- **Endpoint**: `DELETE /services/{service_id}/container`
- **描述**: 删除服务关联的 Docker 容器
- **认证**: 需要 Bearer Token + `services:deploy` 权限

**路径参数**:
- `service_id`: 服务 ID

**响应体 (200)**:
```json
{
  "success": true,
  "message": "Container removed",
  "data": null
}
```

---

### 4.8 调整副本数
- **Endpoint**: `PUT /services/{service_id}/scale`
- **描述**: 调整服务的运行副本数量
- **认证**: 需要 Bearer Token + `services:deploy` 权限

**路径参数**:
- `service_id`: 服务 ID

**请求体**:
```json
{
  "replicas": 3
}
```

**响应体 (200)**:
```json
{
  "success": true,
  "message": "Service scaled to 3 replica(s)",
  "data": {
    "replicas": 3
  }
}
```

---

### 4.9 查看实例状态
- **Endpoint**: `GET /services/{service_id}/instances`
- **描述**: 获取服务各实例的运行状态
- **认证**: 需要 Bearer Token

**路径参数**:
- `service_id`: 服务 ID

**响应体 (200)**:
```json
[
  {
    "id": 1,
    "service_id": 1,
    "instance_index": 1,
    "container_id": "abc123",
    "internal_port": 8001,
    "status": "running"
  }
]
```

---

### 4.10 管理容器列表 (管理员)
- **Endpoint**: `GET /admin/docker/containers`
- **描述**: 列出平台创建的所有 Docker 容器
- **认证**: 需要 Bearer Token + 管理员权限

**响应体 (200)**:
```json
{
  "containers": [],
  "count": 0
}
```

---

### 4.11 管理镜像列表 (管理员)
- **Endpoint**: `GET /admin/docker/images`
- **描述**: 列出平台创建的所有 Docker 镜像
- **认证**: 需要 Bearer Token + 管理员权限

**响应体 (200)**:
```json
{
  "images": [],
  "count": 0
}
```

---

### 4.12 清理旧镜像 (管理员)
- **Endpoint**: `POST /admin/docker/cleanup/images`
- **描述**: 清理旧版本的 MCP 服务镜像，保留最新 N 个版本
- **认证**: 需要 Bearer Token + 管理员权限

**查询参数**:
- `keep_latest` (可选): 保留最新 N 个版本，默认 3

**响应体 (200)**:
```json
{
  "success": true,
  "message": "Cleaned up 5 old image(s)",
  "data": {
    "removed": []
  }
}
```

---

### 4.13 清理停止容器 (管理员)
- **Endpoint**: `POST /admin/docker/cleanup/containers`
- **描述**: 清理已停止的 MCP 服务容器
- **认证**: 需要 Bearer Token + 管理员权限

**响应体 (200)**:
```json
{
  "success": true,
  "message": "Cleaned up 3 stopped container(s)",
  "data": {
    "removed": []
  }
}
```

---

## 5. 版本管理 (Versions)

### 5.1 获取版本列表
- **Endpoint**: `GET /services/{service_id}/versions/`
- **描述**: 获取服务的所有版本快照
- **认证**: 需要 Bearer Token

**路径参数**:
- `service_id`: 服务 ID

**响应体 (200)**:
```json
[
  {
    "id": 1,
    "service_id": 1,
    "version_tag": "v1",
    "changelog": "string",
    "created_by": 1,
    "created_at": "2024-01-01T00:00:00Z"
  }
]
```

---

### 5.2 创建版本
- **Endpoint**: `POST /services/{service_id}/versions/`
- **描述**: 为服务创建新的版本快照
- **认证**: 需要 Bearer Token + `services:write` 权限

**路径参数**:
- `service_id`: 服务 ID

**请求体**:
```json
{
  "changelog": "string"
}
```

**响应体 (200)**:
```json
{
  "id": 1,
  "service_id": 1,
  "version_tag": "v1",
  "changelog": "string",
  "created_by": 1,
  "created_at": "2024-01-01T00:00:00Z"
}
```

---

### 5.3 获取版本详情
- **Endpoint**: `GET /services/{service_id}/versions/{version_id}`
- **描述**: 获取指定版本的详细信息，包含代码和配置快照
- **认证**: 需要 Bearer Token

**路径参数**:
- `service_id`: 服务 ID
- `version_id`: 版本 ID

**响应体 (200)**:
```json
{
  "id": 1,
  "service_id": 1,
  "version_tag": "v1",
  "changelog": "string",
  "created_by": 1,
  "created_at": "2024-01-01T00:00:00Z",
  "code_snapshot": "string",
  "tools_snapshot": [],
  "config_snapshot": {}
}
```

---

### 5.4 版本回滚
- **Endpoint**: `POST /services/{service_id}/versions/{version_id}/rollback`
- **描述**: 将服务代码和配置回滚到指定版本
- **认证**: 需要 Bearer Token + `services:deploy` 权限

**路径参数**:
- `service_id`: 服务 ID
- `version_id`: 版本 ID

**响应体 (200)**:
```json
{
  "success": true,
  "message": "Rolled back to v1. Redeploy to apply changes.",
  "data": null
}
```

---

## 6. 日志与监控 (Logs & Monitoring)

### 6.1 WebSocket 实时日志流
- **Endpoint**: `WS /services/{service_id}/logs/stream`
- **描述**: WebSocket 端点用于实时日志流
- **认证**: 需要在查询参数中传递 token

**查询参数**:
- `token`: JWT access token

---

### 6.2 获取部署历史
- **Endpoint**: `GET /services/{service_id}/deploy-logs`
- **描述**: 获取服务的部署操作历史记录
- **认证**: 需要 Bearer Token

**路径参数**:
- `service_id`: 服务 ID

**响应体 (200)**:
```json
[
  {
    "id": 1,
    "action": "build",
    "status": "success",
    "log_output": "string",
    "triggered_by": 1,
    "created_at": "2024-01-01T00:00:00Z"
  }
]
```

---

### 6.3 获取服务实时指标
- **Endpoint**: `GET /services/{service_id}/metrics`
- **描述**: 获取服务容器的实时 CPU、内存、重启次数等指标
- **认证**: 需要 Bearer Token

**路径参数**:
- `service_id`: 服务 ID

**响应体 (200)**:
```json
{
  "service_id": 1,
  "service_name": "string",
  "metrics": {}
}
```

---

### 6.4 告警规则列表
- **Endpoint**: `GET /alert-rules`
- **描述**: 获取告警规则列表，可按 service_id 过滤
- **认证**: 需要 Bearer Token

**查询参数**:
- `service_id` (可选): 服务 ID 过滤

**响应体 (200)**:
```json
{
  "rules": [
    {
      "id": 1,
      "name": "string",
      "service_id": 1,
      "condition_type": "container_down",
      "threshold": "string",
      "is_enabled": true,
      "notify_method": "log",
      "webhook_url": "string",
      "created_by": 1,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "total": 0
}
```

---

### 6.5 创建告警规则
- **Endpoint**: `POST /alert-rules`
- **描述**: 创建新的告警规则
- **认证**: 需要 Bearer Token + `services:write` 权限

**请求体**:
```json
{
  "name": "string",
  "service_id": 1,
  "condition_type": "container_down",
  "threshold": "string",
  "is_enabled": true,
  "notify_method": "log",
  "webhook_url": "string"
}
```

**响应体 (200)**:
```json
{
  "success": true,
  "message": "Alert rule created",
  "data": {
    "id": 1
  }
}
```

---

### 6.6 更新告警规则
- **Endpoint**: `PUT /alert-rules/{rule_id}`
- **描述**: 更新告警规则
- **认证**: 需要 Bearer Token + `services:write` 权限

**路径参数**:
- `rule_id`: 告警规则 ID

**请求体**:
```json
{
  "name": "string",
  "service_id": 1,
  "condition_type": "container_down",
  "threshold": "string",
  "is_enabled": true,
  "notify_method": "log",
  "webhook_url": "string"
}
```

**响应体 (200)**:
```json
{
  "success": true,
  "message": "Alert rule updated",
  "data": null
}
```

---

### 6.7 删除告警规则
- **Endpoint**: `DELETE /alert-rules/{rule_id}`
- **描述**: 删除告警规则
- **认证**: 需要 Bearer Token + `services:write` 权限

**路径参数**:
- `rule_id`: 告警规则 ID

**响应体 (200)**:
```json
{
  "success": true,
  "message": "Alert rule deleted",
  "data": null
}
```

---

### 6.8 告警历史
- **Endpoint**: `GET /alerts`
- **描述**: 获取告警历史记录，支持分页和过滤
- **认证**: 需要 Bearer Token

**查询参数**:
- `service_id` (可选): 服务 ID 过滤
- `resolved` (可选): 是否已解决过滤
- `page` (可选): 页码，默认 1
- `page_size` (可选): 每页数量，默认 20

**响应体 (200)**:
```json
{
  "alerts": [
    {
      "id": 1,
      "rule_id": 1,
      "service_id": 1,
      "service_name": "string",
      "alert_type": "container_down",
      "message": "string",
      "resolved": false,
      "resolved_at": "2024-01-01T00:00:00Z",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "total": 0,
  "page": 1,
  "page_size": 20
}
```

---

### 6.9 标记告警已解决
- **Endpoint**: `POST /alerts/{alert_id}/resolve`
- **描述**: 标记告警为已解决
- **认证**: 需要 Bearer Token + `services:write` 权限

**路径参数**:
- `alert_id`: 告警 ID

**响应体 (200)**:
```json
{
  "success": true,
  "message": "Alert resolved",
  "data": null
}
```

---

## 7. 模板管理 (Templates)

### 7.1 模板列表
- **Endpoint**: `GET /templates`
- **描述**: 获取模板列表
- **认证**: 需要 Bearer Token

**查询参数**:
- `category` (可选): 分类过滤

**响应体 (200)**:
```json
[
  {
    "id": 1,
    "name": "string",
    "slug": "string",
    "description": "string",
    "category": "general",
    "icon": "code",
    "code_template": "string",
    "tools_template": [],
    "resources_template": [],
    "env_vars_template": {},
    "dependencies": "",
    "is_builtin": false,
    "author_id": 1,
    "usage_count": 0,
    "created_at": "2024-01-01T00:00:00Z"
  }
]
```

---

### 7.2 模板详情
- **Endpoint**: `GET /templates/{template_id}`
- **描述**: 获取模板详情
- **认证**: 需要 Bearer Token

**路径参数**:
- `template_id`: 模板 ID

**响应体 (200)**:
```json
{
  "id": 1,
  "name": "string",
  "slug": "string",
  "description": "string",
  "category": "general",
  "icon": "code",
  "code_template": "string",
  "tools_template": [],
  "resources_template": [],
  "env_vars_template": {},
  "dependencies": "",
  "is_builtin": false,
  "author_id": 1,
  "usage_count": 0,
  "created_at": "2024-01-01T00:00:00Z"
}
```

---

### 7.3 创建自定义模板
- **Endpoint**: `POST /templates`
- **描述**: 创建自定义模板
- **认证**: 需要 Bearer Token + `services:write` 权限

**请求体**:
```json
{
  "name": "string",
  "slug": "string",
  "description": "string",
  "category": "general",
  "icon": "code",
  "code_template": "string",
  "tools_template": [],
  "resources_template": [],
  "env_vars_template": {},
  "dependencies": ""
}
```

**响应体 (200)**:
```json
{
  "id": 1,
  "name": "string",
  "slug": "string",
  "description": "string",
  "category": "general",
  "icon": "code",
  "code_template": "string",
  "tools_template": [],
  "resources_template": [],
  "env_vars_template": {},
  "dependencies": "",
  "is_builtin": false,
  "author_id": 1,
  "usage_count": 0,
  "created_at": "2024-01-01T00:00:00Z"
}
```

---

### 7.4 更新模板
- **Endpoint**: `PUT /templates/{template_id}`
- **描述**: 更新模板
- **认证**: 需要 Bearer Token + `services:write` 权限

**路径参数**:
- `template_id`: 模板 ID

**请求体**:
```json
{
  "name": "string",
  "description": "string",
  "category": "general",
  "icon": "code",
  "code_template": "string",
  "tools_template": [],
  "resources_template": [],
  "env_vars_template": {},
  "dependencies": ""
}
```

**响应体 (200)**:
```json
{
  "id": 1,
  "name": "string",
  "slug": "string",
  "description": "string",
  "category": "general",
  "icon": "code",
  "code_template": "string",
  "tools_template": [],
  "resources_template": [],
  "env_vars_template": {},
  "dependencies": "",
  "is_builtin": false,
  "author_id": 1,
  "usage_count": 0,
  "created_at": "2024-01-01T00:00:00Z"
}
```

---

### 7.5 删除模板
- **Endpoint**: `DELETE /templates/{template_id}`
- **描述**: 删除模板
- **认证**: 需要 Bearer Token + `services:write` 权限

**路径参数**:
- `template_id`: 模板 ID

**响应体 (200)**:
```json
{
  "message": "Template deleted"
}
```

---

### 7.6 从模板创建服务
- **Endpoint**: `POST /templates/{template_id}/create-service`
- **描述**: 基于模板一键创建完整服务（含代码、工具配置）
- **认证**: 需要 Bearer Token + `services:write` 权限

**路径参数**:
- `template_id`: 模板 ID

**请求体**:
```json
{
  "name": "string",
  "description": "string"
}
```

**响应体 (200)**:
```json
{
  "id": 1,
  "name": "string",
  "slug": "string",
  "description": "string",
  "status": "draft",
  "owner_id": 1,
  "created_at": "2024-01-01T00:00:00Z",
  "template_name": "string"
}
```

---

## 8. 服务依赖 (Dependencies)

### 8.1 获取服务依赖列表
- **Endpoint**: `GET /services/{service_id}/dependencies`
- **描述**: 获取指定服务的依赖列表
- **认证**: 需要 Bearer Token

**路径参数**:
- `service_id`: 服务 ID

**响应体 (200)**:
```json
{
  "service_id": 1,
  "dependencies": [
    {
      "id": 1,
      "depends_on_id": 2,
      "depends_on_name": "string",
      "depends_on_status": "running",
      "dependency_type": "runtime",
      "description": "string",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "total": 0
}
```

---

### 8.2 添加服务依赖
- **Endpoint**: `POST /services/{service_id}/dependencies`
- **描述**: 添加服务依赖关系
- **认证**: 需要 Bearer Token + `services:write` 权限

**路径参数**:
- `service_id`: 服务 ID

**请求体**:
```json
{
  "depends_on_id": 2,
  "dependency_type": "runtime",
  "description": "string"
}
```

**响应体 (200)**:
```json
{
  "success": true,
  "message": "Dependency added",
  "data": {
    "id": 1
  }
}
```

---

### 8.3 移除服务依赖
- **Endpoint**: `DELETE /services/{service_id}/dependencies/{dep_id}`
- **描述**: 移除服务依赖关系
- **认证**: 需要 Bearer Token + `services:write` 权限

**路径参数**:
- `service_id`: 服务 ID
- `dep_id`: 依赖 ID

**响应体 (200)**:
```json
{
  "success": true,
  "message": "Dependency removed",
  "data": null
}
```

---

### 8.4 全局依赖图
- **Endpoint**: `GET /dependencies/graph`
- **描述**: 获取全局服务依赖图（nodes + edges）
- **认证**: 需要 Bearer Token

**响应体 (200)**:
```json
{
  "nodes": [
    {
      "id": 1,
      "name": "string",
      "slug": "string",
      "status": "running"
    }
  ],
  "edges": [
    {
      "id": 1,
      "source": 1,
      "target": 2,
      "type": "runtime"
    }
  ]
}
```

---

### 8.5 计算部署顺序
- **Endpoint**: `POST /dependencies/deploy-order`
- **描述**: 根据依赖关系计算部署顺序（拓扑排序）
- **认证**: 需要 Bearer Token

**请求体**:
```json
{
  "service_ids": [1, 2, 3]
}
```

**响应体 (200)**:
```json
{
  "deploy_order": [
    {
      "id": 2,
      "name": "string"
    },
    {
      "id": 1,
      "name": "string"
    },
    {
      "id": 3,
      "name": "string"
    }
  ]
}
```

---

## 9. 管理员操作 (Admin)

### 9.1 用户列表
- **Endpoint**: `GET /users/`
- **描述**: 获取所有用户列表（管理员）
- **认证**: 需要 Bearer Token + 管理员权限

**响应体 (200)**:
```json
[
  {
    "id": 1,
    "username": "string",
    "email": "user@example.com",
    "role_name": "admin",
    "is_active": true
  }
]
```

---

### 9.2 修改用户角色
- **Endpoint**: `PUT /users/{user_id}/role`
- **描述**: 更新指定用户的角色
- **认证**: 需要 Bearer Token + 管理员权限

**路径参数**:
- `user_id`: 用户 ID

**请求体**:
```json
{
  "role_id": 2
}
```

**响应体 (200)**:
```json
{
  "success": true,
  "message": "Role updated",
  "data": null
}
```

---

### 9.3 修改用户状态
- **Endpoint**: `PUT /users/{user_id}/status`
- **描述**: 启用或禁用指定用户
- **认证**: 需要 Bearer Token + 管理员权限

**路径参数**:
- `user_id`: 用户 ID

**请求体**:
```json
{
  "is_active": true
}
```

**响应体 (200)**:
```json
{
  "success": true,
  "message": "Status updated",
  "data": null
}
```

---

### 9.4 角色列表
- **Endpoint**: `GET /roles/`
- **描述**: 获取所有角色列表
- **认证**: 需要 Bearer Token + 管理员权限

**响应体 (200)**:
```json
[
  {
    "id": 1,
    "name": "admin",
    "permissions": []
  }
]
```

---

### 9.5 创建角色
- **Endpoint**: `POST /roles/`
- **描述**: 创建新的角色并设置权限
- **认证**: 需要 Bearer Token + 管理员权限

**请求体**:
```json
{
  "name": "string",
  "permissions": []
}
```

**响应体 (200)**:
```json
{
  "id": 1,
  "name": "string",
  "permissions": []
}
```

---

### 9.6 更新角色
- **Endpoint**: `PUT /roles/{role_id}`
- **描述**: 更新角色名称和权限配置
- **认证**: 需要 Bearer Token + 管理员权限

**路径参数**:
- `role_id`: 角色 ID

**请求体**:
```json
{
  "name": "string",
  "permissions": []
}
```

**响应体 (200)**:
```json
{
  "id": 1,
  "name": "string",
  "permissions": []
}
```

---

### 9.7 审计日志列表
- **Endpoint**: `GET /audit-logs`
- **描述**: 查询操作审计日志，仅管理员可用
- **认证**: 需要 Bearer Token + 管理员权限

**查询参数**:
- `page` (可选): 页码，默认 1
- `size` (可选): 每页数量，默认 20
- `user_id` (可选): 用户 ID 过滤
- `action` (可选): 操作类型过滤
- `resource_type` (可选): 资源类型过滤

**响应体 (200)**:
```json
{
  "total": 0,
  "page": 1,
  "size": 20,
  "data": [
    {
      "id": 1,
      "user_id": 1,
      "username": "string",
      "action": "string",
      "resource_type": "string",
      "resource_id": 1,
      "resource_name": "string",
      "detail": "string",
      "ip_address": "string",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

---

## 附录：枚举类型

### ServiceStatus
- `draft` - 草稿
- `building` - 构建中
- `running` - 运行中
- `stopped` - 已停止
- `error` - 错误

### TransportType
- `sse` - Server-Sent Events
- `stdio` - Standard I/O

### DeployAction
- `build` - 构建
- `start` - 启动
- `stop` - 停止
- `restart` - 重启

### DeployStatus
- `pending` - 等待中
- `running` - 运行中
- `success` - 成功
- `failed` - 失败

### DependencyType
- `runtime` - 运行时依赖
- `build` - 构建时依赖
- `optional` - 可选依赖

### AlertConditionType
- `container_down` - 容器停止
- `memory_high` - 内存过高
- `cpu_high` - CPU 过高
- `restart_count` - 重启次数

### NotifyMethod
- `log` - 日志记录
- `webhook` - Webhook 通知

---

## 错误响应

所有错误响应格式统一为：

```json
{
  "detail": "错误描述"
}
```

常见 HTTP 状态码：
- `400` - 请求参数错误
- `401` - 未授权（需要登录）
- `403` - 禁止访问（权限不足）
- `404` - 资源不存在
- `409` - 资源冲突
- `500` - 服务器内部错误
- `503` - Docker 服务错误
