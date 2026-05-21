import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import {
  ArrowLeft,
  Plus,
  History,
  RotateCcw,
  Eye,
  Code,
  Calendar,
} from 'lucide-react'
import { servicesApi } from '@/api/services'

export function ServiceVersions() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const serviceId = id ? parseInt(id) : 0
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showVersionDetail, setShowVersionDetail] = useState<number | null>(null)
  const [changelog, setChangelog] = useState('')

  const { data: service, isLoading: serviceLoading } = useQuery({
    queryKey: ['service', serviceId],
    queryFn: () => servicesApi.getService(serviceId),
    enabled: !!serviceId,
  })

  const { data: versions, isLoading: versionsLoading } = useQuery({
    queryKey: ['versions', serviceId],
    queryFn: () => servicesApi.getVersions(serviceId),
    enabled: !!serviceId,
  })

  const { data: selectedVersion } = useQuery({
    queryKey: ['version', serviceId, showVersionDetail],
    queryFn: () => servicesApi.getVersion(serviceId, showVersionDetail!),
    enabled: !!serviceId && !!showVersionDetail,
  })

  const createVersionMutation = useMutation({
    mutationFn: (changelog: string) => servicesApi.createVersion(serviceId, changelog),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['versions', serviceId] })
      toast.success('版本创建成功！')
      setShowCreateModal(false)
      setChangelog('')
    },
    onError: (error) => {
      toast.error('创建版本失败')
      console.error(error)
    },
  })

  const rollbackMutation = useMutation({
    mutationFn: (versionId: number) => servicesApi.rollbackToVersion(serviceId, versionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service', serviceId] })
      toast.success('已成功回滚！请重新部署以应用更改。')
      setShowVersionDetail(null)
    },
    onError: (error) => {
      toast.error('回滚失败')
      console.error(error)
    },
  })

  if (serviceLoading || versionsLoading) {
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
            <h1 className="text-2xl font-bold text-gray-900">版本管理</h1>
            <p className="text-gray-500 mt-1">{service.name}</p>
          </div>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="btn-primary">
          <Plus className="h-4 w-4 mr-2" />
          创建版本
        </button>
      </div>

      {versions && versions.length > 0 ? (
        <div className="space-y-4">
          {versions.map((version, index) => (
            <motion.div
              key={version.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="card p-6"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <History className="h-6 w-6 text-primary-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold text-gray-900">{version.version_tag}</h3>
                      {version.version_tag === `v${service.current_version}` && (
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                          当前版本
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 mt-1">{version.changelog || '无版本说明'}</p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(version.created_at).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowVersionDetail(version.id)}
                    className="btn-secondary py-2 text-sm"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    查看详情
                  </button>
                  {version.version_tag !== `v${service.current_version}` && (
                    <button
                      onClick={() => {
                        if (window.confirm(`确定要回滚到 ${version.version_tag} 吗？`)) {
                          rollbackMutation.mutate(version.id)
                        }
                      }}
                      className="btn-primary py-2 text-sm"
                      disabled={rollbackMutation.isPending}
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      回滚到此版本
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="card p-12 text-center">
          <History className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">暂无版本记录</h3>
          <p className="text-gray-500 mb-6">创建你的第一个版本快照！</p>
          <button onClick={() => setShowCreateModal(true)} className="btn-primary">
            <Plus className="h-4 w-4 mr-2" />
            创建版本
          </button>
        </div>
      )}

      {/* 创建版本模态框 */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">创建新版本</h2>
              <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <Eye className="h-5 w-5" />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                createVersionMutation.mutate(changelog)
              }}
              className="p-6 space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  版本说明（Changelog）
                </label>
                <textarea
                  value={changelog}
                  onChange={(e) => setChangelog(e.target.value)}
                  placeholder="描述此版本的变更内容..."
                  rows={6}
                  className="input w-full"
                  required
                />
              </div>
              <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn-secondary"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={createVersionMutation.isPending}
                >
                  {createVersionMutation.isPending ? '创建中...' : '创建版本'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 版本详情模态框 */}
      {showVersionDetail && selectedVersion && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{selectedVersion.version_tag}</h2>
                <p className="text-sm text-gray-500 mt-1">
                  {new Date(selectedVersion.created_at).toLocaleString()}
                </p>
              </div>
              <button onClick={() => setShowVersionDetail(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                <Eye className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              {selectedVersion.changelog && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">版本说明</h3>
                  <p className="text-gray-600">{selectedVersion.changelog}</p>
                </div>
              )}

              {selectedVersion.code_snapshot && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                    <Code className="h-4 w-4" />
                    代码快照
                  </h3>
                  <div className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto">
                    <pre className="text-sm">{selectedVersion.code_snapshot}</pre>
                  </div>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setShowVersionDetail(null)}
                className="btn-secondary"
              >
                关闭
              </button>
              {selectedVersion.version_tag !== `v${service.current_version}` && (
                <button
                  onClick={() => {
                    if (window.confirm(`确定要回滚到 ${selectedVersion.version_tag} 吗？`)) {
                      rollbackMutation.mutate(selectedVersion.id)
                    }
                  }}
                  className="btn-primary"
                  disabled={rollbackMutation.isPending}
                >
                  {rollbackMutation.isPending ? '回滚中...' : '回滚到此版本'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
