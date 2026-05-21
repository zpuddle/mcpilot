import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import {
  ArrowLeft,
  Save,
  Play,
  Square,
  RotateCcw,
  Code2,
  Settings,
  Database,
  Layers,
  CheckCircle2,
  FileCode,
  Server,
  AlertCircle,
  Terminal,
  Eye,
  Package,
} from 'lucide-react'
import { servicesApi } from '@/api/services'
import { StatusBadge } from '@/components/common/StatusBadge'

const protocolOptions = [
  { value: 'sse', label: 'SSE (Server-Sent Events)', description: '推荐用于Web界面' },
  { value: 'stdio', label: 'stdio', description: '标准输入输出协议' },
]

export function ServiceEdit() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const serviceId = id ? parseInt(id) : 0
  const [activeTab, setActiveTab] = useState<'basic' | 'code' | 'config' | 'logs'>('basic')
  const [showLogs, setShowLogs] = useState(false)

  const { data: service, isLoading: serviceLoading } = useQuery({
    queryKey: ['service', serviceId],
    queryFn: () => servicesApi.getService(serviceId),
    enabled: !!serviceId,
  })

  const { data: serviceCode } = useQuery({
    queryKey: ['serviceCode', serviceId],
    queryFn: () => servicesApi.getServiceCode(serviceId),
    enabled: !!serviceId,
  })

  const { data: logs } = useQuery({
    queryKey: ['serviceLogs', serviceId],
    queryFn: () => servicesApi.getServiceLogs(serviceId),
    enabled: !!serviceId && showLogs,
  })

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    transport_type: 'sse' as const,
    code: '',
    env_vars: [{ key: '', value: '' }],
    extra_dependencies: '',
  })

  useEffect(() => {
    if (service && serviceCode) {
      const envVars = Object.entries(service.env_vars || {}).map(([key, value]) => ({
        key,
        value: String(value),
      }))
      if (envVars.length === 0) {
        envVars.push({ key: '', value: '' })
      }

      setFormData({
        name: service.name,
        description: service.description || '',
        transport_type: service.transport_type,
        code: serviceCode.code,
        env_vars: envVars,
        extra_dependencies: service.extra_dependencies || '',
      })
    }
  }, [service, serviceCode])

  const updateMutation = useMutation({
    mutationFn: async () => {
      const envVars: Record<string, string> = {}
      formData.env_vars.forEach(env => {
        if (env.key.trim()) {
          envVars[env.key] = env.value
        }
      })

      await servicesApi.updateService(serviceId, {
        name: formData.name,
        description: formData.description,
        transport_type: formData.transport_type,
        env_vars: envVars,
        extra_dependencies: formData.extra_dependencies,
      })

      await servicesApi.saveServiceCode(serviceId, formData.code)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service', serviceId] })
      queryClient.invalidateQueries({ queryKey: ['services'] })
      toast.success('服务更新成功！')
    },
    onError: (error) => {
      toast.error('更新服务失败')
      console.error(error)
    },
  })

  const deployMutation = useMutation({
    mutationFn: () => servicesApi.deployService(serviceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service', serviceId] })
      queryClient.invalidateQueries({ queryKey: ['services'] })
      toast.success('服务部署成功！')
    },
    onError: (error) => {
      toast.error('部署服务失败')
      console.error(error)
    },
  })

  const startMutation = useMutation({
    mutationFn: () => servicesApi.startService(serviceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service', serviceId] })
      queryClient.invalidateQueries({ queryKey: ['services'] })
      toast.success('服务已启动')
    },
  })

  const stopMutation = useMutation({
    mutationFn: () => servicesApi.stopService(serviceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service', serviceId] })
      queryClient.invalidateQueries({ queryKey: ['services'] })
      toast.success('服务已停止')
    },
  })

  const restartMutation = useMutation({
    mutationFn: () => servicesApi.restartService(serviceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service', serviceId] })
      queryClient.invalidateQueries({ queryKey: ['services'] })
      toast.success('服务已重启')
    },
  })

  const validateCodeMutation = useMutation({
    mutationFn: (code: string) => servicesApi.validateServiceCode(serviceId, code),
    onSuccess: (result) => {
      if (result.valid) {
        toast.success('代码验证通过！')
      } else {
        toast.error('代码验证失败')
        console.error(result.errors, result.warnings)
      }
    },
  })

  const addEnvVar = () => {
    setFormData(prev => ({
      ...prev,
      env_vars: [...prev.env_vars, { key: '', value: '' }],
    }))
  }

  const removeEnvVar = (index: number) => {
    if (formData.env_vars.length > 1) {
      setFormData(prev => ({
        ...prev,
        env_vars: prev.env_vars.filter((_, i) => i !== index),
      }))
    }
  }

  const updateEnvVar = (index: number, field: 'key' | 'value', value: string) => {
    setFormData(prev => {
      const newEnvVars = [...prev.env_vars]
      newEnvVars[index][field] = value
      return { ...prev, env_vars: newEnvVars }
    })
  }

  const validateForm = () => {
    if (!formData.name.trim()) {
      toast.error('请输入服务名称')
      return false
    }
    if (!formData.code.trim()) {
      toast.error('请输入服务代码')
      return false
    }
    return true
  }

  const handleSave = () => {
    if (validateForm()) {
      updateMutation.mutate()
    }
  }

  const handleValidateCode = () => {
    validateCodeMutation.mutate(formData.code)
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
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">编辑服务</h1>
              <StatusBadge status={service.status} />
            </div>
            <p className="text-gray-500 mt-1">{service.name}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => navigate(`/services/${serviceId}`)}
            className="btn-secondary"
          >
            <Eye className="h-4 w-4 mr-2" />
            查看详情
          </button>
          {service.status === 'stopped' && (
            <button
              onClick={() => startMutation.mutate()}
              className="btn-success"
              disabled={startMutation.isPending}
            >
              <Play className="h-4 w-4 mr-2" />
              启动
            </button>
          )}
          {service.status === 'running' && (
            <>
              <button
                onClick={() => stopMutation.mutate()}
                className="btn-secondary"
                disabled={stopMutation.isPending}
              >
                <Square className="h-4 w-4 mr-2" />
                停止
              </button>
              <button
                onClick={() => restartMutation.mutate()}
                className="btn-secondary"
                disabled={restartMutation.isPending}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                重启
              </button>
            </>
          )}
          <button
            onClick={handleSave}
            className="btn-primary"
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                保存中...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                保存
              </>
            )}
          </button>
        </div>
      </div>

      <div className="card">
        <div className="border-b border-gray-200">
          <nav className="flex gap-8 px-6 pt-4 overflow-x-auto">
            {[
              { id: 'basic' as const, label: '基本信息', icon: Settings },
              { id: 'code' as const, label: '代码编辑', icon: Code2 },
              { id: 'config' as const, label: '高级配置', icon: Layers },
              { id: 'logs' as const, label: '构建日志', icon: Terminal },
            ].map(tab => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id)
                    if (tab.id === 'logs') {
                      setShowLogs(true)
                    }
                  }}
                  className={`pb-4 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'text-primary-600 border-primary-600'
                      : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </div>
                </button>
              )
            })}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'basic' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    服务名称 *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="例如: Weather API Service"
                    className="input w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    服务描述
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="描述一下这个服务的功能..."
                    rows={3}
                    className="input w-full resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    传输协议 *
                  </label>
                  <div className="space-y-3">
                    {protocolOptions.map(opt => (
                      <label
                        key={opt.value}
                        className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                          formData.transport_type === opt.value
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="transport_type"
                          value={opt.value}
                          checked={formData.transport_type === opt.value}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            transport_type: e.target.value as any,
                          }))}
                          className="mt-1"
                        />
                        <div>
                          <div className="font-medium text-gray-900">{opt.label}</div>
                          <div className="text-sm text-gray-500">{opt.description}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      容器ID
                    </label>
                    <p className="text-sm text-gray-500 font-mono">{service.container_id || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      镜像标签
                    </label>
                    <p className="text-sm text-gray-500 font-mono">{service.image_tag || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      当前版本
                    </label>
                    <p className="text-sm text-gray-500">{service.current_version}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'code' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <FileCode className="h-4 w-4" />
                  main.py
                </div>
                <button
                  onClick={handleValidateCode}
                  className="btn-secondary py-2 text-sm"
                  disabled={validateCodeMutation.isPending}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  验证代码
                </button>
              </div>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <textarea
                  value={formData.code}
                  onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                  className="w-full h-96 p-4 font-mono text-sm bg-gray-50 focus:outline-none focus:bg-white resize-none"
                  spellCheck={false}
                  placeholder="# 在这里编写你的 MCP 服务代码"
                />
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Python 3.11+
                </div>
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                  需要安装 mcp Python 库
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'config' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <div>
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
                  <Package className="h-5 w-5" />
                  Python 依赖项
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  在此处添加需要的 Python 包，格式与 requirements.txt 相同。这些依赖会在构建 Docker 镜像时自动安装。
                </p>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <textarea
                    value={formData.extra_dependencies}
                    onChange={(e) => setFormData(prev => ({ ...prev, extra_dependencies: e.target.value }))}
                    className="w-full h-48 p-4 font-mono text-sm bg-gray-50 focus:outline-none focus:bg-white resize-none"
                    placeholder="# 例如:
requests>=2.31.0
openai>=1.0.0
pydantic>=2.0.0"
                  />
                </div>
                <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    支持版本号和约束符号
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-blue-500" />
                    mcp 库已默认包含，无需重复添加
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    环境变量
                  </h3>
                  <button onClick={addEnvVar} className="btn-secondary py-2 text-sm">
                    + 添加变量
                  </button>
                </div>
                <div className="space-y-3">
                  {formData.env_vars.map((env, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <input
                        type="text"
                        value={env.key}
                        onChange={(e) => updateEnvVar(index, 'key', e.target.value)}
                        placeholder="变量名 (例如: API_KEY)"
                        className="input flex-1"
                      />
                      <span className="text-gray-400">=</span>
                      <input
                        type="text"
                        value={env.value}
                        onChange={(e) => updateEnvVar(index, 'value', e.target.value)}
                        placeholder="变量值"
                        className="input flex-1"
                      />
                      {formData.env_vars.length > 1 && (
                        <button
                          onClick={() => removeEnvVar(index)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                        >
                          <AlertCircle className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
                  <Server className="h-5 w-5" />
                  部署操作
                </h3>
                <div className="flex gap-3">
                  <button
                    onClick={() => deployMutation.mutate()}
                    className="btn-primary"
                    disabled={deployMutation.isPending}
                  >
                    {deployMutation.isPending ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        部署中...
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        重新部署
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'logs' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Terminal className="h-5 w-5 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">服务日志</span>
                </div>
                <div className="text-xs text-gray-500">
                  最后更新: {new Date().toLocaleTimeString()}
                </div>
              </div>
              <div className="bg-gray-900 text-gray-100 rounded-lg p-4 h-96 overflow-y-auto font-mono text-sm">
                {logs?.logs ? (
                  <pre className="whitespace-pre-wrap">{logs.logs}</pre>
                ) : (
                  <p className="text-gray-500">暂无日志记录</p>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}
