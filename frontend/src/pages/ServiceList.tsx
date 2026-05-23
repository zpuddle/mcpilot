import { useState } from 'react'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { servicesApi } from '@/api/services'
import { CardSkeleton } from '@/components/common/Skeleton'
import { StatusBadge } from '@/components/common/StatusBadge'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import {
  Plus,
  Search,
  Cpu,
  Play,
  Square,
  Trash2,
  Eye,
  Edit,
} from 'lucide-react'
import { useI18n } from '@/i18n'
import { formatRelativeTime, truncate } from '@/utils/formatters'

export function ServiceList() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { t, locale } = useI18n()

  const { data: services, isLoading } = useQuery({
    queryKey: ['services'],
    queryFn: () => servicesApi.getServices(),
  })

  const startMutation = useMutation({
    mutationFn: (serviceId: number) => servicesApi.startService(serviceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] })
      toast.success(t('service.started'))
    },
  })

  const stopMutation = useMutation({
    mutationFn: (serviceId: number) => servicesApi.stopService(serviceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] })
      toast.success(t('service.stopped'))
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (serviceId: number) => servicesApi.deleteService(serviceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] })
      toast.success(t('service.deleted'))
    },
  })

  const filteredServices = services?.data?.filter((service) => {
    const matchesSearch = service.name.toLowerCase().includes(search.toLowerCase()) ||
      service.description.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'all' || service.status === statusFilter
    return matchesSearch && matchesStatus
  }) || []

  const handleAction = (e: React.MouseEvent, action: string, serviceId: number, serviceName: string) => {
    e.preventDefault()
    e.stopPropagation()
    if (action === 'start') {
      startMutation.mutate(serviceId)
    } else if (action === 'stop') {
      stopMutation.mutate(serviceId)
    } else if (action === 'delete') {
      if (window.confirm(t('service.confirmDelete', { name: serviceName }))) {
        deleteMutation.mutate(serviceId)
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('service.management')}</h1>
          <p className="text-gray-500 mt-1">{t('service.managementSubtitle')}</p>
        </div>
        <button onClick={() => navigate('/services/new')} className="btn-primary">
          <Plus className="h-4 w-4 mr-2" />
          {t('service.createService')}
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder={t('service.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input w-full sm:w-auto"
          >
            <option value="all">{t('service.allStatuses')}</option>
            <option value="draft">{t('status.draft')}</option>
            <option value="building">{t('status.building')}</option>
            <option value="running">{t('status.running')}</option>
            <option value="stopped">{t('status.stopped')}</option>
            <option value="error">{t('status.error')}</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : filteredServices.length === 0 ? (
        <div className="card p-12 text-center">
          <Cpu className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">{t('service.noServicesTitle')}</h3>
          <p className="text-gray-500 mb-6">
            {search || statusFilter !== 'all'
              ? t('service.noServicesFiltered')
              : t('service.noServicesEmpty')}
          </p>
          <button onClick={() => navigate('/services/new')} className="btn-primary">
            <Plus className="h-4 w-4 mr-2" />
            {t('service.createService')}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map((service, index) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="card p-6 hover:shadow-lg transition-all hover:-translate-y-1">
                <div className="flex items-start justify-between mb-4">
                  <div className="h-12 w-12 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center">
                    <Cpu className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => navigate(`/services/${service.id}`)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      title={t('common.viewDetails')}
                    >
                      <Eye className="h-4 w-4 text-gray-500" />
                    </button>
                    <button
                      onClick={() => navigate(`/services/${service.id}/edit`)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      title={t('nav.editService')}
                    >
                      <Edit className="h-4 w-4 text-gray-500" />
                    </button>
                  </div>
                </div>

                <h3 className="font-semibold text-gray-900 mb-1 truncate">{service.name}</h3>
                <p className="text-sm text-gray-500 mb-4 line-clamp-2">
                  {truncate(service.description, 60)}
                </p>

                <div className="flex items-center justify-between">
                  <StatusBadge status={service.status} />
                  <span className="text-xs text-gray-400">
                    {formatRelativeTime(service.updated_at, locale)}
                  </span>
                </div>

                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100">
                  {service.status === 'stopped' && (
                    <button
                      onClick={(e) => handleAction(e, 'start', service.id, service.name)}
                      className="flex-1 btn-secondary py-2 text-sm"
                      disabled={startMutation.isPending}
                    >
                      <Play className="h-4 w-4 mr-2" />
                      {t('actions.start')}
                    </button>
                  )}
                  {service.status === 'running' && (
                    <button
                      onClick={(e) => handleAction(e, 'stop', service.id, service.name)}
                      className="flex-1 btn-secondary py-2 text-sm"
                      disabled={stopMutation.isPending}
                    >
                      <Square className="h-4 w-4 mr-2" />
                      {t('actions.stop')}
                    </button>
                  )}
                  <button
                    onClick={(e) => handleAction(e, 'delete', service.id, service.name)}
                    className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
