import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { servicesApi } from '@/api/services'
import { StatsCardSkeleton } from '@/components/common/Skeleton'
import { StatusBadge } from '@/components/common/StatusBadge'
import { motion } from 'framer-motion'
import {
  Server,
  Play,
  Square,
  AlertTriangle,
  Plus,
  Cpu,
  Clock,
  ArrowUpRight,
  MoreVertical,
} from 'lucide-react'
import { formatRelativeTime } from '@/utils/formatters'

function StatsCard({
  title,
  value,
  icon: Icon,
  color,
  trend,
}: {
  title: string
  value: number
  icon: any
  color: string
  trend?: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="card p-6 hover:shadow-md transition-shadow"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
          {trend && (
            <p className="text-sm text-success-600 mt-1 flex items-center gap-1">
              <ArrowUpRight className="h-4 w-4" />
              {trend}
            </p>
          )}
        </div>
        <div className={cn('h-12 w-12 rounded-xl flex items-center justify-center', color)}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </motion.div>
  )
}

function cn(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

export function Dashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: servicesApi.getStats,
  })

  const { data: recentServices = [] } = useQuery({
    queryKey: ['dashboard', 'recent-services'],
    queryFn: servicesApi.getRecentServices,
  })

  const { data: recentActivities = [] } = useQuery({
    queryKey: ['dashboard', 'recent-activities'],
    queryFn: servicesApi.getRecentActivities,
  })

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">仪表盘</h1>
          <p className="text-gray-500 mt-1">欢迎回来，查看你的服务状态</p>
        </div>
        <Link to="/services/new" className="btn-primary">
          <Plus className="h-4 w-4 mr-2" />
          创建服务
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {isLoading ? (
          <>
            <StatsCardSkeleton />
            <StatsCardSkeleton />
            <StatsCardSkeleton />
            <StatsCardSkeleton />
          </>
        ) : (
          <>
            <StatsCard
              title="总服务数"
              value={stats?.total ?? 0}
              icon={Server}
              color="bg-gradient-to-br from-primary-500 to-primary-600"
            />
            <StatsCard
              title="运行中"
              value={stats?.running ?? 0}
              icon={Play}
              color="bg-gradient-to-br from-success-500 to-success-600"
            />
            <StatsCard
              title="已停止"
              value={stats?.stopped ?? 0}
              icon={Square}
              color="bg-gradient-to-br from-gray-500 to-gray-600"
            />
            <StatsCard
              title="异常"
              value={stats?.error ?? 0}
              icon={AlertTriangle}
              color="bg-gradient-to-br from-danger-500 to-danger-600"
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">最近服务</h2>
            <Link to="/services" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
              查看全部
            </Link>
          </div>
          <div className="card divide-y divide-gray-100">
            {recentServices.map((service, index) => (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link
                  to={`/services/${service.id}`}
                  className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 bg-primary-100 rounded-lg flex items-center justify-center">
                      <Cpu className="h-5 w-5 text-primary-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{service.name}</p>
                      <p className="text-sm text-gray-500 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {service.updatedAt ? formatRelativeTime(service.updatedAt) : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={service.status} />
                    <MoreVertical className="h-4 w-4 text-gray-400" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">最近活动</h2>
          <div className="card p-6">
            <div className="space-y-6">
              {recentActivities.map((activity, index) => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex gap-4"
                >
                  <div className="flex flex-col items-center">
                    <div className={cn(
                      'h-8 w-8 rounded-full flex items-center justify-center',
                      activity.status === 'success'
                        ? 'bg-success-100 text-success-600'
                        : 'bg-danger-100 text-danger-600'
                    )}>
                      {activity.type === 'deploy' && <Cpu className="h-4 w-4" />}
                      {activity.type === 'start' && <Play className="h-4 w-4" />}
                      {activity.type === 'stop' && <Square className="h-4 w-4" />}
                    </div>
                    {index < recentActivities.length - 1 && (
                      <div className="w-px flex-1 bg-gray-200 mt-2" />
                    )}
                  </div>
                  <div className="flex-1 pb-4">
                    <p className="text-sm font-medium text-gray-900">
                      {activity.type === 'deploy' && '部署'}
                      {activity.type === 'start' && '启动'}
                      {activity.type === 'stop' && '停止'}
                      <span className="text-primary-600"> {activity.service}</span>
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {activity.user} · {activity.time ? formatRelativeTime(activity.time) : ''}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
