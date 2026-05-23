import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import {
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Database,
  FileText,
  Link,
} from 'lucide-react'
import { servicesApi } from '@/api/services'
import { useI18n } from '@/i18n'
import type { Resource } from '@/types'

export function ServiceResources() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { t } = useI18n()
  const serviceId = id ? parseInt(id) : 0

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingResource, setEditingResource] = useState<Resource | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    uri_template: '',
    mime_type: '',
    handler_name: '',
    is_enabled: true,
  })

  const { data: service, isLoading: serviceLoading } = useQuery({
    queryKey: ['service', serviceId],
    queryFn: () => servicesApi.getService(serviceId),
    enabled: !!serviceId,
  })

  const { data: resources, isLoading: resourcesLoading } = useQuery({
    queryKey: ['resources', serviceId],
    queryFn: () => servicesApi.getResources(serviceId),
    enabled: !!serviceId,
  })

  const createMutation = useMutation({
    mutationFn: (data: typeof formData) => servicesApi.createResource(serviceId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources', serviceId] })
      toast.success(t('resources.created'))
      closeModal()
    },
    onError: (error) => {
      toast.error(t('resources.createFailed'))
      console.error(error)
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ resourceId, data }: { resourceId: number; data: Partial<Resource> }) =>
      servicesApi.updateResource(serviceId, resourceId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources', serviceId] })
      toast.success(t('resources.updated'))
      closeModal()
    },
    onError: (error) => {
      toast.error(t('resources.updateFailed'))
      console.error(error)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (resourceId: number) => servicesApi.deleteResource(serviceId, resourceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources', serviceId] })
      toast.success(t('resources.deleted'))
    },
    onError: (error) => {
      toast.error(t('resources.deleteFailed'))
      console.error(error)
    },
  })

  const openCreateModal = () => {
    setEditingResource(null)
    setFormData({
      name: '',
      description: '',
      uri_template: '',
      mime_type: '',
      handler_name: '',
      is_enabled: true,
    })
    setIsModalOpen(true)
  }

  const openEditModal = (resource: Resource) => {
    setEditingResource(resource)
    setFormData({
      name: resource.name,
      description: resource.description,
      uri_template: resource.uri_template,
      mime_type: resource.mime_type,
      handler_name: resource.handler_name,
      is_enabled: resource.is_enabled,
    })
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingResource(null)
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (editingResource) {
      updateMutation.mutate({ resourceId: editingResource.id, data: formData })
    } else {
      createMutation.mutate(formData)
    }
  }

  const handleDelete = (resource: Resource) => {
    if (window.confirm(t('resources.confirmDelete', { name: resource.name }))) {
      deleteMutation.mutate(resource.id)
    }
  }

  const getResourceIcon = (mimeType: string) => {
    if (mimeType.includes('application/json')) {
      return <Database className="h-5 w-5 text-primary-600" />
    }
    if (mimeType.includes('text/')) {
      return <FileText className="h-5 w-5 text-green-600" />
    }
    return <Database className="h-5 w-5 text-blue-600" />
  }

  const getResourceIconBg = (mimeType: string) => {
    if (mimeType.includes('application/json')) {
      return 'bg-primary-100'
    }
    if (mimeType.includes('text/')) {
      return 'bg-green-100'
    }
    return 'bg-blue-100'
  }

  if (serviceLoading || resourcesLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 animate-pulse rounded-lg bg-gray-200" />
          <div className="space-y-2">
            <div className="h-8 w-48 animate-pulse rounded bg-gray-200" />
            <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
          </div>
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(`/services/${serviceId}`)} className="btn-ghost p-2">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('resources.title')}</h1>
            <p className="mt-1 text-gray-500">{service.name}</p>
          </div>
        </div>
        <button onClick={openCreateModal} className="btn-primary">
          <Plus className="mr-2 h-4 w-4" />
          {t('resources.add')}
        </button>
      </div>

      {resources && resources.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {resources.map((resource, index) => (
            <motion.div
              key={resource.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="card"
            >
              <div className="mb-4 flex items-start justify-between">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${getResourceIconBg(resource.mime_type)}`}>
                  {getResourceIcon(resource.mime_type)}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => openEditModal(resource)}
                    className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
                    title={t('resources.editResource')}
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(resource)}
                    className="rounded-lg p-2 text-gray-500 hover:bg-red-50"
                    title={t('resources.deleteResource')}
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </button>
                </div>
              </div>

              <div className="mb-4">
                <h3 className="mb-1 font-semibold text-gray-900">{resource.name}</h3>
                <p className="text-sm text-gray-500">{resource.description}</p>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Link className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-500">URI:</span>
                  <span className="truncate font-mono text-gray-900" title={resource.uri_template}>
                    {resource.uri_template}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-500">{t('resources.type')}</span>
                  <span className="font-mono text-gray-900">{resource.mime_type}</span>
                </div>
                {resource.handler_name && (
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-500">{t('resources.handler')}</span>
                    <span className="font-mono text-gray-900">{resource.handler_name}</span>
                  </div>
                )}
                <div className="border-t border-gray-100 pt-3">
                  <span className={`rounded-full px-2 py-1 text-xs ${
                    resource.is_enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {resource.is_enabled ? t('status.enabled') : t('status.disabled')}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="card p-12 text-center">
          <Database className="mx-auto mb-4 h-12 w-12 text-gray-300" />
          <h3 className="mb-2 text-lg font-medium text-gray-900">{t('resources.emptyTitle')}</h3>
          <p className="mb-6 text-gray-500">{t('resources.emptyDescription')}</p>
          <button onClick={openCreateModal} className="btn-primary">
            <Plus className="mr-2 h-4 w-4" />
            {t('resources.add')}
          </button>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white">
            <div className="flex items-center justify-between border-b border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingResource ? t('resources.edit') : t('resources.add')}
              </h2>
              <button onClick={closeModal} className="rounded-lg p-2 hover:bg-gray-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6 p-6">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  {t('resources.name')} *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(event) => setFormData({ ...formData, name: event.target.value })}
                  placeholder={t('resources.namePlaceholder')}
                  className="input w-full"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  {t('resources.description')}
                </label>
                <textarea
                  value={formData.description}
                  onChange={(event) => setFormData({ ...formData, description: event.target.value })}
                  placeholder={t('resources.descriptionPlaceholder')}
                  rows={3}
                  className="input w-full resize-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">URI *</label>
                <input
                  type="text"
                  value={formData.uri_template}
                  onChange={(event) => setFormData({ ...formData, uri_template: event.target.value })}
                  placeholder={t('resources.uriPlaceholder')}
                  className="input w-full"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  {t('resources.mimeType')}
                </label>
                <input
                  type="text"
                  value={formData.mime_type}
                  onChange={(event) => setFormData({ ...formData, mime_type: event.target.value })}
                  placeholder={t('resources.mimePlaceholder')}
                  className="input w-full"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  {t('resources.handlerName')}
                </label>
                <input
                  type="text"
                  value={formData.handler_name}
                  onChange={(event) => setFormData({ ...formData, handler_name: event.target.value })}
                  placeholder={t('resources.handlerPlaceholder')}
                  className="input w-full"
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="resource_is_enabled"
                  checked={formData.is_enabled}
                  onChange={(event) => setFormData({ ...formData, is_enabled: event.target.checked })}
                  className="rounded"
                />
                <label htmlFor="resource_is_enabled" className="text-sm text-gray-700">
                  {t('resources.enableResource')}
                </label>
              </div>

              <div className="flex justify-end gap-3 border-t border-gray-200 pt-4">
                <button type="button" onClick={closeModal} className="btn-secondary">
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  <Save className="mr-2 h-4 w-4" />
                  {editingResource ? t('common.update') : t('common.create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
