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
  Code,
  ToggleLeft,
  ToggleRight,
  Wrench,
} from 'lucide-react'
import { servicesApi } from '@/api/services'
import { useI18n } from '@/i18n'
import { formatDate } from '@/utils/formatters'
import type { Tool } from '@/types'

export function ServiceTools() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { t, locale } = useI18n()
  const serviceId = id ? parseInt(id) : 0

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTool, setEditingTool] = useState<Tool | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    handler_name: '',
    input_schema: {},
    output_schema: {},
    is_enabled: true,
  })

  const { data: service, isLoading: serviceLoading } = useQuery({
    queryKey: ['service', serviceId],
    queryFn: () => servicesApi.getService(serviceId),
    enabled: !!serviceId,
  })

  const { data: tools, isLoading: toolsLoading } = useQuery({
    queryKey: ['tools', serviceId],
    queryFn: () => servicesApi.getTools(serviceId),
    enabled: !!serviceId,
  })

  const createMutation = useMutation({
    mutationFn: (data: typeof formData) => servicesApi.createTool(serviceId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tools', serviceId] })
      toast.success(t('tools.created'))
      closeModal()
    },
    onError: (error) => {
      toast.error(t('tools.createFailed'))
      console.error(error)
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ toolId, data }: { toolId: number; data: Partial<Tool> }) =>
      servicesApi.updateTool(serviceId, toolId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tools', serviceId] })
      toast.success(t('tools.updated'))
      closeModal()
    },
    onError: (error) => {
      toast.error(t('tools.updateFailed'))
      console.error(error)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (toolId: number) => servicesApi.deleteTool(serviceId, toolId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tools', serviceId] })
      toast.success(t('tools.deleted'))
    },
    onError: (error) => {
      toast.error(t('tools.deleteFailed'))
      console.error(error)
    },
  })

  const toggleToolMutation = useMutation({
    mutationFn: ({ toolId, isEnabled }: { toolId: number; isEnabled: boolean }) =>
      servicesApi.updateTool(serviceId, toolId, { is_enabled: isEnabled }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tools', serviceId] })
    },
    onError: (error) => {
      toast.error(t('tools.statusUpdateFailed'))
      console.error(error)
    },
  })

  const openCreateModal = () => {
    setEditingTool(null)
    setFormData({
      name: '',
      description: '',
      handler_name: '',
      input_schema: {},
      output_schema: {},
      is_enabled: true,
    })
    setIsModalOpen(true)
  }

  const openEditModal = (tool: Tool) => {
    setEditingTool(tool)
    setFormData({
      name: tool.name,
      description: tool.description,
      handler_name: tool.handler_name,
      input_schema: tool.input_schema,
      output_schema: tool.output_schema,
      is_enabled: tool.is_enabled,
    })
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingTool(null)
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (editingTool) {
      updateMutation.mutate({ toolId: editingTool.id, data: formData })
    } else {
      createMutation.mutate(formData)
    }
  }

  const handleDelete = (tool: Tool) => {
    if (window.confirm(t('tools.confirmDelete', { name: tool.name }))) {
      deleteMutation.mutate(tool.id)
    }
  }

  const handleToggle = (tool: Tool) => {
    toggleToolMutation.mutate({ toolId: tool.id, isEnabled: !tool.is_enabled })
  }

  if (serviceLoading || toolsLoading) {
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
            <h1 className="text-2xl font-bold text-gray-900">{t('tools.title')}</h1>
            <p className="mt-1 text-gray-500">{service.name}</p>
          </div>
        </div>
        <button onClick={openCreateModal} className="btn-primary">
          <Plus className="mr-2 h-4 w-4" />
          {t('tools.add')}
        </button>
      </div>

      {tools && tools.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {tools.map((tool, index) => (
            <motion.div
              key={tool.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="card"
            >
              <div className="mb-4 flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100">
                  <Wrench className="h-5 w-5 text-primary-600" />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleToggle(tool)}
                    className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
                    title={tool.is_enabled ? t('tools.disableTool') : t('tools.enableTool')}
                  >
                    {tool.is_enabled ? (
                      <ToggleRight className="h-4 w-4 text-green-600" />
                    ) : (
                      <ToggleLeft className="h-4 w-4" />
                    )}
                  </button>
                  <button
                    onClick={() => openEditModal(tool)}
                    className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
                    title={t('tools.editTool')}
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(tool)}
                    className="rounded-lg p-2 text-gray-500 hover:bg-red-50"
                    title={t('tools.deleteTool')}
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </button>
                </div>
              </div>

              <div className="mb-4">
                <h3 className="mb-1 font-semibold text-gray-900">{tool.name}</h3>
                <p className="text-sm text-gray-500">{tool.description}</p>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Code className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-500">{t('tools.handler')}</span>
                  <span className="font-mono text-gray-900">{tool.handler_name}</span>
                </div>
                <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                  <span className={`rounded-full px-2 py-1 text-xs ${
                    tool.is_enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {tool.is_enabled ? t('status.enabled') : t('status.disabled')}
                  </span>
                  <span className="text-xs text-gray-400">
                    {t('common.createdAt')}: {formatDate(tool.created_at, locale)}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="card p-12 text-center">
          <Wrench className="mx-auto mb-4 h-12 w-12 text-gray-300" />
          <h3 className="mb-2 text-lg font-medium text-gray-900">{t('tools.emptyTitle')}</h3>
          <p className="mb-6 text-gray-500">{t('tools.emptyDescription')}</p>
          <button onClick={openCreateModal} className="btn-primary">
            <Plus className="mr-2 h-4 w-4" />
            {t('tools.add')}
          </button>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white">
            <div className="flex items-center justify-between border-b border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingTool ? t('tools.edit') : t('tools.add')}
              </h2>
              <button onClick={closeModal} className="rounded-lg p-2 hover:bg-gray-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6 p-6">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  {t('tools.name')} *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(event) => setFormData({ ...formData, name: event.target.value })}
                  placeholder={t('tools.namePlaceholder')}
                  className="input w-full"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  {t('tools.description')}
                </label>
                <textarea
                  value={formData.description}
                  onChange={(event) => setFormData({ ...formData, description: event.target.value })}
                  placeholder={t('tools.descriptionPlaceholder')}
                  rows={3}
                  className="input w-full resize-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  {t('tools.handlerName')} *
                </label>
                <input
                  type="text"
                  value={formData.handler_name}
                  onChange={(event) => setFormData({ ...formData, handler_name: event.target.value })}
                  placeholder={t('tools.handlerPlaceholder')}
                  className="input w-full"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  {t('tools.inputSchema')}
                </label>
                <textarea
                  value={JSON.stringify(formData.input_schema, null, 2)}
                  onChange={(event) => {
                    try {
                      setFormData({ ...formData, input_schema: JSON.parse(event.target.value) })
                    } catch {
                      // Allow users to keep editing invalid JSON temporarily.
                    }
                  }}
                  placeholder='{"type": "object", "properties": {...}}'
                  rows={6}
                  className="input w-full resize-none font-mono text-sm"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  {t('tools.outputSchema')}
                </label>
                <textarea
                  value={JSON.stringify(formData.output_schema, null, 2)}
                  onChange={(event) => {
                    try {
                      setFormData({ ...formData, output_schema: JSON.parse(event.target.value) })
                    } catch {
                      // Allow users to keep editing invalid JSON temporarily.
                    }
                  }}
                  placeholder='{"type": "object", "properties": {...}}'
                  rows={6}
                  className="input w-full resize-none font-mono text-sm"
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="is_enabled"
                  checked={formData.is_enabled}
                  onChange={(event) => setFormData({ ...formData, is_enabled: event.target.checked })}
                  className="rounded"
                />
                <label htmlFor="is_enabled" className="text-sm text-gray-700">
                  {t('tools.enableTool')}
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
                  {editingTool ? t('common.update') : t('common.create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
