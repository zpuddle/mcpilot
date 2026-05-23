import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import {
  ArrowLeft,
  Plus,
  History,
  RotateCcw,
  Eye,
  Code,
  Calendar,
  X,
} from 'lucide-react'
import { servicesApi } from '@/api/services'
import { useI18n } from '@/i18n'
import { formatDate } from '@/utils/formatters'

export function ServiceVersions() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { locale, t } = useI18n()
  const serviceId = id ? parseInt(id) : 0
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showVersionDetail, setShowVersionDetail] = useState<number | null>(null)
  const [changelog, setChangelog] = useState('')

  const { data: service, isLoading: serviceLoading } = useQuery({
    queryKey: ['service', serviceId],
    queryFn: () => servicesApi.getService(serviceId),
    enabled: !!serviceId,
  })

  const { data: versions, isLoading: versionsLoading } = useQuery({
    queryKey: ['versions', serviceId],
    queryFn: () => servicesApi.getVersions(serviceId),
    enabled: !!serviceId,
  })

  const { data: selectedVersion } = useQuery({
    queryKey: ['version', serviceId, showVersionDetail],
    queryFn: () => servicesApi.getVersion(serviceId, showVersionDetail!),
    enabled: !!serviceId && !!showVersionDetail,
  })

  const createVersionMutation = useMutation({
    mutationFn: (versionChangelog: string) =>
      servicesApi.createVersion(serviceId, versionChangelog),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['versions', serviceId] })
      toast.success(t('versions.created'))
      setShowCreateModal(false)
      setChangelog('')
    },
    onError: (error) => {
      toast.error(t('versions.createFailed'))
      console.error(error)
    },
  })

  const rollbackMutation = useMutation({
    mutationFn: (versionId: number) => servicesApi.rollbackToVersion(serviceId, versionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service', serviceId] })
      toast.success(t('versions.rollbackSuccess'))
      setShowVersionDetail(null)
    },
    onError: (error) => {
      toast.error(t('versions.rollbackFailed'))
      console.error(error)
    },
  })

  const handleRollback = (versionId: number, versionTag: string) => {
    if (window.confirm(t('versions.confirmRollback', { version: versionTag }))) {
      rollbackMutation.mutate(versionId)
    }
  }

  if (serviceLoading || versionsLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse"></div>
          <div className="space-y-2">
            <div className="w-48 h-8 bg-gray-200 rounded animate-pulse"></div>
            <div className="w-32 h-4 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!service) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">{t('service.notFound')}</h2>
          <button onClick={() => navigate('/services')} className="btn-primary mt-4">
            {t('common.backToServices')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(`/services/${serviceId}`)} className="btn-ghost p-2">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('versions.title')}</h1>
            <p className="text-gray-500 mt-1">{service.name}</p>
          </div>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="btn-primary">
          <Plus className="h-4 w-4 mr-2" />
          {t('versions.create')}
        </button>
      </div>

      {versions && versions.length > 0 ? (
        <div className="space-y-4">
          {versions.map((version, index) => (
            <motion.div
              key={version.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="card p-6"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <History className="h-6 w-6 text-primary-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold text-gray-900">{version.version_tag}</h3>
                      {version.version_tag === `v${service.current_version}` && (
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                          {t('versions.current')}
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 mt-1">
                      {version.changelog || t('versions.noChangelog')}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {formatDate(version.created_at, locale)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowVersionDetail(version.id)}
                    className="btn-secondary py-2 text-sm"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    {t('versions.viewDetails')}
                  </button>
                  {version.version_tag !== `v${service.current_version}` && (
                    <button
                      onClick={() => handleRollback(version.id, version.version_tag)}
                      className="btn-primary py-2 text-sm"
                      disabled={rollbackMutation.isPending}
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      {t('versions.rollbackToVersion')}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="card p-12 text-center">
          <History className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">{t('versions.emptyTitle')}</h3>
          <p className="text-gray-500 mb-6">{t('versions.emptyDescription')}</p>
          <button onClick={() => setShowCreateModal(true)} className="btn-primary">
            <Plus className="h-4 w-4 mr-2" />
            {t('versions.create')}
          </button>
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">{t('versions.createTitle')}</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
                aria-label={t('common.close')}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form
              onSubmit={(event) => {
                event.preventDefault()
                createVersionMutation.mutate(changelog)
              }}
              className="p-6 space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('versions.changelog')}
                </label>
                <textarea
                  value={changelog}
                  onChange={(event) => setChangelog(event.target.value)}
                  placeholder={t('versions.changelogPlaceholder')}
                  rows={6}
                  className="input w-full"
                  required
                />
              </div>
              <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn-secondary"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={createVersionMutation.isPending}
                >
                  {createVersionMutation.isPending ? t('versions.creating') : t('versions.create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showVersionDetail && selectedVersion && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{selectedVersion.version_tag}</h2>
                <p className="text-sm text-gray-500 mt-1">
                  {formatDate(selectedVersion.created_at, locale)}
                </p>
              </div>
              <button
                onClick={() => setShowVersionDetail(null)}
                className="p-2 hover:bg-gray-100 rounded-lg"
                aria-label={t('common.close')}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              {selectedVersion.changelog && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">{t('versions.changelog')}</h3>
                  <p className="text-gray-600">{selectedVersion.changelog}</p>
                </div>
              )}

              {selectedVersion.code_snapshot && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                    <Code className="h-4 w-4" />
                    {t('versions.codeSnapshot')}
                  </h3>
                  <div className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto">
                    <pre className="text-sm">{selectedVersion.code_snapshot}</pre>
                  </div>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button onClick={() => setShowVersionDetail(null)} className="btn-secondary">
                {t('common.close')}
              </button>
              {selectedVersion.version_tag !== `v${service.current_version}` && (
                <button
                  onClick={() => handleRollback(selectedVersion.id, selectedVersion.version_tag)}
                  className="btn-primary"
                  disabled={rollbackMutation.isPending}
                >
                  {rollbackMutation.isPending
                    ? t('versions.rollingBack')
                    : t('versions.rollbackToVersion')}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
