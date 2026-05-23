import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import {
  Cpu,
  Play,
  Square,
  RefreshCw,
  Trash2,
  Settings,
  HardDrive,
  Activity,
  Terminal,
} from 'lucide-react'
import { dockerApi } from '@/api/admin'
import { useI18n } from '@/i18n'

export function AdminDocker() {
  const [search, setSearch] = useState('')
  const queryClient = useQueryClient()
  const { t } = useI18n()

  const { data: containersData, isLoading, refetch } = useQuery({
    queryKey: ['admin', 'docker', 'containers'],
    queryFn: dockerApi.getContainers,
  })

  const containers = containersData?.containers ?? []

  const startMutation = useMutation({
    mutationFn: (containerId: string) => dockerApi.startContainer(containerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'docker'] })
      toast.success(t('admin.docker.started'))
    },
    onError: () => toast.error(t('admin.docker.startFailed')),
  })

  const stopMutation = useMutation({
    mutationFn: (containerId: string) => dockerApi.stopContainer(containerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'docker'] })
      toast.success(t('admin.docker.stopped'))
    },
    onError: () => toast.error(t('admin.docker.stopFailed')),
  })

  const removeMutation = useMutation({
    mutationFn: (containerId: string) => dockerApi.removeContainer(containerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'docker'] })
      toast.success(t('admin.docker.deleted'))
    },
    onError: () => toast.error(t('admin.docker.deleteFailed')),
  })

  const filteredContainers = containers.filter((container) =>
    container.name.toLowerCase().includes(search.toLowerCase()) ||
    container.image.toLowerCase().includes(search.toLowerCase())
  )

  const runningCount = containers.filter((container) => container.status === 'running').length

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
          <h1 className="text-2xl font-bold text-gray-900">{t('admin.docker.title')}</h1>
          <p className="text-gray-500 mt-1">{t('admin.docker.subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            {t('common.refresh')}
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
              <p className="text-sm text-gray-500">{t('admin.docker.runningContainers')}</p>
              <p className="text-2xl font-bold text-gray-900">{runningCount}</p>
            </div>
          </div>
        </div>
        <div className="card p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-gray-100 text-gray-600">
              <HardDrive className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500">{t('admin.docker.totalContainers')}</p>
              <p className="text-2xl font-bold text-gray-900">{containers.length}</p>
            </div>
          </div>
        </div>
        <div className="card p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-green-100 text-green-600">
              <Activity className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500">{t('admin.docker.overallResources')}</p>
              <p className="text-2xl font-bold text-gray-900">
                {isLoading ? '...' : t('admin.docker.healthy')}
              </p>
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
            placeholder={t('admin.docker.searchPlaceholder')}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="input pl-10"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="card p-12 text-center text-gray-500">{t('common.loading')}</div>
      ) : (
        <div className="space-y-4">
          {filteredContainers.map((container, index) => (
            <motion.div
              key={container.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
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
                      <span>ID: {container.id}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {container.status === 'exited' ? (
                    <button
                      onClick={() => startMutation.mutate(container.id)}
                      disabled={startMutation.isPending}
                      className="btn-success py-2 text-sm"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      {t('actions.start')}
                    </button>
                  ) : container.status === 'running' ? (
                    <button
                      onClick={() => stopMutation.mutate(container.id)}
                      disabled={stopMutation.isPending}
                      className="btn-secondary py-2 text-sm"
                    >
                      <Square className="h-4 w-4 mr-2" />
                      {t('actions.stop')}
                    </button>
                  ) : null}
                  <button
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                    aria-label={t('common.details')}
                  >
                    <Settings className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(t('admin.docker.confirmDelete', { name: container.name }))) {
                        removeMutation.mutate(container.id)
                      }
                    }}
                    disabled={removeMutation.isPending}
                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                    aria-label={t('common.delete')}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {!isLoading && filteredContainers.length === 0 && (
        <div className="card p-12 text-center">
          <Terminal className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">{t('admin.docker.emptyTitle')}</h3>
          <p className="text-gray-500">{t('common.searchEmpty')}</p>
        </div>
      )}
    </div>
  )
}
