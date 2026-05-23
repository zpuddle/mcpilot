import { Outlet, Link, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Home, ChevronRight } from 'lucide-react'
import { useI18n, type TranslationKey } from '@/i18n'

interface BreadcrumbItem {
  labelKey: TranslationKey
  path?: string
  icon?: React.ComponentType<any>
  isLast?: boolean
}

const breadcrumbMap: Record<string, BreadcrumbItem[]> = {
  '/dashboard': [{ labelKey: 'nav.dashboard', icon: Home }],
  '/services': [{ labelKey: 'nav.services', icon: Home }, { labelKey: 'nav.serviceList' }],
  '/services/new': [
    { labelKey: 'nav.services', icon: Home },
    { labelKey: 'nav.serviceList', path: '/services' },
    { labelKey: 'nav.createService' },
  ],
  '/templates': [{ labelKey: 'nav.templates', icon: Home }, { labelKey: 'nav.templateLibrary' }],
  '/admin/users': [{ labelKey: 'nav.admin', icon: Home }, { labelKey: 'nav.users' }],
  '/admin/alerts': [{ labelKey: 'nav.admin', icon: Home }, { labelKey: 'nav.alerts' }],
  '/admin/docker': [{ labelKey: 'nav.admin', icon: Home }, { labelKey: 'nav.docker' }],
  '/admin/audit': [{ labelKey: 'nav.admin', icon: Home }, { labelKey: 'nav.audit' }],
}

export function MainLayout() {
  const location = useLocation()
  const { t } = useI18n()

  const getBreadcrumbs = (): BreadcrumbItem[] => {
    const pathSegments = location.pathname.split('/').filter(Boolean)
    const breadcrumbs: BreadcrumbItem[] = []

    if (location.pathname.startsWith('/services/') && pathSegments.length >= 2) {
      const action = pathSegments[2]

      breadcrumbs.push({ labelKey: 'nav.services', icon: Home, path: '/services' })
      breadcrumbs.push({ labelKey: 'nav.serviceDetail' })

      if (action === 'edit') {
        breadcrumbs.push({ labelKey: 'nav.editService' })
      } else if (action === 'tools') {
        breadcrumbs.push({ labelKey: 'nav.tools' })
      } else if (action === 'resources') {
        breadcrumbs.push({ labelKey: 'nav.resources' })
      } else if (action === 'versions') {
        breadcrumbs.push({ labelKey: 'nav.versions' })
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
          { labelKey: 'nav.services', icon: Home, path: '/services' },
          { labelKey: 'nav.serviceDetail' },
        ]
      }
    }

    return breadcrumbs.map((item, index) => ({
      ...item,
      isLast: index === breadcrumbs.length - 1,
    }))
  }

  const breadcrumbs = getBreadcrumbs()

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <main className="min-h-screen lg:pl-64">
        <div className="sticky top-0 z-30 border-b border-slate-200 bg-white/85 px-4 py-3 backdrop-blur-sm lg:px-8">
          <div className="flex items-center">
            <div className="flex items-center gap-2 overflow-x-auto pl-12 text-sm lg:pl-0">
              <Link
                to="/dashboard"
                className="flex-shrink-0 text-slate-500 transition-colors hover:text-primary-600"
              >
                <Home className="h-4 w-4" />
              </Link>
              {breadcrumbs.map((crumb, index) => (
                <div key={index} className="flex items-center gap-2 flex-shrink-0">
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                  {crumb.path && !crumb.isLast ? (
                    <Link
                      to={crumb.path}
                      className="text-slate-500 transition-colors hover:text-primary-600"
                    >
                      {t(crumb.labelKey)}
                    </Link>
                  ) : (
                    <span className={`${crumb.isLast ? 'font-medium text-slate-900' : 'text-slate-500'}`}>
                      {t(crumb.labelKey)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="p-4 lg:p-8 pt-4">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
