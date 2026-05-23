import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Code2,
  Cpu,
  Layers,
  Plus,
  RefreshCw,
  Server,
  ShieldCheck,
  Square,
  Zap,
} from 'lucide-react'
import { servicesApi } from '@/api/services'
import { StatsCardSkeleton } from '@/components/common/Skeleton'
import { StatusBadge } from '@/components/common/StatusBadge'
import type { DashboardActivity, ServiceLifecycleStatus } from '@/types'
import { useI18n, type TranslationKey } from '@/i18n'
import { cn, formatRelativeTime } from '@/utils/formatters'

const statusStyles: Record<ServiceLifecycleStatus, { bar: string; dot: string }> = {
  draft: { bar: 'bg-slate-300', dot: 'bg-slate-400' },
  building: { bar: 'bg-warning-400', dot: 'bg-warning-500' },
  running: { bar: 'bg-success-500', dot: 'bg-success-500' },
  stopped: { bar: 'bg-slate-500', dot: 'bg-slate-500' },
  error: { bar: 'bg-danger-500', dot: 'bg-danger-500' },
}

const activityMeta: Record<string, { labelKey: TranslationKey; icon: typeof Cpu }> = {
  build: { labelKey: 'actions.build', icon: Cpu },
  start: { labelKey: 'actions.start', icon: Zap },
  stop: { labelKey: 'actions.stop', icon: Square },
  restart: { labelKey: 'actions.restart', icon: RefreshCw },
}

function MetricCard({
  title,
  value,
  description,
  icon: Icon,
  className,
}: {
  title: string
  value: number | string
  description: string
  icon: typeof Server
  className: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="card p-5"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-2 text-3xl font-semibold text-slate-950">{value}</p>
          <p className="mt-2 text-sm text-slate-500">{description}</p>
        </div>
        <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-lg', className)}>
          <Icon className="h-5 w-5 text-white" />
        </div>
      </div>
    </motion.div>
  )
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex min-h-40 flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
      <Server className="h-8 w-8 text-slate-300" />
      <p className="mt-3 text-sm font-medium text-slate-800">{title}</p>
      <p className="mt-1 text-sm text-slate-500">{description}</p>
    </div>
  )
}

function ActivityIcon({ activity }: { activity: DashboardActivity }) {
  const meta = activityMeta[activity.type] ?? { labelKey: 'common.details', icon: Activity }
  const Icon = meta.icon
  const isSuccess = activity.status === 'success'
  const isFailed = activity.status === 'failed'

  return (
    <div
      className={cn(
        'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border',
        isSuccess && 'border-success-200 bg-success-50 text-success-700',
        isFailed && 'border-danger-200 bg-danger-50 text-danger-700',
        !isSuccess && !isFailed && 'border-warning-200 bg-warning-50 text-warning-700'
      )}
    >
      <Icon className="h-4 w-4" />
    </div>
  )
}

