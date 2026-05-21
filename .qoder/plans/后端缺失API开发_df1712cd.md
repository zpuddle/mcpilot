# 后端缺失 API 开发计划

## 现状分析

通过对比前端 mock 数据和后端已有接口，确认以下接口需要新增：

| 需求 | 当前状态 | 优先级 |
|------|---------|--------|
| 仪表盘最近活动 | 无 | 高 |
| 仪表盘最近服务 | 无 | 高 |
| Docker 单容器启动/停止/删除 | 无 | 高 |
| 管理员创建用户 | 无 | 中 |
| 管理员删除用户 | 无 | 中 |
| 用户列表补充 created_at 字段 | 缺失 | 中 |
| 审计日志导出 | 无 | 低 |

注：告警管理 (`GET /alerts`, `POST /alerts/{id}/resolve`, alert-rules CRUD) 和审计日志 (`GET /audit-logs`) 已经在后端完整实现，只需前端接入即可。

---

## Task 1: 仪表盘新增接口

文件: `backend/app/services/router.py`

在现有 `dashboard_stats` 端点下方新增两个端点：

1. **GET /services/dashboard/recent-activities** - 从 `deploy_logs` 和 `audit_logs` 表获取最近活动
   - 返回格式: `[{id, type, service, user, status, time}]`
   - 限制最近 10 条

2. **GET /services/dashboard/recent-services** - 按 `updated_at` 降序获取最近更新的服务
   - 返回格式: `[{id, name, status, updatedAt}]`
   - 限制最近 5 条

---

## Task 2: Docker 管理端新增单容器操作接口

文件: `backend/app/deploy/router.py`

在现有 `admin_router` 下新增三个端点：

1. **POST /admin/docker/containers/{container_id}/start** - 启动指定容器
2. **POST /admin/docker/containers/{container_id}/stop** - 停止指定容器
3. **DELETE /admin/docker/containers/{container_id}** - 删除指定容器

安全性：通过容器 label 验证是平台管理的容器后才允许操作。

---

## Task 3: 用户管理新增接口

文件: `backend/app/users/router.py` + `backend/app/users/schemas.py`

1. **POST /users/** - 管理员创建用户
   - 新增 `UserCreate` schema (username, email, password, role_id)
   - 调用 `auth.service.create_user` 或类似逻辑

2. **DELETE /users/{user_id}** - 管理员删除用户
   - 不允许删除自己
   - 不允许删除唯一 admin

3. **更新 GET /users/** - 在 `UserListItem` schema 和返回中补充 `created_at` 字段

---

## Task 4: 审计日志导出

文件: `backend/app/audit/router.py`

1. **GET /audit-logs/export** - 导出审计日志为 CSV
   - 支持与 `list_audit_logs` 相同的过滤参数
   - 返回 `StreamingResponse` (text/csv)

---

## Task 5: 验证

- 确认后端启动无语法错误
- 确认新接口路由正确注册
