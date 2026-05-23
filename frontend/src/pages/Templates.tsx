import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import {
  Plus,
  Search,
  FileText,
  LayoutTemplate,
  Copy,
  Star,
  Clock,
  X,
  Save,
  Package,
} from 'lucide-react'
import { templatesApi } from '@/api/templates'
import { useI18n, type TranslationKey } from '@/i18n'
import type { Template } from '@/types'
import { formatDate, formatRelativeTime, truncate } from '@/utils/formatters'

const ALL_CATEGORIES = 'all'

const categoryOptions = [
  { value: ALL_CATEGORIES, labelKey: 'templates.categoryAll' },
  { value: 'API', labelKey: 'templates.categoryApi' },
  { value: 'Database', labelKey: 'templates.categoryDatabase' },
  { value: 'File System', labelKey: 'templates.categoryFileSystem' },
  { value: 'DevOps', labelKey: 'templates.categoryDevOps' },
  { value: 'AI', labelKey: 'templates.categoryAi' },
  { value: 'General', labelKey: 'templates.categoryGeneral' },
] as const satisfies readonly { value: string; labelKey: TranslationKey }[]

function getCategoryLabelKey(category: string): TranslationKey | null {
  return categoryOptions.find((option) => option.value === category)?.labelKey ?? null
}

