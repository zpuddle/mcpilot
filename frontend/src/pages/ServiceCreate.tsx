import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Code2,
  Database,
  FileCode,
  Layers,
  Package,
  Plus,
  Save,
  Server,
  Settings,
} from 'lucide-react'
import { servicesApi } from '@/api/services'
import { useI18n } from '@/i18n'
import type { TransportType } from '@/types'

type CreateTab = 'basic' | 'code' | 'config'

function createBlankTemplateCode(t: ReturnType<typeof useI18n>['t']) {
  return `from mcp.server.fastmcp import FastMCP

${t('service.templateCodeCommentCreate')}
mcp = FastMCP("My Service")

@mcp.tool()
def my_function(param: str) -> str:
    """${t('service.templateCodeDocstring')}"""
    ${t('service.templateCodeImplementation')}
    return f"Result: {param}"

if __name__ == "__main__":
    mcp.run()
`
}

export function ServiceCreate() {
  const navigate = useNavigate()
  const { t } = useI18n()
  const [activeTab, setActiveTab] = useState<CreateTab>('basic')

  const [formData, setFormData] = useState(() => ({
    name: '',
    description: '',
    transport_type: 'sse' as TransportType,
    code: createBlankTemplateCode(t),
    env_vars: [{ key: '', value: '' }],
    extra_dependencies: '',
  }))

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
      ],
    [t]
  )

  const createMutation = useMutation({
    mutationFn: async () => {
      const envVars: Record<string, string> = {}
      formData.env_vars.forEach((env) => {
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
      toast.success(t('service.created'))
      navigate(`/services/${service.id}`)
    },
    onError: (error) => {
      toast.error(t('service.createFailed'))
      console.error(error)
    },
  })

  const validateCodeMutation = useMutation({
    mutationFn: (code: string) => servicesApi.validateServiceCode(1, code),
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
      createMutation.mutate()
    }
  }

  const handleValidateCode = () => {
    validateCodeMutation.mutate(formData.code)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="btn-ghost p-2">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('service.createTitle')}</h1>
            <p className="mt-1 text-gray-500">{t('service.createSubtitle')}</p>
          </div>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            onClick={handleValidateCode}
            className="btn-secondary"
            disabled={validateCodeMutation.isPending}
          >
            <CheckCircle2 className="mr-2 h-4 w-4" />
            {t('service.validateCode')}
          </button>
          <button
            onClick={handleSave}
            className="btn-primary"
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                {t('service.creating')}
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {t('service.createService')}
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
                  onClick={() => setActiveTab(tab.id)}
                  className={`-mb-px border-b-2 pb-4 text-sm font-medium transition-colors ${
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
                  <Server className="h-5 w-5" />
                  {t('service.buildNotes')}
                </h3>
                <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-600">
                  <p>{t('service.buildNotesIntro')}</p>
                  <ul className="mt-2 list-inside list-disc space-y-1">
                    <li>{t('service.buildNoteImage')}</li>
                    <li>{t('service.buildNoteDeps')}</li>
                    <li>{t('service.buildNoteEnv')}</li>
                    <li>{t('service.buildNoteStart')}</li>
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
