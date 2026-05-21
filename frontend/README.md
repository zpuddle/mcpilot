# MCPilot Frontend

MCP (Model Context Protocol) 服务管理平台的前端项目。

## 技术栈

- React 18
- TypeScript
- Vite
- Tailwind CSS
- React Router v6
- TanStack Query (React Query)
- Zustand
- Framer Motion
- Lucide Icons
- Sonner (Toasts)

## 快速开始

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

访问 http://localhost:3000

### 构建

```bash
npm run build
```

### 预览构建结果

```bash
npm run preview
```

## 项目结构

```
src/
├── api/              # API 客户端
├── components/       # React 组件
│   ├── common/      # 通用组件
│   └── layout/      # 布局组件
├── pages/           # 页面组件
├── router/          # 路由配置
├── store/           # Zustand 状态管理
├── styles/          # 全局样式
├── types/           # TypeScript 类型定义
├── utils/           # 工具函数
├── App.tsx          # 根组件
└── main.tsx         # 应用入口
```

## 功能特性

- ✅ 用户认证 (登录/注册)
- ✅ 仪表板 (服务统计)
- ✅ 服务管理 (列表/搜索/筛选)
- 🚧 服务详情 (配置/代码/部署/日志)
- 🚧 模板管理
- 🚧 管理员功能
  - 用户管理
  - 角色管理
  - 审计日志
  - 告警管理
  - Docker 管理

## 环境变量

创建 `.env.local` 文件:

```
VITE_API_URL=http://localhost:8000/api/v1
```

## 设计系统

- 主题色: 深蓝 (#1e40af) + 青色 (#06b6d4)
- 状态色: 成功 (绿) / 警告 (橙) / 错误 (红)
- 字体: Inter (无衬线) + JetBrains Mono (代码)
