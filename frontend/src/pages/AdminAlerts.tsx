import { useState } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import {
  Bell,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Search,
  Settings,
  MoreVertical,
  Eye,
} from 'lucide-react'
import { formatRelativeTime } from '@/utils/formatters'

const mockAlerts = [
  {
    id: 1,
    title: 'Weather API 服务异常',
    message: '服务响应时间超出阈值 5000ms',
    level: 'critical',
    service_name: 'Weather API',
    is_resolved: false,
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 2,
    title: '数据库连接数警告',
    message: '当前连接数达到 80% 上限',
    level: 'warning',
    service_name: 'Database Service',
    is_resolved: true,
    created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    id: 3,
    title: '缓存服务已恢复',
    message: 'Cache Service 已成功重启',
    level: 'info',
    service_name: 'Cache Service',
    is_resolved: true,
    created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
]

export function AdminAlerts() {
  const [filter, setFilter] = useState<'all' | 'active' | 'resolved'>('all')

  const filteredAlerts = mockAlerts.filter((alert) => {
    if (filter === 'active') return !alert.is_resolved
    if (filter === 'resolved') return alert.is_resolved
    return true
  })

  const getAlertIcon = (level: string) => {
    switch (level) {
      case 'critical':
        return <XCircle className="h-6 w-6 text-red-500" />
      case 'warning':
        return <AlertTriangle className="h-6 w-6 text-yellow-500" />
      default:
        return <Bell className="h-6 w-6 text-blue-500" />
    }
  }

  const getAlertColor = (level: string) => {
    switch (level) {
      case 'critical':
        return 'border-red-200 bg-red-50'
      case 'warning':
        return 'border-yellow-200 bg-yellow-50'
      default:
        return 'border-blue-200 bg-blue-50'
    }
  }

  const handleResolve = (id: number, title: string) => {
    toast.success(`已解决: "${title}"`)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">告警管理</h1>
          <p className="text-gray-500 mt-1">监控和管理系统告警</p>
        </div>
        <button className="btn-secondary">
          <Settings className="h-4 w-4 mr-2" />
          告警规则
        </button>
      </div>

      <div className="flex gap-2">
        {[
          { key: 'all', label: '全部' },
          { key: 'active', label: '未解决' },
          { key: 'resolved', label: '已解决' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key as any)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filter === key
                ? 'bg-primary-100 text-primary-700'
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filteredAlerts.map((alert, index) => (
          <motion.div
            key={alert.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`card p-6 border-l-4 ${getAlertColor(alert.level)} ${
              alert.is_resolved ? 'opacity-60' : ''
            }`}
          >
            <div className="flex items-start gap-4">
              <div className="shrink-0 mt-1">
                {getAlertIcon(alert.level)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">{alert.title}</h3>
                      {alert.is_resolved && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          已解决
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                      <span>服务: {alert.service_name}</span>
                      <span>{formatRelativeTime(alert.created_at)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                      <Eye className="h-4 w-4" />
                    </button>
                    {!alert.is_resolved && (
                      <button
                        onClick={() => handleResolve(alert.id, alert.title)}
                        className="btn-success py-2 text-sm"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        标记解决
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {filteredAlerts.length === 0 && (
        <div className="card p-12 text-center">
          <Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">没有告警</h3>
          <p className="text-gray-500">
            {filter === 'active'
              ? '太棒了！没有未解决的告警'
              : filter === 'resolved'
              ? '还没有已解决的告警记录'
              : '一切运行正常！'}
          </p>
        </div>
      )}
    </div>
  )
}
