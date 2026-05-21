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
  Eye,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react'
import { servicesApi } from '@/api/services'
import type { Resource } from '@/types'

export function ServiceResources() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const serviceId = id ? parseInt(id) : 0

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingResource, setEditingResource] = useState<Resource | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    uri: '',
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
      toast.success('资源创建成功！')
      closeModal()
    },
    onError: (error) => {
      toast.error('创建资源失败')
      console.error(error)
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ resourceId, data }: { resourceId: number; data: Partial<Resource> }) =>
      servicesApi.updateResource(serviceId, resourceId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources', serviceId] })
      toast.success('资源更新成功！')
      closeModal()
    },
    onError: (error) => {
      toast.error('更新资源失败')
      console.error(error)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (resourceId: number) => servicesApi.deleteResource(serviceId, resourceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources', serviceId] })
      toast.success('资源删除成功！')
    },
    onError: (error) => {
      toast.error('删除资源失败')
      console.error(error)
    },
  })

  const openCreateModal = () => {
    setEditingResource(null)
    setFormData({
      name: '',
      description: '',
      uri: '',
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
      uri: resource.uri,
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingResource) {
      updateMutation.mutate({ resourceId: editingResource.id, data: formData })
    } else {
      createMutation.mutate(formData)
    }
  }

  const handleDelete = (resource: Resource) => {
    if (window.confirm(`确定要删除资源 "${resource.name}" 吗？`)) {
      deleteMutation.mutate(resource.id)
    }
  }

  const getResourceIcon = (mimeType: string) => {
    if (mimeType.includes('application/json')) {
      return <Database className="h-5 w-5 text-primary-600" />
    } else if (mimeType.includes('text/')) {
      return <FileText className="h-5 w-5 text-green-600" />
    } else {
      return <Database className="h-5 w-5 text-blue-600" />
    }
  }

  const getResourceIconBg = (mimeType: string) => {
    if (mimeType.includes('application/json')) {
      return 'bg-primary-100'
    } else if (mimeType.includes('text/')) {
      return 'bg-green-100'
    } else {
      return 'bg-blue-100'
    }
  }

  if (serviceLoading || resourcesLoading) {
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
          <h2 className="text-xl font-semibold text-gray-900 mb-2">服务未找到</h2>
          <button onClick={() => navigate('/services')} className="btn-primary mt-4">
            返回服务列表
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
            <h1 className="text-2xl font-bold text-gray-900">资源管理</h1>
            <p className="text-gray-500 mt-1">{service.name}</p>
          </div>
        </div>
        <button onClick={openCreateModal} className="btn-primary">
          <Plus className="h-4 w-4 mr-2" />
          添加资源
        </button>
      </div>

      {resources && resources.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {resources.map((resource, index) => (
            <motion.div
              key={resource.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="card"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`h-10 w-10 ${getResourceIconBg(resource.mime_type)} rounded-lg flex items-center justify-center`}>
                  {getResourceIcon(resource.mime_type)}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => openEditModal(resource)}
                    className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                    title="编辑资源"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(resource)}
                    className="p-2 text-gray-500 hover:bg-red-50 rounded-lg"
                    title="删除资源"
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </button>
                </div>
              </div>

              <div className="mb-4">
                <h3 className="font-semibold text-gray-900 mb-1">{resource.name}</h3>
                <p className="text-sm text-gray-500">{resource.description}</p>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Link className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-500">URI:</span>
                  <span className="text-gray-900 font-mono truncate" title={resource.uri}>
                    {resource.uri}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-500">类型:</span>
                  <span className="text-gray-900 font-mono">{resource.mime_type}</span>
                </div>
                {resource.handler_name && (
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-500">处理器:</span>
                    <span className="text-gray-900 font-mono">{resource.handler_name}</span>
                  </div>
                )}
                <div className="pt-3 border-t border-gray-100">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    resource.is_enabled
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-500'
                  }`}>
                    {resource.is_enabled ? '已启用' : '已禁用'}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="card p-12 text-center">
          <Database className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">暂无资源</h3>
          <p className="text-gray-500 mb-6">添加你的第一个资源吧！</p>
          <button onClick={openCreateModal} className="btn-primary">
            <Plus className="h-4 w-4 mr-2" />
            添加资源
          </button>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingResource ? '编辑资源' : '添加资源'}
              </h2>
              <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  资源名称 *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="例如: config.json"
                  className="input w-full"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  资源描述
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="描述这个资源的用途..."
                  rows={3}
                  className="input w-full resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URI *
                </label>
                <input
                  type="text"
                  value={formData.uri}
                  onChange={(e) => setFormData({ ...formData, uri: e.target.value })}
                  placeholder="例如: file:///path/to/config.json"
                  className="input w-full"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  MIME 类型
                </label>
                <input
                  type="text"
                  value={formData.mime_type}
                  onChange={(e) => setFormData({ ...formData, mime_type: e.target.value })}
                  placeholder="例如: application/json"
                  className="input w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  处理函数名
                </label>
                <input
                  type="text"
                  value={formData.handler_name}
                  onChange={(e) => setFormData({ ...formData, handler_name: e.target.value })}
                  placeholder="例如: read_config_handler"
                  className="input w-full"
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="resource_is_enabled"
                  checked={formData.is_enabled}
                  onChange={(e) => setFormData({ ...formData, is_enabled: e.target.checked })}
                  className="rounded"
                />
                <label htmlFor="resource_is_enabled" className="text-sm text-gray-700">
                  启用资源
                </label>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={closeModal}
                  className="btn-secondary"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {editingResource ? '更新' : '创建'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
