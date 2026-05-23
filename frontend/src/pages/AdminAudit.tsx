import { useMemo, useState, type ReactNode } from 'react'
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
  X,
  Filter,
  RotateCcw,
  Hash,
} from 'lucide-react'
import { auditApi } from '@/api/admin'
import { useI18n, type TranslationKey } from '@/i18n'
import type { AuditLog } from '@/types'
import { formatDate } from '@/utils/formatters'

const PAGE_SIZE = 20
const ALL_FILTERS = 'all'

const actionColors: Record<string, string> = {
  create: 'bg-green-100 text-green-700 border-green-200',
  update: 'bg-blue-100 text-blue-700 border-blue-200',
  delete: 'bg-red-100 text-red-700 border-red-200',
  deploy: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  start: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  stop: 'bg-amber-100 text-amber-700 border-amber-200',
  restart: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  login: 'bg-purple-100 text-purple-700 border-purple-200',
  unknown: 'bg-slate-100 text-slate-700 border-slate-200',
  POST: 'bg-green-100 text-green-700 border-green-200',
  PUT: 'bg-blue-100 text-blue-700 border-blue-200',
  DELETE: 'bg-red-100 text-red-700 border-red-200',
  GET: 'bg-gray-100 text-gray-700 border-gray-200',
}

const actionLabelKeys: Record<string, TranslationKey> = {
  create: 'admin.audit.actionCreate',
  update: 'admin.audit.actionUpdate',
  delete: 'admin.audit.actionDelete',
  deploy: 'admin.audit.actionDeploy',
  start: 'admin.audit.actionStart',
  stop: 'admin.audit.actionStop',
  restart: 'admin.audit.actionRestart',
  login: 'admin.audit.actionLogin',
  unknown: 'admin.audit.actionUnknown',
}

const resourceLabelKeys: Record<string, TranslationKey> = {
  auth: 'admin.audit.resourceAuth',
  service: 'admin.audit.resourceService',
  user: 'admin.audit.resourceUser',
  role: 'admin.audit.resourceRole',
  template: 'admin.audit.resourceTemplate',
  unknown: 'admin.audit.resourceUnknown',
}

const actionOptions = [
  ALL_FILTERS,
  'create',
  'update',
  'delete',
  'deploy',
  'start',
  'stop',
  'restart',
  'login',
  'unknown',
] as const

const resourceOptions = [
  ALL_FILTERS,
  'auth',
  'service',
  'user',
  'role',
  'template',
  'unknown',
] as const

function normalizeAction(action: string) {
  return action.includes('.') ? action.split('.').pop() || action : action
}

function formatDetail(detail: AuditLog['detail']) {
  if (!detail) {
    return ''
  }

  if (typeof detail !== 'string') {
    return JSON.stringify(detail, null, 2)
  }

  try {
    return JSON.stringify(JSON.parse(detail), null, 2)
  } catch {
    return detail
  }
}

function DetailField({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
      <p className="text-xs font-medium uppercase text-slate-500">{label}</p>
      <div className="mt-1 text-sm text-slate-900 break-words">{value}</div>
    </div>
  )
}

