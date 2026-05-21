import { Outlet, Link, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Menu, Home, ChevronRight } from 'lucide-react'
import { useUIStore } from '@/store/uiStore'

interface BreadcrumbItem {
  label: string
  path?: string
  icon?: React.ComponentType<any>
  isLast?: boolean
}

const breadcrumbMap: Record<string, BreadcrumbItem[]> = {
  '/dashboard': [{ label: '仪表盘', icon: Home }],
  '/services': [{ label: '服务', icon: Home }, { label: '服务列表' }],
  '/services/new': [{ label: '服务', icon: Home }, { label: '服务列表', path: '/services' }, { label: '创建服务' }],
  '/templates': [{ label: '模板', icon: Home }, { label: '模板库' }],
  '/admin/users': [{ label: '管理', icon: Home }, { label: '用户管理' }],
  '/admin/alerts': [{ label: '管理', icon: Home }, { label: '告警管理' }],
  '/admin/docker': [{ label: '管理', icon: Home }, { label: 'Docker管理' }],
  '/admin/audit': [{ label: '管理', icon: Home }, { label: '审计日志' }],
}

export function MainLayout() {
  const toggleSidebar = useUIStore((state) => state.toggleSidebar)
  const location = useLocation()

  const getBreadcrumbs = (): BreadcrumbItem[] => {
    const pathSegments = location.pathname.split('/').filter(Boolean)
    const breadcrumbs: BreadcrumbItem[] = []

    if (location.pathname.startsWith('/services/') && pathSegments.length >= 2) {
      const action = pathSegments[2]

      breadcrumbs.push({ label: '服务', icon: Home, path: '/services' })
      breadcrumbs.push({ label: '服务详情' })

      if (action === 'edit') {
        breadcrumbs.push({ label: '编辑服务' })
      } else if (action === 'tools') {
        breadcrumbs.push({ label: '工具管理' })
      } else if (action === 'resources') {
        breadcrumbs.push({ label: '资源管理' })
      } else if (action === 'versions') {
        breadcrumbs.push({ label: '版本管理' })
      }
    } else {
      const exactMatch = breadcrumbMap[location.pathname]
      if (exactMatch) {
        return exactMatch.map((item, index) => ({
          ...item,
          isLast: index === exactMatch.length - 1,
        }))
      }

      if (location.pathname.startsWith('/services/')) {
        return [
          { label: '服务', icon: Home, path: '/services' },
          { label: '服务详情' },
        ]
      }
    }

    return breadcrumbs
  }

  const breadcrumbs = getBreadcrumbs()

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <main className="min-h-screen lg:pl-64">
        <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-sm border-b border-gray-200 px-4 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm overflow-x-auto">
              <Link
                to="/dashboard"
                className="text-gray-500 hover:text-primary-600 transition-colors flex-shrink-0"
              >
                <Home className="h-4 w-4" />
              </Link>
              {breadcrumbs.map((crumb, index) => (
                <div key={index} className="flex items-center gap-2 flex-shrink-0">
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                  {crumb.path && !crumb.isLast ? (
                    <Link
                      to={crumb.path}
                      className="text-gray-500 hover:text-primary-600 transition-colors"
                    >
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className={`${crumb.isLast ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                      {crumb.label}
                    </span>
                  )}
                </div>
              ))}
            </div>
            <button
              onClick={toggleSidebar}
              className="lg:hidden btn-secondary p-2 flex-shrink-0"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
        <div className="p-4 lg:p-8 pt-4">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
