import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Search,
  Clock,
  User,
  Activity,
  Filter,
  Download,
  FileText,
} from 'lucide-react'
import { formatDate } from '@/utils/formatters'

const mockAuditLogs = [
  {
    id: 1,
    action: 'service.create',
    username: 'admin',
    resource_type: 'service',
    resource_id: 1,
    details: { name: 'Weather API', image: 'mcpilot/weather-api:latest' },
    ip_address: '192.168.1.100',
    user_agent: 'Chrome/120.0',
    created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    id: 2,
    action: 'service.start',
    username: 'user1',
    resource_type: 'service',
    resource_id: 1,
    details: { status: 'running' },
    ip_address: '192.168.1.101',
    user_agent: 'Firefox/121.0',
    created_at: new Date(Date.now() - 3600000 * 3).toISOString(),
  },
  {
    id: 3,
    action: 'user.login',
    username: 'admin',
    resource_type: 'user',
    resource_id: 1,
    details: { success: true },
    ip_address: '192.168.1.100',
    user_agent: 'Chrome/120.0',
    created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
  {
    id: 4,
    action: 'service.stop',
    username: 'admin',
    resource_type: 'service',
    resource_id: 3,
    details: { name: 'Cache Service' },
    ip_address: '192.168.1.100',
    user_agent: 'Safari/17.0',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 5,
    action: 'user.create',
    username: 'admin',
    resource_type: 'user',
    resource_id: 3,
    details: { username: 'user2', email: 'user2@example.com' },
    ip_address: '192.168.1.100',
    user_agent: 'Chrome/120.0',
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
]

const actionColors: Record<string, string> = {
  'service.create': 'bg-green-100 text-green-700',
  'service.start': 'bg-blue-100 text-blue-700',
  'service.stop': 'bg-yellow-100 text-yellow-700',
  'user.login': 'bg-purple-100 text-purple-700',
  'user.create': 'bg-indigo-100 text-indigo-700',
}

export function AdminAudit() {
  const [search, setSearch] = useState('')

  const filteredLogs = mockAuditLogs.filter((log) =>
    log.action.toLowerCase().includes(search.toLowerCase()) ||
    log.username.toLowerCase().includes(search.toLowerCase()) ||
    log.resource_type.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">审计日志</h1>
          <p className="text-gray-500 mt-1">查看系统操作历史记录</p>
        </div>
        <button className="btn-secondary">
          <Download className="h-4 w-4 mr-2" />
          导出日志
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="搜索操作、用户或资源..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input pl-10"
        />
      </div>

      <div className="card">
        <div className="divide-y divide-gray-200">
          {filteredLogs.map((log, index) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-6 hover:bg-gray-50"
            >
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0 mt-0.5">
                  <Activity className="h-5 w-5 text-gray-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        actionColors[log.action] || 'bg-gray-100 text-gray-700'
                      }`}>
                        {log.action}
                      </span>
                      <span className="text-sm text-gray-500 flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {log.username}
                      </span>
                    </div>
                    <span className="text-sm text-gray-500 flex items-center gap-1 shrink-0">
                      <Clock className="h-3 w-3" />
                      {formatDate(log.created_at)}
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">资源: </span>
                      <span className="text-gray-900 font-medium">{log.resource_type}</span>
                      <span className="text-gray-500"> #{log.resource_id}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">IP: </span>
                      <span className="text-gray-900 font-mono">{log.ip_address}</span>
                    </div>
                    <div className="md:text-right">
                      <span className="text-gray-500">UA: </span>
                      <span className="text-gray-600">{log.user_agent}</span>
                    </div>
                  </div>
                  <div className="mt-3">
                    <details className="group">
                      <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700 flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        查看详情
                      </summary>
                      <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                        <pre className="text-sm text-gray-700 overflow-x-auto">
                          {JSON.stringify(log.details, null, 2)}
                        </pre>
                      </div>
                    </details>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {filteredLogs.length === 0 && (
        <div className="card p-12 text-center">
          <Activity className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">没有找到日志</h3>
          <p className="text-gray-500">尝试调整搜索条件</p>
        </div>
      )}
    </div>
  )
}