export function AdminAudit() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [actionFilter, setActionFilter] = useState(ALL_FILTERS)
  const [resourceFilter, setResourceFilter] = useState(ALL_FILTERS)
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)
  const { locale, t } = useI18n()

  const queryParams = {
    page,
    size: PAGE_SIZE,
    action: actionFilter === ALL_FILTERS ? undefined : actionFilter,
    resource_type: resourceFilter === ALL_FILTERS ? undefined : resourceFilter,
  }

  const { data: logsData, isLoading, isFetching } = useQuery({
    queryKey: ['admin', 'audit-logs', queryParams],
    queryFn: () => auditApi.getLogs(queryParams),
  })

  const logs = logsData?.data ?? []
  const total = logsData?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const getActionLabel = (action: string) => {
    const normalized = normalizeAction(action)
    const key = actionLabelKeys[normalized]
    return key ? t(key) : action
  }

  const getResourceLabel = (resourceType: string) => {
    const key = resourceLabelKeys[resourceType]
    return key ? t(key) : resourceType
  }

  const filteredLogs = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()
    if (!normalizedSearch) {
      return logs
    }

    return logs.filter((log) =>
      [
        log.action,
        getActionLabel(log.action),
        log.username,
        log.resource_type,
        getResourceLabel(log.resource_type),
        log.resource_name,
        log.ip_address,
        log.detail,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalizedSearch))
    )
  }, [logs, search, t])

  const activeFilterCount = [
    search.trim(),
    actionFilter !== ALL_FILTERS,
    resourceFilter !== ALL_FILTERS,
  ].filter(Boolean).length

  const hasServerFilters =
    actionFilter !== ALL_FILTERS || resourceFilter !== ALL_FILTERS

  const clearFilters = () => {
    setSearch('')
    setActionFilter(ALL_FILTERS)
    setResourceFilter(ALL_FILTERS)
    setPage(1)
  }

  const handleExport = async () => {
    try {
      const blob = await auditApi.exportLogs({
        action: actionFilter === ALL_FILTERS ? undefined : actionFilter,
        resource_type: resourceFilter === ALL_FILTERS ? undefined : resourceFilter,
      })
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
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('admin.audit.title')}</h1>
          <p className="text-gray-500 mt-1">{t('admin.audit.subtitle')}</p>
        </div>
        <button className="btn-secondary w-full sm:w-auto" onClick={handleExport}>
          <Download className="h-4 w-4 mr-2" />
          {hasServerFilters ? t('admin.audit.exportFiltered') : t('admin.audit.exportLogs')}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">{t('admin.audit.totalRecords')}</p>
            <Hash className="h-4 w-4 text-slate-400" />
          </div>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{total}</p>
        </div>
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">{t('admin.audit.visibleRecords')}</p>
            <Activity className="h-4 w-4 text-slate-400" />
          </div>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{filteredLogs.length}</p>
        </div>
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">{t('admin.audit.activeFilters')}</p>
            <Filter className="h-4 w-4 text-slate-400" />
          </div>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{activeFilterCount}</p>
        </div>
      </div>

      <div className="card p-4">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_180px_180px_auto]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder={t('admin.audit.searchPlaceholder')}
              value={search}
              onChange={(event) => {
                setSearch(event.target.value)
                setPage(1)
              }}
              className="input pl-10"
            />
          </div>
          <select
            value={actionFilter}
            onChange={(event) => {
              setActionFilter(event.target.value)
              setPage(1)
            }}
            className="input"
            aria-label={t('admin.audit.filterAction')}
          >
            {actionOptions.map((action) => (
              <option key={action} value={action}>
                {action === ALL_FILTERS ? t('admin.audit.allActions') : getActionLabel(action)}
              </option>
            ))}
          </select>
          <select
            value={resourceFilter}
            onChange={(event) => {
              setResourceFilter(event.target.value)
              setPage(1)
            }}
            className="input"
            aria-label={t('admin.audit.filterResource')}
          >
            {resourceOptions.map((resource) => (
              <option key={resource} value={resource}>
                {resource === ALL_FILTERS
                  ? t('admin.audit.allResources')
                  : getResourceLabel(resource)}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={clearFilters}
            disabled={activeFilterCount === 0}
            className="btn-secondary whitespace-nowrap"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            {t('admin.audit.clearFilters')}
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="card p-12 text-center text-gray-500">{t('common.loading')}</div>
      ) : filteredLogs.length > 0 ? (
        <div className="card overflow-hidden">
          <div className="border-b border-slate-200 bg-slate-50 px-5 py-3">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-medium text-slate-700">
                {t('admin.audit.pagination', { total, page })}
              </p>
              <p className="text-xs text-slate-500">
                {isFetching
                  ? t('common.loading')
                  : t('admin.audit.pageSummary', { page, pages: totalPages })}
              </p>
            </div>
          </div>
          <div className="divide-y divide-gray-200">
            {filteredLogs.map((log, index) => {
              const normalizedAction = normalizeAction(log.action)
              const detailText = formatDetail(log.detail)

              return (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="p-4 hover:bg-gray-50 sm:p-5"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex min-w-0 gap-4">
                      <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                        <Activity className="h-5 w-5 text-slate-500" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                            actionColors[normalizedAction] || actionColors.unknown
                          }`}>
                            {getActionLabel(log.action)}
                          </span>
                          <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-xs font-medium text-slate-600">
                            {getResourceLabel(log.resource_type)}
                          </span>
                          <span className="text-sm text-slate-500">#{log.id}</span>
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
                          <span className="flex items-center gap-1">
                            <User className="h-3.5 w-3.5" />
                            {log.username}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {log.created_at ? formatDate(log.created_at, locale) : '-'}
                          </span>
                        </div>
                        <div className="mt-3 grid grid-cols-1 gap-2 text-sm sm:grid-cols-3">
                          <div className="min-w-0">
                            <p className="text-xs text-slate-500">{t('admin.audit.filterResource')}</p>
                            <p className="truncate font-medium text-slate-900">
                              {getResourceLabel(log.resource_type)}
                              {log.resource_id ? ` #${log.resource_id}` : ''}
                            </p>
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs text-slate-500">{t('admin.audit.resourceName')}</p>
                            <p className="truncate font-medium text-slate-900">
                              {log.resource_name || t('common.notAvailable')}
                            </p>
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs text-slate-500">{t('admin.audit.ipAddress')}</p>
                            <p className="truncate font-mono text-slate-900">
                              {log.ip_address || t('common.notAvailable')}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <button
                      className="btn-secondary py-2 text-sm lg:shrink-0"
                      onClick={() => setSelectedLog(log)}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      {detailText ? t('admin.audit.viewDetails') : t('common.details')}
                    </button>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      ) : null}

      {total > PAGE_SIZE && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-gray-500">
            {t('admin.audit.pageSummary', { page, pages: totalPages })}
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
              disabled={page >= totalPages}
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

      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-white shadow-xl">
            <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white p-5">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">{t('admin.audit.logDetails')}</h2>
                <p className="mt-1 text-sm text-slate-500">
                  {selectedLog.created_at ? formatDate(selectedLog.created_at, locale) : '-'}
                </p>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                aria-label={t('common.close')}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-5 p-5">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <DetailField label={t('admin.audit.recordId')} value={`#${selectedLog.id}`} />
                <DetailField label={t('admin.audit.action')} value={getActionLabel(selectedLog.action)} />
                <DetailField label={t('admin.audit.user')} value={selectedLog.username} />
                <DetailField
                  label={t('admin.audit.filterResource')}
                  value={getResourceLabel(selectedLog.resource_type)}
                />
                <DetailField
                  label={t('admin.audit.resourceName')}
                  value={selectedLog.resource_name || t('common.notAvailable')}
                />
                <DetailField
                  label={t('admin.audit.ipAddress')}
                  value={selectedLog.ip_address || t('common.notAvailable')}
                />
              </div>

              <div>
                <h3 className="mb-2 text-sm font-medium text-slate-700">{t('admin.audit.rawDetail')}</h3>
                {formatDetail(selectedLog.detail) ? (
                  <pre className="max-h-80 overflow-auto rounded-lg bg-slate-950 p-4 text-sm text-slate-100">
                    {formatDetail(selectedLog.detail)}
                  </pre>
                ) : (
                  <div className="rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-500">
                    {t('admin.audit.noDetail')}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
