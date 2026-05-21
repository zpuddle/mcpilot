import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import {
  ArrowLeft,
  Save,
  Play,
  Code2,
  Settings,
  Database,
  Layers,
  CheckCircle2,
  FileCode,
  Server,
  AlertCircle,
  Package,
} from 'lucide-react'
import { servicesApi } from '@/api/services'

const protocolOptions = [
  { value: 'sse', label: 'SSE (Server-Sent Events)', description: '推荐用于Web界面' },
  { value: 'stdio', label: 'stdio', description: '标准输入输出协议' },
]

const blankTemplateCode = `from mcp.server.fastmcp import FastMCP

# 创建你的 MCP 服务器
mcp = FastMCP("My Service")

@mcp.tool()
def my_function(param: str) -> str:
    """这是你的工具函数"""
    # 在这里实现你的逻辑
    return f"Result: {param}"

if __name__ == "__main__":
    mcp.run()
`

export function ServiceCreate() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'basic' | 'code' | 'config'>('basic')

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    transport_type: 'sse' as const,
    code: blankTemplateCode,
    env_vars: [{ key: '', value: '' }],
    extra_dependencies: '',
  })

  const createMutation = useMutation({
    mutationFn: async () => {
      const envVars: Record<string, string> = {}
      formData.env_vars.forEach(env => {
        if (env.key.trim()) {
          envVars[env.key] = env.value
        }
      })

      const service = await servicesApi.createService({
        name: formData.name,
        description: formData.description,
        transport_type: formData.transport_type,
      })

      await servicesApi.saveServiceCode(service.id, formData.code)

      const updateData: any = {}
      if (Object.keys(envVars).length > 0) {
        updateData.env_vars = envVars
      }
      if (formData.extra_dependencies) {
        updateData.extra_dependencies = formData.extra_dependencies
      }

      if (Object.keys(updateData).length > 0) {
        await servicesApi.updateService(service.id, updateData)
      }

      return service
    },
    onSuccess: (service) => {
      toast.success('服务创建成功！')
      navigate(`/services/${service.id}`)
    },
    onError: (error) => {
      toast.error('创建服务失败')
      console.error(error)
    },
  })

  const validateCodeMutation = useMutation({
    mutationFn: (code: string) => servicesApi.validateServiceCode(1, code),
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
      createMutation.mutate()
    }
  }

  const handleValidateCode = () => {
    validateCodeMutation.mutate(formData.code)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="btn-ghost p-2">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">创建新服务</h1>
            <p className="text-gray-500 mt-1">配置并构建你的 MCP 服务</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleValidateCode}
            className="btn-secondary"
            disabled={validateCodeMutation.isPending}
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            验证代码
          </button>
          <button
            onClick={handleSave}
            className="btn-primary"
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                创建中...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                创建服务
              </>
            )}
          </button>
        </div>
      </div>

      <div className="card">
        <div className="border-b border-gray-200">
          <nav className="flex gap-8 px-6 pt-4">
            {[
              { id: 'basic' as const, label: '基本信息', icon: Settings },
              { id: 'code' as const, label: '代码编辑', icon: Code2 },
              { id: 'config' as const, label: '高级配置', icon: Layers },
            ].map(tab => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`pb-4 text-sm font-medium border-b-2 -mb-px transition-colors ${
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
                  构建说明
                </h3>
                <div className="p-4 bg-gray-50 rounded-lg text-sm text-gray-600">
                  <p>服务创建后，系统将自动：</p>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>从你的代码创建一个 Docker 镜像</li>
                    <li>安装必要的 Python 依赖</li>
                    <li>配置环境变量和网络设置</li>
                    <li>启动服务容器</li>
                  </ul>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}
