import { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Code2,
  Database,
  Eye,
  FileCode,
  Layers,
  Package,
  Play,
  Plus,
  RotateCcw,
  Save,
  Settings,
  Square,
  Terminal,
} from 'lucide-react'
import { servicesApi } from '@/api/services'
import { StatusBadge } from '@/components/common/StatusBadge'
import { useI18n } from '@/i18n'
import type { TransportType } from '@/types'

type EditTab = 'basic' | 'code' | 'config' | 'logs'

export function ServiceEdit() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { t, locale } = useI18n()
  const serviceId = id ? parseInt(id) : 0
  const [activeTab, setActiveTab] = useState<EditTab>('basic')
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
    transport_type: 'sse' as TransportType,
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

  const protocolOptions = useMemo(
    () =>
      [
        { value: 'sse', label: 'SSE', description: t('service.protocol.sseDescription') },
        {
          value: 'streamable_http',
          label: 'Streamable HTTP',
          description: t('service.protocol.streamableHttpDescription'),
        },
        {
          value: 'both',
          label: t('service.protocol.bothLabel'),
          description: t('service.protocol.bothDescription'),
        },
      ] satisfies { value: TransportType; label: string; description: string }[],
    [t]
  )

  const tabs = useMemo(
    () =>
      [
        { id: 'basic' as const, label: t('service.basicInfo'), icon: Settings },
        { id: 'code' as const, label: t('service.codeEditor'), icon: Code2 },
        { id: 'config' as const, label: t('service.advancedConfig'), icon: Layers },
        { id: 'logs' as const, label: t('service.buildLogs'), icon: Terminal },
      ],
    [t]
  )

  const updateMutation = useMutation({
    mutationFn: async () => {
      const envVars: Record<string, string> = {}
      formData.env_vars.forEach((env) => {
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
      toast.success(t('service.updated'))
    },
    onError: (error) => {
      toast.error(t('service.updateFailed'))
      console.error(error)
    },
  })

  const deployMutation = useMutation({
    mutationFn: () => servicesApi.deployService(serviceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service', serviceId] })
      queryClient.invalidateQueries({ queryKey: ['services'] })
      toast.success(t('service.deployed'))
    },
    onError: (error) => {
      toast.error(t('service.deployFailed'))
      console.error(error)
    },
  })

  const startMutation = useMutation({
    mutationFn: () => servicesApi.startService(serviceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service', serviceId] })
      queryClient.invalidateQueries({ queryKey: ['services'] })
      toast.success(t('service.started'))
    },
  })

  const stopMutation = useMutation({
    mutationFn: () => servicesApi.stopService(serviceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service', serviceId] })
      queryClient.invalidateQueries({ queryKey: ['services'] })
      toast.success(t('service.stopped'))
    },
  })

  const restartMutation = useMutation({
    mutationFn: () => servicesApi.restartService(serviceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service', serviceId] })
      queryClient.invalidateQueries({ queryKey: ['services'] })
      toast.success(t('service.restarted'))
    },
  })

  const validateCodeMutation = useMutation({
    mutationFn: (code: string) => servicesApi.validateServiceCode(serviceId, code),
    onSuccess: (result) => {
      if (result.valid) {
        toast.success(t('service.codeValid'))
      } else {
        toast.error(t('service.codeInvalid'))
        console.error(result.errors, result.warnings)
      }
    },
  })

  const addEnvVar = () => {
    setFormData((prev) => ({
      ...prev,
      env_vars: [...prev.env_vars, { key: '', value: '' }],
    }))
  }

  const removeEnvVar = (index: number) => {
    if (formData.env_vars.length > 1) {
      setFormData((prev) => ({
        ...prev,
        env_vars: prev.env_vars.filter((_, i) => i !== index),
      }))
    }
  }

  const updateEnvVar = (index: number, field: 'key' | 'value', value: string) => {
    setFormData((prev) => {
      const newEnvVars = [...prev.env_vars]
      newEnvVars[index][field] = value
      return { ...prev, env_vars: newEnvVars }
    })
  }

  const validateForm = () => {
    if (!formData.name.trim()) {
      toast.error(t('service.nameRequired'))
      return false
    }
    if (!formData.code.trim()) {
      toast.error(t('service.codeRequired'))
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

  const lastUpdated = new Date().toLocaleTimeString(locale === 'zh' ? 'zh-CN' : 'en-US')

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(`/services/${serviceId}`)} className="btn-ghost p-2">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{t('service.editTitle')}</h1>
              <StatusBadge status={service.status} />
            </div>
            <p className="mt-1 text-gray-500">{service.name}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <button onClick={() => navigate(`/services/${serviceId}`)} className="btn-secondary">
            <Eye className="mr-2 h-4 w-4" />
            {t('common.viewDetails')}
          </button>
          {service.status === 'stopped' && (
            <button
              onClick={() => startMutation.mutate()}
              className="btn-success"
              disabled={startMutation.isPending}
            >
              <Play className="mr-2 h-4 w-4" />
              {t('actions.start')}
            </button>
          )}
          {service.status === 'running' && (
            <>
              <button
                onClick={() => stopMutation.mutate()}
                className="btn-secondary"
                disabled={stopMutation.isPending}
              >
                <Square className="mr-2 h-4 w-4" />
                {t('actions.stop')}
              </button>
              <button
                onClick={() => restartMutation.mutate()}
                className="btn-secondary"
                disabled={restartMutation.isPending}
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                {t('actions.restart')}
              </button>
            </>
          )}
          <button onClick={handleSave} className="btn-primary" disabled={updateMutation.isPending}>
            {updateMutation.isPending ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                {t('common.saving')}
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {t('common.save')}
              </>
            )}
          </button>
        </div>
      </div>

      <div className="card">
        <div className="border-b border-gray-200">
          <nav className="flex gap-8 overflow-x-auto px-6 pt-4">
            {tabs.map((tab) => {
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
                  className={`-mb-px whitespace-nowrap border-b-2 pb-4 text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'border-primary-600 text-primary-600'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
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
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    {t('service.name')} *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder={t('service.namePlaceholder')}
                    className="input w-full"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    {t('service.description')}
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, description: e.target.value }))
                    }
                    placeholder={t('service.descriptionPlaceholder')}
                    rows={3}
                    className="input w-full resize-none"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    {t('service.transportProtocol')} *
                  </label>
                  <div className="space-y-3">
                    {protocolOptions.map((opt) => (
                      <label
                        key={opt.value}
                        className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors ${
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
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              transport_type: e.target.value as TransportType,
                            }))
                          }
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
                <div className="grid grid-cols-1 gap-4 border-t border-gray-200 pt-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      {t('service.containerId')}
                    </label>
                    <p className="font-mono text-sm text-gray-500">
                      {(service as any).container_id || t('common.notAvailable')}
                    </p>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      {t('service.imageTag')}
                    </label>
                    <p className="font-mono text-sm text-gray-500">
                      {(service as any).image_tag || t('common.notAvailable')}
                    </p>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      {t('service.currentVersion')}
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
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  {t('service.validateCode')}
                </button>
              </div>
              <div className="overflow-hidden rounded-lg border border-gray-200">
                <textarea
                  value={formData.code}
                  onChange={(e) => setFormData((prev) => ({ ...prev, code: e.target.value }))}
                  className="h-96 w-full resize-none bg-gray-50 p-4 font-mono text-sm focus:bg-white focus:outline-none"
                  spellCheck={false}
                  placeholder={t('service.codePlaceholder')}
                />
              </div>
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Python 3.11+
                </div>
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                  {t('service.pythonRequired')}
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
                <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
                  <Package className="h-5 w-5" />
                  {t('service.pythonDeps')}
                </h3>
                <p className="mb-4 text-sm text-gray-500">{t('service.pythonDepsHint')}</p>
                <div className="overflow-hidden rounded-lg border border-gray-200">
                  <textarea
                    value={formData.extra_dependencies}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, extra_dependencies: e.target.value }))
                    }
                    className="h-48 w-full resize-none bg-gray-50 p-4 font-mono text-sm focus:bg-white focus:outline-none"
                    placeholder={t('service.depsPlaceholder')}
                  />
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    {t('service.dependencyConstraints')}
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-blue-500" />
                    {t('service.mcpIncluded')}
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                    <Database className="h-5 w-5" />
                    {t('service.envVars')}
                  </h3>
                  <button onClick={addEnvVar} className="btn-secondary py-2 text-sm">
                    <Plus className="mr-2 h-4 w-4" />
                    {t('service.addVariable')}
                  </button>
                </div>
                <div className="space-y-3">
                  {formData.env_vars.map((env, index) => (
                    <div key={index} className="flex flex-col gap-3 sm:flex-row sm:items-center">
                      <input
                        type="text"
                        value={env.key}
                        onChange={(e) => updateEnvVar(index, 'key', e.target.value)}
                        placeholder={t('service.envNamePlaceholder')}
                        className="input flex-1"
                      />
                      <span className="hidden text-gray-400 sm:inline">=</span>
                      <input
                        type="text"
                        value={env.value}
                        onChange={(e) => updateEnvVar(index, 'value', e.target.value)}
                        placeholder={t('service.envValuePlaceholder')}
                        className="input flex-1"
                      />
                      {formData.env_vars.length > 1 && (
                        <button
                          onClick={() => removeEnvVar(index)}
                          className="rounded-lg p-2 text-red-500 hover:bg-red-50"
                          title={t('common.remove')}
                        >
                          <AlertCircle className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
                  <Play className="h-5 w-5" />
                  {t('service.deployActions')}
                </h3>
                <div className="flex gap-3">
                  <button
                    onClick={() => deployMutation.mutate()}
                    className="btn-primary"
                    disabled={deployMutation.isPending}
                  >
                    {deployMutation.isPending ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        {t('service.deploying')}
                      </>
                    ) : (
                      <>
                        <Play className="mr-2 h-4 w-4" />
                        {t('service.redeploy')}
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
                  <span className="text-sm font-medium text-gray-700">{t('service.logsTitle')}</span>
                </div>
                <div className="text-xs text-gray-500">
                  {t('service.lastUpdated', { time: lastUpdated })}
                </div>
              </div>
              <div className="h-96 overflow-y-auto rounded-lg bg-gray-900 p-4 font-mono text-sm text-gray-100">
                {logs?.logs ? (
                  <pre className="whitespace-pre-wrap">{logs.logs}</pre>
                ) : (
                  <p className="text-gray-500">{t('service.noLogs')}</p>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}
