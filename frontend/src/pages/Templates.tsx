import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
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
import { formatRelativeTime, truncate } from '@/utils/formatters'
import { templatesApi } from '@/api/templates'

export function Templates() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('全部')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState<number | null>(null)
  const [showUseTemplateModal, setShowUseTemplateModal] = useState<number | null>(null)
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: templates, isLoading } = useQuery({
    queryKey: ['templates', category],
    queryFn: () => templatesApi.getTemplates(category === '全部' ? {} : { category }),
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
      toast.success('模板创建成功！')
      setShowCreateModal(false)
    },
    onError: (error) => {
      toast.error('创建模板失败')
      console.error(error)
    },
  })

  const useTemplateMutation = useMutation({
    mutationFn: ({ templateId, data }: { templateId: number; data: { name: string; description: string } }) =>
      templatesApi.createServiceFromTemplate(templateId, data),
    onSuccess: (service) => {
      toast.success('服务创建成功！')
      navigate(`/services/${service.id}`)
    },
    onError: (error) => {
      toast.error('创建服务失败')
      console.error(error)
    },
  })

  const filteredTemplates = (templates || []).filter((template) => {
    const matchesSearch = template.name.toLowerCase().includes(search.toLowerCase()) ||
      template.description.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = category === '全部' || template.category === category
    return matchesSearch && matchesCategory
  })

  const categories = ['全部', 'API', 'Database', 'File System', 'DevOps', 'AI', 'General']

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
          <h1 className="text-2xl font-bold text-gray-900">模板管理</h1>
          <p className="text-gray-500 mt-1">使用模板快速创建服务</p>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="btn-primary">
          <Plus className="h-4 w-4 mr-2" />
          提交模板
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="搜索模板..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10"
          />
        </div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="input w-full sm:w-auto"
        >
          {categories.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredTemplates.map((template, index) => (
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
                            官方
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-1">{template.category}</p>
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
                        <span>{formatRelativeTime(template.created_at)}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setShowDetailModal(template.id)}
                        className="btn-secondary py-2 text-sm"
                      >
                        查看详情
                      </button>
                      <button 
                        onClick={() => setShowUseTemplateModal(template.id)}
                        className="btn-primary py-2 text-sm"
                        disabled={useTemplateMutation.isPending}
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        使用模板
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="card p-12 text-center">
          <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">没有找到模板</h3>
          <p className="text-gray-500">
            {search || category !== '全部'
              ? '尝试调整搜索条件或分类'
              : '还没有模板，快来提交第一个！'}
          </p>
        </div>
      )}

      {showCreateModal && (
        <TemplateCreateModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={(data) => createMutation.mutate(data)}
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
          templateId={showUseTemplateModal}
          onClose={() => setShowUseTemplateModal(null)}
          onSubmit={(data) => {
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
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
          <h2 className="text-lg font-semibold text-gray-900">提交新模板</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                模板名称 *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="例如: Weather API 模板"
                className="input w-full"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                标识符（Slug）
              </label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="weather-api-template"
                className="input w-full"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              描述 *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="描述这个模板的功能和用途..."
              rows={3}
              className="input w-full resize-none"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                分类
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="input w-full"
              >
                <option value="API">API</option>
                <option value="Database">数据库</option>
                <option value="File System">文件系统</option>
                <option value="DevOps">DevOps</option>
                <option value="AI">AI</option>
                <option value="General">通用</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                图标
              </label>
              <input
                type="text"
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                placeholder="code"
                className="input w-full"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              代码模板 *
            </label>
            <textarea
              value={formData.code_template}
              onChange={(e) => setFormData({ ...formData, code_template: e.target.value })}
              placeholder="from mcp.server.fastmcp import FastMCP&#10;&#10;mcp = FastMCP('My Service')&#10;&#10;..."
              rows={12}
              className="input w-full resize-none font-mono text-sm"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Python 依赖
              </label>
              <textarea
                value={formData.dependencies}
                onChange={(e) => setFormData({ ...formData, dependencies: e.target.value })}
                placeholder="requests>=2.31.0&#10;openai>=1.0.0"
                rows={3}
                className="input w-full resize-none font-mono text-sm"
              />
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  工具配置（JSON）
                </label>
                <textarea
                  value={formData.tools_template}
                  onChange={(e) => setFormData({ ...formData, tools_template: e.target.value })}
                  placeholder="[]"
                  rows={3}
                  className="input w-full resize-none font-mono text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  资源配置（JSON）
                </label>
                <textarea
                  value={formData.resources_template}
                  onChange={(e) => setFormData({ ...formData, resources_template: e.target.value })}
                  placeholder="[]"
                  rows={3}
                  className="input w-full resize-none font-mono text-sm"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              环境变量（JSON）
            </label>
            <textarea
              value={formData.env_vars_template}
              onChange={(e) => setFormData({ ...formData, env_vars_template: e.target.value })}
              placeholder="{}"
              rows={2}
              className="input w-full resize-none font-mono text-sm"
            />
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
            <button type="button" onClick={onClose} className="btn-secondary">
              取消
            </button>
            <button type="submit" className="btn-primary" disabled={isLoading}>
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? '创建中...' : '创建模板'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function TemplateDetailModal({ template, onClose, onUseTemplate }: any) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{template.name}</h2>
            <p className="text-sm text-gray-500 mt-1">{template.category}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-6 space-y-6">
          <div>
            <h3 className="font-medium text-gray-900 mb-2">描述</h3>
            <p className="text-gray-600">{template.description}</p>
          </div>

          {template.code_template && (
            <div>
              <h3 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                <Package className="h-4 w-4" />
                代码模板
              </h3>
              <div className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto">
                <pre className="text-sm whitespace-pre-wrap">{template.code_template}</pre>
              </div>
            </div>
          )}

          {template.dependencies && (
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Python 依赖</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <pre className="text-sm text-gray-700 whitespace-pre-wrap">{template.dependencies}</pre>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span>使用次数: {template.usage_count}</span>
              <span>创建时间: {new Date(template.created_at).toLocaleDateString()}</span>
            </div>
            <div className="flex gap-3">
              <button onClick={onClose} className="btn-secondary">
                关闭
              </button>
              <button onClick={onUseTemplate} className="btn-primary">
                <Copy className="h-4 w-4 mr-2" />
                使用此模板
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function UseTemplateModal({ templateId, onClose, onSubmit, isLoading }: any) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.name.trim() && formData.description.trim()) {
      onSubmit(formData)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-lg w-full">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">使用模板创建服务</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              服务名称 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="请输入服务名称"
              className="input w-full"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              服务描述 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="请输入服务描述"
              rows={4}
              className="input w-full resize-none"
              required
            />
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
            <button type="button" onClick={onClose} className="btn-secondary">
              取消
            </button>
            <button 
              type="submit" 
              className="btn-primary"
              disabled={isLoading || !formData.name.trim() || !formData.description.trim()}
            >
              {isLoading ? '创建中...' : '创建服务'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
