import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import {
  Activity,
  ArrowLeft,
  Clock,
  Code2,
  Database,
  Edit,
  ExternalLink,
  HardDrive,
  History,
  Play,
  RotateCcw,
  Server,
  ShieldCheck,
  Square,
  Trash2,
} from 'lucide-react'
import { servicesApi } from '@/api/services'
import { StatusBadge } from '@/components/common/StatusBadge'
import { useI18n } from '@/i18n'
import { formatDate } from '@/utils/formatters'

export function ServiceDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { t, locale } = useI18n()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const serviceId = id ? parseInt(id) : 0

  const { data: service, isLoading: serviceLoading } = useQuery({
    queryKey: ['service', serviceId],
    queryFn: () => servicesApi.getService(serviceId),
    enabled: !!serviceId,
  })

  const { data: tools } = useQuery({
    queryKey: ['tools', serviceId],
    queryFn: () => servicesApi.getTools(serviceId),
    enabled: !!serviceId,
  })

  const { data: resources } = useQuery({
    queryKey: ['resources', serviceId],
    queryFn: () => servicesApi.getResources(serviceId),
    enabled: !!serviceId,
  })

  const startMutation = useMutation({
    mutationFn: (serviceId: number) => servicesApi.startService(serviceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service', serviceId] })
      queryClient.invalidateQueries({ queryKey: ['services'] })
      toast.success(t('service.started'))
    },
  })

  const stopMutation = useMutation({
    mutationFn: (serviceId: number) => servicesApi.stopService(serviceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service', serviceId] })
      queryClient.invalidateQueries({ queryKey: ['services'] })
      toast.success(t('service.stopped'))
    },
  })

  const restartMutation = useMutation({
    mutationFn: (serviceId: number) => servicesApi.restartService(serviceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service', serviceId] })
      queryClient.invalidateQueries({ queryKey: ['services'] })
      toast.success(t('service.restarted'))
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (serviceId: number) => servicesApi.deleteService(serviceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] })
      toast.success(t('service.deleted'))
      navigate('/services')
    },
  })

  const handleDelete = () => {
    if (service) {
      deleteMutation.mutate(serviceId)
    }
  }

  if (serviceLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 animate-pulse rounded-lg bg-gray-200" />
          <div className="space-y-2">
            <div className="h-8 w-48 animate-pulse rounded bg-gray-200" />
            <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="card p-6">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 animate-pulse rounded-lg bg-gray-200" />
                <div className="space-y-2">
                  <div className="h-4 w-20 animate-pulse rounded bg-gray-200" />
                  <div className="h-6 w-12 animate-pulse rounded bg-gray-200" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!service) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <h2 className="mb-2 text-xl font-semibold text-gray-900">{t('service.notFound')}</h2>
          <button onClick={() => navigate('/services')} className="btn-primary mt-4">
            {t('common.backToServices')}
          </button>
        </div>
      </div>
    )
  }

  const stats = [
    { label: t('service.cpuUsage'), value: '12%', icon: Activity, color: 'text-blue-600 bg-blue-100' },
    { label: t('service.memoryUsage'), value: '256MB', icon: HardDrive, color: 'text-green-600 bg-green-100' },
    { label: t('service.uptime'), value: t('service.uptimeValue'), icon: Clock, color: 'text-purple-600 bg-purple-100' },
    { label: t('service.version'), value: `v${service.current_version}`, icon: ShieldCheck, color: 'text-orange-600 bg-orange-100' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/services')} className="btn-ghost p-2">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{service.name}</h1>
            <StatusBadge status={service.status} />
          </div>
          <p className="mt-1 text-gray-500">{service.description}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button onClick={() => navigate(`/services/${serviceId}/edit`)} className="btn-primary gap-2">
          <Edit className="h-4 w-4" />
          {t('nav.editService')}
        </button>
        {service.status === 'stopped' && (
          <button
            onClick={() => startMutation.mutate(serviceId)}
            className="btn-success gap-2"
            disabled={startMutation.isPending}
          >
            <Play className="h-4 w-4" />
            {t('actions.start')}
          </button>
        )}
        {service.status === 'running' && (
          <>
            <button
              onClick={() => stopMutation.mutate(serviceId)}
              className="btn-secondary gap-2"
              disabled={stopMutation.isPending}
            >
              <Square className="h-4 w-4" />
              {t('actions.stop')}
            </button>
            <button
              onClick={() => restartMutation.mutate(serviceId)}
              className="btn-secondary gap-2"
              disabled={restartMutation.isPending}
            >
              <RotateCcw className="h-4 w-4" />
              {t('actions.restart')}
            </button>
          </>
        )}
        <button onClick={() => setShowDeleteConfirm(true)} className="btn-danger gap-2">
          <Trash2 className="h-4 w-4" />
          {t('common.delete')}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="card p-6"
            >
              <div className="flex items-center gap-4">
                <div className={`rounded-lg p-3 ${stat.color}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="card"
        >
          <div className="border-b border-gray-200 p-6">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
              <Server className="h-5 w-5" />
              {t('service.info')}
            </h2>
          </div>
          <div className="space-y-4 p-6">
            <div className="flex justify-between">
              <span className="text-gray-500">ID</span>
              <span className="font-mono text-gray-900">{service.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">{t('service.transportProtocol')}</span>
              <span className="text-gray-900">{service.transport_type.toUpperCase()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">{t('service.port')}</span>
              <span className="text-gray-900">{service.port ?? t('common.notAvailable')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">{t('service.currentVersion')}</span>
              <span className="text-gray-900">{service.current_version}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">{t('service.owner')}</span>
              <span className="text-gray-900">{service.owner_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">{t('service.createdAt')}</span>
              <span className="text-gray-900">{formatDate(service.created_at, locale)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">{t('service.updatedAt')}</span>
              <span className="text-gray-900">{formatDate(service.updated_at, locale)}</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="card"
        >
          <div className="border-b border-gray-200 p-6">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
              <Database className="h-5 w-5" />
              {t('service.envVars')}
            </h2>
          </div>
          <div className="p-6">
            {service.env_vars && Object.keys(service.env_vars).length > 0 ? (
              <div className="space-y-2">
                {Object.entries(service.env_vars).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
                    <span className="font-medium text-gray-700">{key}</span>
                    <span className="font-mono text-sm text-gray-500">
                      {typeof value === 'string' && value.length > 20 ? `${value.slice(0, 20)}...` : String(value)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-4 text-center text-gray-500">{t('service.noEnvVars')}</p>
            )}
          </div>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="card">
        <div className="flex items-center justify-between border-b border-gray-200 p-6">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
            <Code2 className="h-5 w-5" />
            {t('service.toolsTitle')}
          </h2>
          <button
            onClick={() => navigate(`/services/${serviceId}/tools`)}
            className="flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700"
          >
            {t('service.manageTools')}
            <ExternalLink className="h-3 w-3" />
          </button>
        </div>
        <div className="p-6">
          {tools && tools.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {tools.map((tool) => (
                <div key={tool.id} className="rounded-lg border border-gray-200 p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="font-medium text-gray-900">{tool.name}</h3>
                    <span className={`rounded px-2 py-1 text-xs ${tool.is_enabled ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                      {tool.is_enabled ? t('status.enabled') : t('status.disabled')}
                    </span>
                  </div>
                  <p className="mb-2 text-sm text-gray-500">{tool.description}</p>
                  <p className="font-mono text-xs text-gray-400">Handler: {tool.handler_name}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-4 text-center text-gray-500">{t('service.noToolsConfigured')}</p>
          )}
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="card">
        <div className="flex items-center justify-between border-b border-gray-200 p-6">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
            <Activity className="h-5 w-5" />
            {t('service.resourcesTitle')}
          </h2>
          <button
            onClick={() => navigate(`/services/${serviceId}/resources`)}
            className="flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700"
          >
            {t('service.manageResources')}
            <ExternalLink className="h-3 w-3" />
          </button>
        </div>
        <div className="p-6">
          {resources && resources.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {resources.map((resource) => (
                <div key={resource.id} className="rounded-lg border border-gray-200 p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="font-medium text-gray-900">{resource.name}</h3>
                    <span className={`rounded px-2 py-1 text-xs ${resource.is_enabled ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                      {resource.is_enabled ? t('status.enabled') : t('status.disabled')}
                    </span>
                  </div>
                  <p className="mb-2 text-sm text-gray-500">{resource.description}</p>
                  <div className="space-y-1 text-xs text-gray-400">
                    <p className="font-mono">URI: {resource.uri_template}</p>
                    <p>MIME: {resource.mime_type}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-4 text-center text-gray-500">{t('service.noResourcesConfigured')}</p>
          )}
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="card">
        <div className="flex items-center justify-between border-b border-gray-200 p-6">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
            <History className="h-5 w-5" />
            {t('versions.title')}
          </h2>
          <button
            onClick={() => navigate(`/services/${serviceId}/versions`)}
            className="flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700"
          >
            {t('service.viewAllVersions')}
            <ExternalLink className="h-3 w-3" />
          </button>
        </div>
        <div className="p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-primary-100">
              <History className="h-7 w-7 text-primary-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">{t('service.currentVersion')}</p>
              <p className="text-2xl font-bold text-gray-900">v{service.current_version}</p>
            </div>
          </div>
          <div className="mt-4 border-t border-gray-100 pt-4">
            <button onClick={() => navigate(`/services/${serviceId}/versions`)} className="btn-secondary w-full">
              {t('service.manageVersionsAndRollback')}
            </button>
          </div>
        </div>
      </motion.div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6">
            <h3 className="mb-2 text-lg font-semibold text-gray-900">{t('service.deleteConfirmTitle')}</h3>
            <p className="mb-6 text-gray-500">
              {t('service.deleteConfirmDescription', { name: service.name })}
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="btn-secondary"
                disabled={deleteMutation.isPending}
              >
                {t('common.cancel')}
              </button>
              <button onClick={handleDelete} className="btn-danger" disabled={deleteMutation.isPending}>
                {deleteMutation.isPending ? t('common.deleting') : t('common.delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
