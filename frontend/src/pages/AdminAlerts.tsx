import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import {
  Bell,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Settings,
  Eye,
} from 'lucide-react'
import { formatRelativeTime } from '@/utils/formatters'
import { alertsApi } from '@/api/admin'

export function AdminAlerts() {
  const [filter, setFilter] = useState<'all' | 'active' | 'resolved'>('all')
  const queryClient = useQueryClient()

  const resolvedParam = filter === 'active' ? false : filter === 'resolved' ? true : undefined

  const { data: alertsData, isLoading } = useQuery({
    queryKey: ['admin', 'alerts', filter],
    queryFn: () => alertsApi.getAlerts({ resolved: resolvedParam, page_size: 50 }),
  })

  const alerts = alertsData?.alerts ?? []

  const resolveMutation = useMutation({
    mutationFn: (alertId: number) => alertsApi.resolveAlert(alertId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'alerts'] })
      toast.success('告警已标记为已解决')
    },
    onError: () => {
      toast.error('操作失败')
    },
  })

  const getAlertIcon = (alertType: string) => {
    if (alertType.includes('down') || alertType.includes('cpu_high')) {
      return <XCircle className="h-6 w-6 text-red-500" />
    }
    if (alertType.includes('memory') || alertType.includes('restart')) {
      return <AlertTriangle className="h-6 w-6 text-yellow-500" />
    }
    return <Bell className="h-6 w-6 text-blue-500" />
  }

  const getAlertColor = (alertType: string) => {
    if (alertType.includes('down') || alertType.includes('cpu_high')) {
      return 'border-red-200 bg-red-50'
    }
    if (alertType.includes('memory') || alertType.includes('restart')) {
      return 'border-yellow-200 bg-yellow-50'
    }
    return 'border-blue-200 bg-blue-50'
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

      {isLoading ? (
        <div className="card p-12 text-center text-gray-500">加载中...</div>
      ) : (
        <div className="space-y-4">
          {alerts.map((alert, index) => (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`card p-6 border-l-4 ${getAlertColor(alert.alert_type)} ${
                alert.resolved ? 'opacity-60' : ''
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="shrink-0 mt-1">
                  {getAlertIcon(alert.alert_type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900">{alert.alert_type}</h3>
                        {alert.resolved && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            已解决
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                        {alert.service_name && <span>服务: {alert.service_name}</span>}
                        {alert.created_at && <span>{formatRelativeTime(alert.created_at)}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                        <Eye className="h-4 w-4" />
                      </button>
                      {!alert.resolved && (
                        <button
                          onClick={() => resolveMutation.mutate(alert.id)}
                          disabled={resolveMutation.isPending}
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
      )}

      {!isLoading && alerts.length === 0 && (
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
