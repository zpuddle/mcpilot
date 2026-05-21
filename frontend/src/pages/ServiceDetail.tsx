import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { ArrowLeft, Play, Square, RotateCcw, Trash2, Edit, Code2, Activity, Server, Clock, HardDrive, ShieldCheck, Database, History, ExternalLink } from 'lucide-react'
import { StatusBadge } from '@/components/common/StatusBadge'
import { formatDate } from '@/utils/formatters'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { servicesApi } from '@/api/services'

export function ServiceDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
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
      toast.success('服务已启动')
    },
  })

  const stopMutation = useMutation({
    mutationFn: (serviceId: number) => servicesApi.stopService(serviceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service', serviceId] })
      queryClient.invalidateQueries({ queryKey: ['services'] })
      toast.success('服务已停止')
    },
  })

  const restartMutation = useMutation({
    mutationFn: (serviceId: number) => servicesApi.restartService(serviceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service', serviceId] })
      queryClient.invalidateQueries({ queryKey: ['services'] })
      toast.success('服务已重启')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (serviceId: number) => servicesApi.deleteService(serviceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] })
      toast.success('服务已删除')
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
          <div className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse"></div>
          <div className="space-y-2">
            <div className="w-48 h-8 bg-gray-200 rounded animate-pulse"></div>
            <div className="w-32 h-4 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="card p-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse"></div>
                <div className="space-y-2">
                  <div className="w-20 h-4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="w-12 h-6 bg-gray-200 rounded animate-pulse"></div>
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

  const mockStats = [
    { label: 'CPU使用率', value: '12%', icon: Activity, color: 'text-blue-600 bg-blue-100' },
    { label: '内存使用', value: '256MB', icon: HardDrive, color: 'text-green-600 bg-green-100' },
    { label: '运行时间', value: '5天 12小时', icon: Clock, color: 'text-purple-600 bg-purple-100' },
    { label: '版本', value: `v${service.current_version}`, icon: ShieldCheck, color: 'text-orange-600 bg-orange-100' }
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
          <p className="text-gray-500 mt-1">{service.description}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button onClick={() => navigate(`/services/${serviceId}/edit`)} className="btn-primary gap-2">
          <Edit className="h-4 w-4" />
          编辑服务
        </button>
        {service.status === 'stopped' && (
          <button onClick={() => startMutation.mutate(serviceId)} className="btn-success gap-2" disabled={startMutation.isPending}>
            <Play className="h-4 w-4" />
            启动
          </button>
        )}
        {service.status === 'running' && (
          <>
            <button onClick={() => stopMutation.mutate(serviceId)} className="btn-secondary gap-2" disabled={stopMutation.isPending}>
              <Square className="h-4 w-4" />
              停止
            </button>
            <button onClick={() => restartMutation.mutate(serviceId)} className="btn-secondary gap-2" disabled={restartMutation.isPending}>
              <RotateCcw className="h-4 w-4" />
              重启
            </button>
          </>
        )}
        <button onClick={() => setShowDeleteConfirm(true)} className="btn-danger gap-2">
          <Trash2 className="h-4 w-4" />
          删除
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {mockStats.map((stat, i) => {
          const Icon = stat.icon
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="card p-6"
            >
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-lg ${stat.color}`}>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="card"
        >
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Server className="h-5 w-5" />
              服务信息
            </h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-500">ID</span>
              <span className="text-gray-900 font-mono">{service.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">传输协议</span>
              <span className="text-gray-900">{service.transport_type.toUpperCase()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">端口</span>
              <span className="text-gray-900">{service.port || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">当前版本</span>
              <span className="text-gray-900">{service.current_version}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">所有者</span>
              <span className="text-gray-900">{service.owner_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">创建时间</span>
              <span className="text-gray-900">{formatDate(service.created_at)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">更新时间</span>
              <span className="text-gray-900">{formatDate(service.updated_at)}</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="card"
        >
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Database className="h-5 w-5" />
              环境变量
            </h2>
          </div>
          <div className="p-6">
            {service.env_vars && Object.keys(service.env_vars).length > 0 ? (
              <div className="space-y-2">
                {Object.entries(service.env_vars).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium text-gray-700">{key}</span>
                    <span className="text-sm text-gray-500 font-mono">{typeof value === 'string' && value.length > 20 ? `${value.slice(0, 20)}...` : String(value)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">暂无环境变量</p>
            )}
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="card"
      >
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Code2 className="h-5 w-5" />
            工具 (Tools)
          </h2>
          <button 
            onClick={() => navigate(`/services/${serviceId}/tools`)}
            className="text-primary-600 hover:text-primary-700 flex items-center gap-1 text-sm font-medium"
          >
            管理工具
            <ExternalLink className="h-3 w-3" />
          </button>
        </div>
        <div className="p-6">
          {tools && tools.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tools.map(tool => (
                <div key={tool.id} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-900">{tool.name}</h3>
                    {tool.is_enabled ? (
                      <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">已启用</span>
                    ) : (
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">已禁用</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mb-2">{tool.description}</p>
                  <p className="text-xs text-gray-400 font-mono">Handler: {tool.handler_name}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">暂无工具配置</p>
          )}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="card"
      >
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Activity className="h-5 w-5" />
            资源 (Resources)
          </h2>
          <button 
            onClick={() => navigate(`/services/${serviceId}/resources`)}
            className="text-primary-600 hover:text-primary-700 flex items-center gap-1 text-sm font-medium"
          >
            管理资源
            <ExternalLink className="h-3 w-3" />
          </button>
        </div>
        <div className="p-6">
          {resources && resources.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {resources.map(resource => (
                <div key={resource.id} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-900">{resource.name}</h3>
                    {resource.is_enabled ? (
                      <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">已启用</span>
                    ) : (
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">已禁用</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mb-2">{resource.description}</p>
                  <div className="text-xs text-gray-400 space-y-1">
                    <p className="font-mono">URI: {resource.uri_template}</p>
                    <p>MIME: {resource.mime_type}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">暂无资源配置</p>
          )}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="card"
      >
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <History className="h-5 w-5" />
            版本管理
          </h2>
          <button 
            onClick={() => navigate(`/services/${serviceId}/versions`)}
            className="text-primary-600 hover:text-primary-700 flex items-center gap-1 text-sm font-medium"
          >
            查看所有版本
            <ExternalLink className="h-3 w-3" />
          </button>
        </div>
        <div className="p-6">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 bg-primary-100 rounded-lg flex items-center justify-center">
              <History className="h-7 w-7 text-primary-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">当前版本</p>
              <p className="text-2xl font-bold text-gray-900">v{service.current_version}</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <button
              onClick={() => navigate(`/services/${serviceId}/versions`)}
              className="btn-secondary w-full"
            >
              管理版本和回滚
            </button>
          </div>
        </div>
      </motion.div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">确认删除</h3>
            <p className="text-gray-500 mb-6">
              确定要删除服务 "{service.name}" 吗？此操作不可撤销。
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="btn-secondary"
                disabled={deleteMutation.isPending}
              >
                取消
              </button>
              <button
                onClick={handleDelete}
                className="btn-danger"
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? '删除中...' : '删除'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
