import { useState } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import {
  Cpu,
  Play,
  Square,
  RefreshCw,
  Trash2,
  Settings,
  MoreVertical,
  HardDrive,
  Activity,
  Terminal,
} from 'lucide-react'

const mockContainers = [
  {
    id: 'container-1',
    name: 'mcpilot-weather-api',
    image: 'mcpilot/weather-api:latest',
    status: 'running',
    created_at: '2024-01-15T10:30:00Z',
    ports: ['8000:8000'],
    stats: {
      cpu: '2.5%',
      memory: '256MB',
    },
  },
  {
    id: 'container-2',
    name: 'mcpilot-database',
    image: 'postgres:15-alpine',
    status: 'running',
    created_at: '2024-01-10T08:00:00Z',
    ports: ['5432:5432'],
    stats: {
      cpu: '5.2%',
      memory: '512MB',
    },
  },
  {
    id: 'container-3',
    name: 'mcpilot-cache',
    image: 'redis:7-alpine',
    status: 'exited',
    created_at: '2024-01-05T14:20:00Z',
    ports: ['6379:6379'],
    stats: {
      cpu: '0%',
      memory: '0MB',
    },
  },
]

export function AdminDocker() {
  const [search, setSearch] = useState('')

  const filteredContainers = mockContainers.filter((container) =>
    container.name.toLowerCase().includes(search.toLowerCase()) ||
    container.image.toLowerCase().includes(search.toLowerCase())
  )

  const handleAction = (action: string, name: string) => {
    toast.success(`${action} "${name}"`)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'text-green-600 bg-green-100'
      case 'exited':
        return 'text-gray-600 bg-gray-100'
      default:
        return 'text-yellow-600 bg-yellow-100'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Docker 管理</h1>
          <p className="text-gray-500 mt-1">管理服务容器和资源</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary">
            <RefreshCw className="h-4 w-4 mr-2" />
            刷新
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-blue-100 text-blue-600">
              <Cpu className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500">运行容器</p>
              <p className="text-2xl font-bold text-gray-900">
                {mockContainers.filter((c) => c.status === 'running').length}
              </p>
            </div>
          </div>
        </div>
        <div className="card p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-gray-100 text-gray-600">
              <HardDrive className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500">总容器</p>
              <p className="text-2xl font-bold text-gray-900">{mockContainers.length}</p>
            </div>
          </div>
        </div>
        <div className="card p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-green-100 text-green-600">
              <Activity className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500">总体资源</p>
              <p className="text-2xl font-bold text-gray-900">健康</p>
            </div>
          </div>
        </div>
      </div>

      <div className="relative">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Cpu className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="搜索容器..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10"
          />
        </div>
      </div>

      <div className="space-y-4">
        {filteredContainers.map((container, index) => (
          <motion.div
            key={container.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="card p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shrink-0">
                  <Terminal className="h-6 w-6 text-white" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900 truncate">{container.name}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(container.status)}`}>
                      {container.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 font-mono mt-1">{container.image}</p>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                    <span>端口: {container.ports.join(', ')}</span>
                    {container.status === 'running' && (
                      <>
                        <span>CPU: {container.stats.cpu}</span>
                        <span>内存: {container.stats.memory}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {container.status === 'exited' ? (
                  <button
                    onClick={() => handleAction('启动', container.name)}
                    className="btn-success py-2 text-sm"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    启动
                  </button>
                ) : (
                  <button
                    onClick={() => handleAction('停止', container.name)}
                    className="btn-secondary py-2 text-sm"
                  >
                    <Square className="h-4 w-4 mr-2" />
                    停止
                  </button>
                )}
                <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                  <Settings className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleAction('删除', container.name)}
                  className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {filteredContainers.length === 0 && (
        <div className="card p-12 text-center">
          <Terminal className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">没有找到容器</h3>
          <p className="text-gray-500">尝试调整搜索条件</p>
        </div>
      )}
    </div>
  )
}