export function Dashboard() {
  const { t, locale } = useI18n()
  const { data: overview, isLoading } = useQuery({
    queryKey: ['dashboard', 'overview'],
    queryFn: servicesApi.getDashboardOverview,
  })

  const stats = overview?.stats
  const maxStatusCount = useMemo(
    () => Math.max(...(overview?.status_breakdown.map((item) => item.count) ?? [0]), 1),
    [overview?.status_breakdown]
  )

  const attentionText = stats?.errors
    ? t('dashboard.errorCount', { count: stats.errors })
    : stats?.building
      ? t('dashboard.buildingCount', { count: stats.building })
      : t('dashboard.noAttention')

  return (
    <div className="space-y-7">
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-sm font-medium text-primary-700">
              <ShieldCheck className="h-4 w-4" />
              {t('dashboard.console')}
            </div>
            <h1 className="mt-2 text-2xl font-semibold text-slate-950">{t('dashboard.title')}</h1>
            <p className="mt-1 max-w-2xl text-sm text-slate-500">
              {t('dashboard.subtitle')}
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link to="/templates" className="btn-secondary">
              <Layers className="mr-2 h-4 w-4" />
              {t('nav.templateLibrary')}
            </Link>
            <Link to="/services/new" className="btn-primary">
              <Plus className="mr-2 h-4 w-4" />
              {t('service.createService')}
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {isLoading ? (
          <>
            <StatsCardSkeleton />
            <StatsCardSkeleton />
            <StatsCardSkeleton />
            <StatsCardSkeleton />
          </>
        ) : (
          <>
            <MetricCard
              title={t('dashboard.serviceTotal')}
              value={stats?.total ?? 0}
              description={t('dashboard.draftCount', { count: stats?.draft ?? 0 })}
              icon={Server}
              className="bg-primary-600"
            />
            <MetricCard
              title={t('dashboard.running')}
              value={stats?.running ?? 0}
              description={t('dashboard.runningRate', { rate: overview?.health.running_rate ?? 0 })}
              icon={Zap}
              className="bg-success-600"
            />
            <MetricCard
              title={t('dashboard.attention')}
              value={overview?.health.attention_count ?? 0}
              description={attentionText}
              icon={AlertTriangle}
              className="bg-danger-600"
            />
            <MetricCard
              title={t('dashboard.deployable')}
              value={overview?.health.ready_count ?? 0}
              description={t('dashboard.stoppedCount', { count: stats?.stopped ?? 0 })}
              icon={CheckCircle2}
              className="bg-cyan-600"
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <section className="card p-5 xl:col-span-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-slate-950">{t('dashboard.statusDistribution')}</h2>
              <p className="mt-1 text-sm text-slate-500">{t('dashboard.statusDistributionHint')}</p>
            </div>
            <Cpu className="h-5 w-5 text-slate-400" />
          </div>

          <div className="mt-5 space-y-4">
            {isLoading ? (
              <div className="space-y-4">
                <div className="skeleton h-5 w-full" />
                <div className="skeleton h-5 w-10/12" />
                <div className="skeleton h-5 w-8/12" />
                <div className="skeleton h-5 w-9/12" />
              </div>
            ) : (
              overview?.status_breakdown.map((item) => {
                const width = `${Math.max((item.count / maxStatusCount) * 100, item.count ? 12 : 3)}%`
                return (
                  <div key={item.status} className="space-y-2">
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <span className={cn('h-2 w-2 rounded-full', statusStyles[item.status].dot)} />
                        <span className="font-medium text-slate-700">
                          {t(`status.${item.status}` as TranslationKey)}
                        </span>
                      </div>
                      <span className="tabular-nums text-slate-500">{item.count}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div className={cn('h-full rounded-full', statusStyles[item.status].bar)} style={{ width }} />
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </section>

        <section className="card overflow-hidden xl:col-span-8">
          <div className="flex items-center justify-between gap-4 border-b border-slate-100 p-5">
            <div>
              <h2 className="text-base font-semibold text-slate-950">{t('dashboard.recentServices')}</h2>
              <p className="mt-1 text-sm text-slate-500">{t('dashboard.recentServicesHint')}</p>
            </div>
            <Link to="/services" className="inline-flex items-center gap-1 text-sm font-medium text-primary-700 hover:text-primary-800">
              {t('common.viewAll')}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {isLoading ? (
              <div className="space-y-3 p-5">
                <div className="skeleton h-14 w-full" />
                <div className="skeleton h-14 w-full" />
                <div className="skeleton h-14 w-full" />
              </div>
            ) : overview?.recent_services.length ? (
              overview.recent_services.map((service, index) => (
                <motion.div
                  key={service.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04 }}
                >
                  <Link
                    to={`/services/${service.id}`}
                    className="grid gap-4 p-4 transition-colors hover:bg-slate-50 md:grid-cols-[minmax(0,1fr)_auto]"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-700">
                        <Code2 className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900">{service.name}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                          <span>{service.transport_type}</span>
                          <span>v{service.current_version}</span>
                          <span>{service.port ? `:${service.port}` : t('dashboard.noPort')}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-4 md:justify-end">
                      <StatusBadge status={service.status} />
                      <span className="inline-flex items-center gap-1 whitespace-nowrap text-xs text-slate-500">
                        <Clock className="h-3.5 w-3.5" />
                        {service.updatedAt ? formatRelativeTime(service.updatedAt, locale) : t('dashboard.noUpdate')}
                      </span>
                    </div>
                  </Link>
                </motion.div>
              ))
            ) : (
              <div className="p-5">
                <EmptyState
                  title={t('dashboard.emptyServicesTitle')}
                  description={t('dashboard.emptyServicesDescription')}
                />
              </div>
            )}
          </div>
        </section>
      </div>

      <section className="card p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-slate-950">{t('dashboard.recentActivity')}</h2>
            <p className="mt-1 text-sm text-slate-500">{t('dashboard.recentActivityHint')}</p>
          </div>
          <Activity className="h-5 w-5 text-slate-400" />
        </div>

        <div className="mt-5">
          {isLoading ? (
            <div className="grid gap-3 md:grid-cols-2">
              <div className="skeleton h-20 w-full" />
              <div className="skeleton h-20 w-full" />
            </div>
          ) : overview?.recent_activities.length ? (
            <div className="grid gap-3 md:grid-cols-2">
              {overview.recent_activities.slice(0, 6).map((activity) => {
                const meta = activityMeta[activity.type] ?? { labelKey: 'common.details', icon: Activity }
                return (
                  <div key={activity.id} className="flex gap-3 rounded-lg border border-slate-100 bg-slate-50 p-4">
                    <ActivityIcon activity={activity} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-900">
                        {activityMeta[activity.type] ? t(meta.labelKey) : activity.type}
                        <span className="text-primary-700"> {activity.service}</span>
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {activity.user} · {activity.time ? formatRelativeTime(activity.time, locale) : t('common.justNow')}
                      </p>
                    </div>
                    <span
                      className={cn(
                        'h-fit rounded-full px-2 py-0.5 text-xs font-medium',
                        activity.status === 'success' && 'bg-success-100 text-success-800',
                        activity.status === 'failed' && 'bg-danger-100 text-danger-800',
                        activity.status !== 'success' && activity.status !== 'failed' && 'bg-warning-100 text-warning-800'
                      )}
                    >
                      {activity.status === 'success'
                        ? t('common.success')
                        : activity.status === 'failed'
                          ? t('common.failed')
                          : t('common.inProgress')}
                    </span>
                  </div>
                )
              })}
            </div>
          ) : (
            <EmptyState
              title={t('dashboard.emptyActivityTitle')}
              description={t('dashboard.emptyActivityDescription')}
            />
          )}
        </div>
      </section>
    </div>
  )
}
