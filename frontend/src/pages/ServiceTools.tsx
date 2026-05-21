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
import type { Tool } from '@/types'

export function ServiceTools() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
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
      toast.success('工具创建成功！')
      closeModal()
    },
    onError: (error) => {
      toast.error('创建工具失败')
      console.error(error)
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ toolId, data }: { toolId: number; data: Partial<Tool> }) =>
      servicesApi.updateTool(serviceId, toolId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tools', serviceId] })
      toast.success('工具更新成功！')
      closeModal()
    },
    onError: (error) => {
      toast.error('更新工具失败')
      console.error(error)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (toolId: number) => servicesApi.deleteTool(serviceId, toolId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tools', serviceId] })
      toast.success('工具删除成功！')
    },
    onError: (error) => {
      toast.error('删除工具失败')
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
      toast.error('更新工具状态失败')
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingTool) {
      updateMutation.mutate({ toolId: editingTool.id, data: formData })
    } else {
      createMutation.mutate(formData)
    }
  }

  const handleDelete = (tool: Tool) => {
    if (window.confirm(`确定要删除工具 "${tool.name}" 吗？`)) {
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
            <h1 className="text-2xl font-bold text-gray-900">工具管理</h1>
            <p className="text-gray-500 mt-1">{service.name}</p>
          </div>
        </div>
        <button onClick={openCreateModal} className="btn-primary">
          <Plus className="h-4 w-4 mr-2" />
          添加工具
        </button>
      </div>

      {tools && tools.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tools.map((tool, index) => (
            <motion.div
              key={tool.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="card"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="h-10 w-10 bg-primary-100 rounded-lg flex items-center justify-center">
                  <Wrench className="h-5 w-5 text-primary-600" />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleToggle(tool)}
                    className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                    title={tool.is_enabled ? '禁用工具' : '启用工具'}
                  >
                    {tool.is_enabled ? (
                      <ToggleRight className="h-4 w-4 text-green-600" />
                    ) : (
                      <ToggleLeft className="h-4 w-4" />
                    )}
                  </button>
                  <button
                    onClick={() => openEditModal(tool)}
                    className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                    title="编辑工具"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(tool)}
                    className="p-2 text-gray-500 hover:bg-red-50 rounded-lg"
                    title="删除工具"
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </button>
                </div>
              </div>

              <div className="mb-4">
                <h3 className="font-semibold text-gray-900 mb-1">{tool.name}</h3>
                <p className="text-sm text-gray-500">{tool.description}</p>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Code className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-500">处理函数:</span>
                  <span className="text-gray-900 font-mono">{tool.handler_name}</span>
                </div>
                <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    tool.is_enabled
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-500'
                  }`}>
                    {tool.is_enabled ? '已启用' : '已禁用'}
                  </span>
                  <span className="text-xs text-gray-400">
                    创建于: {new Date(tool.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="card p-12 text-center">
          <Wrench className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">暂无工具</h3>
          <p className="text-gray-500 mb-6">添加你的第一个工具吧！</p>
          <button onClick={openCreateModal} className="btn-primary">
            <Plus className="h-4 w-4 mr-2" />
            添加工具
          </button>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingTool ? '编辑工具' : '添加工具'}
              </h2>
              <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  工具名称 *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="例如: get_weather"
                  className="input w-full"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  工具描述
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="描述这个工具的功能..."
                  rows={3}
                  className="input w-full resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  处理函数名 *
                </label>
                <input
                  type="text"
                  value={formData.handler_name}
                  onChange={(e) => setFormData({ ...formData, handler_name: e.target.value })}
                  placeholder="例如: get_weather_handler"
                  className="input w-full"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  输入 Schema (JSON)
                </label>
                <textarea
                  value={JSON.stringify(formData.input_schema, null, 2)}
                  onChange={(e) => {
                    try {
                      setFormData({ ...formData, input_schema: JSON.parse(e.target.value) })
                    } catch (err) {
                      // 忽略解析错误，允许用户继续编辑
                    }
                  }}
                  placeholder='{"type": "object", "properties": {...}}'
                  rows={6}
                  className="input w-full resize-none font-mono text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  输出 Schema (JSON)
                </label>
                <textarea
                  value={JSON.stringify(formData.output_schema, null, 2)}
                  onChange={(e) => {
                    try {
                      setFormData({ ...formData, output_schema: JSON.parse(e.target.value) })
                    } catch (err) {
                      // 忽略解析错误
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
                  onChange={(e) => setFormData({ ...formData, is_enabled: e.target.checked })}
                  className="rounded"
                />
                <label htmlFor="is_enabled" className="text-sm text-gray-700">
                  启用工具
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
                  {editingTool ? '更新' : '创建'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
