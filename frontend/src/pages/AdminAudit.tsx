import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import {
  Search,
  Clock,
  User,
  Activity,
  Download,
  FileText,
} from 'lucide-react'
import { auditApi } from '@/api/admin'
import { useI18n } from '@/i18n'
import { formatDate } from '@/utils/formatters'

const actionColors: Record<string, string> = {
  'service.create': 'bg-green-100 text-green-700',
  'service.start': 'bg-blue-100 text-blue-700',
  'service.stop': 'bg-yellow-100 text-yellow-700',
  'service.deploy': 'bg-indigo-100 text-indigo-700',
  'service.delete': 'bg-red-100 text-red-700',
  'user.login': 'bg-purple-100 text-purple-700',
  'user.create': 'bg-indigo-100 text-indigo-700',
  POST: 'bg-green-100 text-green-700',
  PUT: 'bg-blue-100 text-blue-700',
  DELETE: 'bg-red-100 text-red-700',
  GET: 'bg-gray-100 text-gray-700',
}

export function AdminAudit() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const { locale, t } = useI18n()

  const { data: logsData, isLoading } = useQuery({
    queryKey: ['admin', 'audit-logs', page],
    queryFn: () => auditApi.getLogs({ page, size: 20 }),
  })

  const logs = logsData?.data ?? []
  const total = logsData?.total ?? 0

  const filteredLogs = logs.filter((log) =>
    log.action.toLowerCase().includes(search.toLowerCase()) ||
    log.username.toLowerCase().includes(search.toLowerCase()) ||
    log.resource_type.toLowerCase().includes(search.toLowerCase())
  )

  const handleExport = async () => {
    try {
      const blob = await auditApi.exportLogs()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'audit_logs.csv'
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success(t('admin.audit.exported'))
    } catch {
      toast.error(t('admin.audit.exportFailed'))
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('admin.audit.title')}</h1>
          <p className="text-gray-500 mt-1">{t('admin.audit.subtitle')}</p>
        </div>
        <button className="btn-secondary" onClick={handleExport}>
          <Download className="h-4 w-4 mr-2" />
          {t('admin.audit.exportLogs')}
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder={t('admin.audit.searchPlaceholder')}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="input pl-10"
        />
      </div>

      {isLoading ? (
        <div className="card p-12 text-center text-gray-500">{t('common.loading')}</div>
      ) : (
        <div className="card">
          <div className="divide-y divide-gray-200">
            {filteredLogs.map((log, index) => (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
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
                        {log.created_at ? formatDate(log.created_at, locale) : ''}
                      </span>
                    </div>
                    <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">{t('admin.audit.resource')} </span>
                        <span className="text-gray-900 font-medium">{log.resource_type}</span>
                        {log.resource_id && <span className="text-gray-500"> #{log.resource_id}</span>}
                      </div>
                      <div>
                        <span className="text-gray-500">IP: </span>
                        <span className="text-gray-900 font-mono">{log.ip_address || '-'}</span>
                      </div>
                      {log.resource_name && (
                        <div className="md:text-right">
                          <span className="text-gray-500">{t('admin.audit.name')} </span>
                          <span className="text-gray-600">{log.resource_name}</span>
                        </div>
                      )}
                    </div>
                    {log.detail && (
                      <div className="mt-3">
                        <details className="group">
                          <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700 flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            {t('admin.audit.viewDetails')}
                          </summary>
                          <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                            <pre className="text-sm text-gray-700 overflow-x-auto">
                              {typeof log.detail === 'string' ? log.detail : JSON.stringify(log.detail, null, 2)}
                            </pre>
                          </div>
                        </details>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {total > 20 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            {t('admin.audit.pagination', { total, page })}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((currentPage) => Math.max(1, currentPage - 1))}
              disabled={page <= 1}
              className="btn-secondary py-2 text-sm disabled:opacity-50"
            >
              {t('common.previousPage')}
            </button>
            <button
              onClick={() => setPage((currentPage) => currentPage + 1)}
              disabled={page * 20 >= total}
              className="btn-secondary py-2 text-sm disabled:opacity-50"
            >
              {t('common.nextPage')}
            </button>
          </div>
        </div>
      )}

      {!isLoading && filteredLogs.length === 0 && (
        <div className="card p-12 text-center">
          <Activity className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">{t('admin.audit.emptyTitle')}</h3>
          <p className="text-gray-500">{t('common.searchEmpty')}</p>
        </div>
      )}
    </div>
  )
}