export function Templates() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState(ALL_CATEGORIES)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState<number | null>(null)
  const [showUseTemplateModal, setShowUseTemplateModal] = useState<number | null>(null)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { locale, t } = useI18n()

  const { data: templates, isLoading } = useQuery({
    queryKey: ['templates', category],
    queryFn: () =>
      templatesApi.getTemplates(category === ALL_CATEGORIES ? {} : { category }),
  })

  const { data: selectedTemplate } = useQuery({
    queryKey: ['template', showDetailModal],
    queryFn: () => templatesApi.getTemplate(showDetailModal!),
    enabled: !!showDetailModal,
  })

  const createMutation = useMutation({
    mutationFn: (data: any) => templatesApi.createTemplate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] })
      toast.success(t('templates.created'))
      setShowCreateModal(false)
    },
    onError: (error) => {
      toast.error(t('templates.createFailed'))
      console.error(error)
    },
  })

  const useTemplateMutation = useMutation({
    mutationFn: ({
      templateId,
      data,
    }: {
      templateId: number
      data: { name: string; description: string }
    }) => templatesApi.createServiceFromTemplate(templateId, data),
    onSuccess: (service) => {
      toast.success(t('templates.serviceCreated'))
      navigate(`/services/${service.id}`)
    },
    onError: (error) => {
      toast.error(t('templates.serviceCreateFailed'))
      console.error(error)
    },
  })

  const filteredTemplates = (templates || []).filter((template) => {
    const normalizedSearch = search.toLowerCase()
    const matchesSearch =
      template.name.toLowerCase().includes(normalizedSearch) ||
      template.description.toLowerCase().includes(normalizedSearch)
    const matchesCategory = category === ALL_CATEGORIES || template.category === category
    return matchesSearch && matchesCategory
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="w-48 h-8 bg-gray-200 rounded animate-pulse"></div>
            <div className="w-32 h-4 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card p-6">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 bg-gray-200 rounded-xl animate-pulse"></div>
                <div className="flex-1 space-y-2">
                  <div className="w-32 h-6 bg-gray-200 rounded animate-pulse"></div>
                  <div className="w-full h-4 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('templates.management')}</h1>
          <p className="text-gray-500 mt-1">{t('templates.subtitle')}</p>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="btn-primary">
          <Plus className="h-4 w-4 mr-2" />
          {t('templates.submitTemplate')}
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder={t('templates.searchPlaceholder')}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="input pl-10"
          />
        </div>
        <select
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          className="input w-full sm:w-auto"
        >
          {categoryOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {t(option.labelKey)}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredTemplates.map((template, index) => {
          const categoryLabelKey = getCategoryLabelKey(template.category)

          return (
            <motion.div
              key={template.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="card p-6 hover:shadow-lg transition-all h-full">
                <div className="flex items-start gap-4 h-full">
                  <div className="h-14 w-14 bg-gradient-to-br from-accent-500 to-primary-500 rounded-xl flex items-center justify-center shrink-0">
                    <LayoutTemplate className="h-7 w-7 text-white" />
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900">{template.name}</h3>
                          {template.is_builtin && (
                            <span className="px-2 py-0.5 bg-primary-100 text-primary-700 text-xs font-medium rounded-full">
                              {t('common.official')}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          {categoryLabelKey ? t(categoryLabelKey) : template.category}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mt-2 flex-1">
                      {truncate(template.description, 120)}
                    </p>
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                          <span>{template.usage_count}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{formatRelativeTime(template.created_at, locale)}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setShowDetailModal(template.id)}
                          className="btn-secondary py-2 text-sm"
                        >
                          {t('common.viewDetails')}
                        </button>
                        <button
                          onClick={() => setShowUseTemplateModal(template.id)}
                          className="btn-primary py-2 text-sm"
                          disabled={useTemplateMutation.isPending}
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          {t('templates.useTemplate')}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="card p-12 text-center">
          <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">{t('templates.emptyTitle')}</h3>
          <p className="text-gray-500">
            {search || category !== ALL_CATEGORIES
              ? t('templates.noResultsFiltered')
              : t('templates.noResultsEmpty')}
          </p>
        </div>
      )}

      {showCreateModal && (
        <TemplateCreateModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={(data: any) => createMutation.mutate(data)}
          isLoading={createMutation.isPending}
        />
      )}

      {showDetailModal && selectedTemplate && (
        <TemplateDetailModal
          template={selectedTemplate}
          onClose={() => setShowDetailModal(null)}
          onUseTemplate={() => {
            setShowUseTemplateModal(selectedTemplate.id)
            setShowDetailModal(null)
          }}
        />
      )}

      {showUseTemplateModal && (
        <UseTemplateModal
          onClose={() => setShowUseTemplateModal(null)}
          onSubmit={(data: any) => {
            useTemplateMutation.mutate({ templateId: showUseTemplateModal, data })
            setShowUseTemplateModal(null)
          }}
          isLoading={useTemplateMutation.isPending}
        />
      )}
    </div>
  )
}

function TemplateCreateModal({ onClose, onSubmit, isLoading }: any) {
  const { t } = useI18n()
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    category: 'General',
    icon: 'code',
    code_template: '',
    tools_template: '[]',
    resources_template: '[]',
    env_vars_template: '{}',
    dependencies: '',
  })

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    onSubmit({
      ...formData,
      tools_template: JSON.parse(formData.tools_template || '[]'),
      resources_template: JSON.parse(formData.resources_template || '[]'),
      env_vars_template: JSON.parse(formData.env_vars_template || '{}'),
    })
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
          <h2 className="text-lg font-semibold text-gray-900">{t('templates.submitNew')}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
            aria-label={t('common.close')}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('templates.name')} *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(event) => setFormData({ ...formData, name: event.target.value })}
                placeholder={t('templates.namePlaceholder')}
                className="input w-full"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('templates.slug')}
              </label>
              <input
                type="text"
                value={formData.slug}
                onChange={(event) => setFormData({ ...formData, slug: event.target.value })}
                placeholder="weather-api-template"
                className="input w-full"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('templates.description')} *
            </label>
            <textarea
              value={formData.description}
              onChange={(event) => setFormData({ ...formData, description: event.target.value })}
              placeholder={t('templates.descriptionPlaceholder')}
              rows={3}
              className="input w-full resize-none"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('templates.category')}
              </label>
              <select
                value={formData.category}
                onChange={(event) => setFormData({ ...formData, category: event.target.value })}
                className="input w-full"
              >
                {categoryOptions
                  .filter((option) => option.value !== ALL_CATEGORIES)
                  .map((option) => (
                    <option key={option.value} value={option.value}>
                      {t(option.labelKey)}
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('templates.icon')}
              </label>
              <input
                type="text"
                value={formData.icon}
                onChange={(event) => setFormData({ ...formData, icon: event.target.value })}
                placeholder="code"
                className="input w-full"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('templates.codeTemplate')} *
            </label>
            <textarea
              value={formData.code_template}
              onChange={(event) => setFormData({ ...formData, code_template: event.target.value })}
              placeholder="from mcp.server.fastmcp import FastMCP&#10;&#10;mcp = FastMCP('My Service')&#10;&#10;..."
              rows={12}
              className="input w-full resize-none font-mono text-sm"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('templates.dependencies')}
              </label>
              <textarea
                value={formData.dependencies}
                onChange={(event) => setFormData({ ...formData, dependencies: event.target.value })}
                placeholder="requests>=2.31.0&#10;openai>=1.0.0"
                rows={3}
                className="input w-full resize-none font-mono text-sm"
              />
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('templates.toolsConfig')}
                </label>
                <textarea
                  value={formData.tools_template}
                  onChange={(event) =>
                    setFormData({ ...formData, tools_template: event.target.value })
                  }
                  placeholder="[]"
                  rows={3}
                  className="input w-full resize-none font-mono text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('templates.resourcesConfig')}
                </label>
                <textarea
                  value={formData.resources_template}
                  onChange={(event) =>
                    setFormData({ ...formData, resources_template: event.target.value })
                  }
                  placeholder="[]"
                  rows={3}
                  className="input w-full resize-none font-mono text-sm"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('templates.envVarsConfig')}
            </label>
            <textarea
              value={formData.env_vars_template}
              onChange={(event) =>
                setFormData({ ...formData, env_vars_template: event.target.value })
              }
              placeholder="{}"
              rows={2}
              className="input w-full resize-none font-mono text-sm"
            />
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
            <button type="button" onClick={onClose} className="btn-secondary">
              {t('common.cancel')}
            </button>
            <button type="submit" className="btn-primary" disabled={isLoading}>
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? t('templates.creatingTemplate') : t('common.create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function TemplateDetailModal({
  template,
  onClose,
  onUseTemplate,
}: {
  template: Template
  onClose: () => void
  onUseTemplate: () => void
}) {
  const { locale, t } = useI18n()
  const categoryLabelKey = getCategoryLabelKey(template.category)

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{template.name}</h2>
            <p className="text-sm text-gray-500 mt-1">
              {categoryLabelKey ? t(categoryLabelKey) : template.category}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
            aria-label={t('common.close')}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-6 space-y-6">
          <div>
            <h3 className="font-medium text-gray-900 mb-2">{t('templates.description')}</h3>
            <p className="text-gray-600">{template.description}</p>
          </div>

          {template.code_template && (
            <div>
              <h3 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                <Package className="h-4 w-4" />
                {t('templates.codeTemplate')}
              </h3>
              <div className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto">
                <pre className="text-sm whitespace-pre-wrap">{template.code_template}</pre>
              </div>
            </div>
          )}

          {template.dependencies && (
            <div>
              <h3 className="font-medium text-gray-900 mb-2">{t('templates.dependencies')}</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <pre className="text-sm text-gray-700 whitespace-pre-wrap">{template.dependencies}</pre>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span>{t('templates.usageCount', { count: template.usage_count })}</span>
              <span>
                {t('templates.createdAt', {
                  date: formatDate(template.created_at, locale),
                })}
              </span>
            </div>
            <div className="flex gap-3">
              <button onClick={onClose} className="btn-secondary">
                {t('common.close')}
              </button>
              <button onClick={onUseTemplate} className="btn-primary">
                <Copy className="h-4 w-4 mr-2" />
                {t('templates.useThisTemplate')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function UseTemplateModal({ onClose, onSubmit, isLoading }: any) {
  const { t } = useI18n()
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  })

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (formData.name.trim() && formData.description.trim()) {
      onSubmit(formData)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-lg w-full">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">{t('templates.useTemplateTitle')}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
            aria-label={t('common.close')}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('templates.serviceName')} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(event) => setFormData({ ...formData, name: event.target.value })}
              placeholder={t('templates.serviceNamePlaceholder')}
              className="input w-full"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('templates.serviceDescription')} <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.description}
              onChange={(event) => setFormData({ ...formData, description: event.target.value })}
              placeholder={t('templates.serviceDescriptionPlaceholder')}
              rows={4}
              className="input w-full resize-none"
              required
            />
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
            <button type="button" onClick={onClose} className="btn-secondary">
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isLoading || !formData.name.trim() || !formData.description.trim()}
            >
              {isLoading ? t('common.creating') : t('service.createService')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
