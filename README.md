# MCPilot

MCPilot — MCP (Model Context Protocol) 服务管理驾驶舱 · Web 可视化创建、编辑、部署和管理 MCP 服务的全生命周期。

## 定位

通过 Web UI 让用户可以：
- 创建和管理 MCP 服务（增删改查）
- 在 Monaco Editor 中编写 Python handler 代码
- 可视化定义 Tools 和 Resources（输入/输出参数）
- 配置传输协议（SSE / Streamable HTTP）和环境变量
- 一键部署为 Docker 容器，自动构建镜像
- 管理服务生命周期（启动/停止/重启）
- 查看实时日志和部署历史
- 版本管理与回滚
- 完整的用户/角色权限体系 (JWT + RBAC)

## 技术栈

| 层面 | 选型 |
|------|------|
| 后端 | Python 3.12 + FastAPI + SQLAlchemy (async) |
| 前端 | React 18 + TypeScript + Vite + Ant Design |
| 数据库 | PostgreSQL 16 |
| 编辑器 | Monaco Editor |
| MCP SDK | FastMCP (Python) |
| 容器化 | Docker SDK for Python |

## 快速启动

### 1. 启动 PostgreSQL

```bash
docker-compose up -d postgres
```

### 2. 启动后端

```bash
cd backend
conda create -n mcpilot python=3.12
conda activate mcpilot
pip install -r requirements.txt
cp ../.env.example .env  # 编辑配置
uvicorn app.main:app --host 0.0.0.0 --port 8020 --reload
```

首次启动会自动创建数据库表、默认角色和管理员账户（见 `.env.example` 中的 `ADMIN_*` 配置）。

### 3. 启动前端

```bash
cd frontend
npm install
npm run dev
```

访问 http://localhost:3000，使用 admin/admin123 登录。

### 4. 一键启动（Docker Compose）

```bash
docker-compose up
```

## 环境变量

见 `.env.example`，主要配置项：

| 变量 | 说明 | 默认值 |
|------|------|--------|
| DATABASE_URL | PostgreSQL 连接串 | postgresql+asyncpg://mcpadmin:mcpadmin123@localhost:5432/mcpilot |
| SECRET_KEY | JWT 签名密钥 | (需修改) |
| MCP_SERVICE_PORT_RANGE_START | MCP 服务端口起始 | 9001 |
| MCP_SERVICE_PORT_RANGE_END | MCP 服务端口结束 | 9999 |
| MCP_SERVICE_NETWORK | Docker 网络名 | mcp-services-net |
| ADMIN_USERNAME | 初始管理员用户名 | admin |
| ADMIN_PASSWORD | 初始管理员密码 | admin123 |

## API 文档

后端启动后访问 http://localhost:8020/docs 查看 Swagger UI。

## 目录结构

```
mcpilot/
├── docker-compose.yml          # 开发环境
├── .env.example                # 环境变量模板
├── data/                       # 持久化数据目录 (git ignored)
│   └── pg/                     # PostgreSQL 数据
├── backend/                    # FastAPI 后端
│   ├── app/
│   │   ├── main.py             # 应用入口
│   │   ├── config.py           # 配置
│   │   ├── auth/               # 认证模块
│   │   ├── users/              # 用户管理
│   │   ├── services/           # MCP 服务 CRUD
│   │   ├── tools/              # Tools/Resources CRUD
│   │   ├── deploy/             # 部署引擎 (Docker)
│   │   ├── versions/           # 版本管理
│   │   ├── logs/               # 日志模块
│   │   ├── database/           # ORM 模型
│   │   └── common/             # 公共工具
│   └── requirements.txt
├── frontend/                   # React 前端
│   ├── src/
│   │   ├── api/                # API 客户端
│   │   ├── pages/              # 页面组件
│   │   ├── components/         # 通用组件
│   │   ├── store/              # 状态管理
│   │   └── router/             # 路由配置
│   └── package.json
└── templates/                  # MCP 服务生成模板
```

## 数据持久化

所有容器的挂载数据统一存放在项目下的 `data/` 目录：

| 服务 | 挂载目录 | 说明 |
|------|----------|------|
| PostgreSQL | `./data/pg/` | 数据库文件 |

`data/` 目录已被 `.gitignore` 忽略，不会提交到版本库。首次启动 `docker-compose up` 时会自动创建。
