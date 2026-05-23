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
import { alertsApi } from '@/api/admin'
import { useI18n } from '@/i18n'
import { formatRelativeTime } from '@/utils/formatters'

type AlertFilter = 'all' | 'active' | 'resolved'

export function AdminAlerts() {
  const [filter, setFilter] = useState<AlertFilter>('all')
  const queryClient = useQueryClient()
  const { locale, t } = useI18n()

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
      toast.success(t('admin.alerts.resolvedToast'))
    },
    onError: () => {
      toast.error(t('admin.alerts.operationFailed'))
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

  const emptyDescription =
    filter === 'active'
      ? t('admin.alerts.emptyActive')
      : filter === 'resolved'
        ? t('admin.alerts.emptyResolved')
        : t('admin.alerts.emptyAll')

  const filters: { key: AlertFilter; label: string }[] = [
    { key: 'all', label: t('admin.alerts.all') },
    { key: 'active', label: t('admin.alerts.active') },
    { key: 'resolved', label: t('admin.alerts.resolved') },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('admin.alerts.title')}</h1>
          <p className="text-gray-500 mt-1">{t('admin.alerts.subtitle')}</p>
        </div>
        <button className="btn-secondary">
          <Settings className="h-4 w-4 mr-2" />
          {t('admin.alerts.rules')}
        </button>
      </div>

      <div className="flex gap-2">
        {filters.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
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
        <div className="card p-12 text-center text-gray-500">{t('common.loading')}</div>
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
                            {t('status.resolved')}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                        {alert.service_name && (
                          <span>{t('admin.alerts.servicePrefix', { name: alert.service_name })}</span>
                        )}
                        {alert.created_at && (
                          <span>{formatRelativeTime(alert.created_at, locale)}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                        aria-label={t('common.viewDetails')}
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      {!alert.resolved && (
                        <button
                          onClick={() => resolveMutation.mutate(alert.id)}
                          disabled={resolveMutation.isPending}
                          className="btn-success py-2 text-sm"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          {t('admin.alerts.markResolved')}
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
          <h3 className="text-lg font-medium text-gray-900 mb-2">{t('admin.alerts.emptyTitle')}</h3>
          <p className="text-gray-500">{emptyDescription}</p>
        </div>
      )}
    </div>
  )
}
