import { Link, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import type { ComponentType } from 'react'
import {
  Activity,
  BookOpen,
  Cpu,
  LayoutDashboard,
  LogOut,
  Menu,
  Server,
  ShieldAlert,
  Users,
  X,
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useUIStore } from '@/store/uiStore'
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher'
import { useI18n, type TranslationKey } from '@/i18n'
import { cn } from '@/utils/formatters'

type SidebarItem = {
  labelKey: TranslationKey
  icon: ComponentType<{ className?: string }>
  path: string
}

const navItems = [
  { labelKey: 'nav.dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { labelKey: 'nav.services', icon: Server, path: '/services' },
  { labelKey: 'nav.templates', icon: BookOpen, path: '/templates' },
] satisfies SidebarItem[]

const adminItems = [
  { labelKey: 'nav.users', icon: Users, path: '/admin/users' },
  { labelKey: 'nav.alerts', icon: ShieldAlert, path: '/admin/alerts' },
  { labelKey: 'nav.docker', icon: Cpu, path: '/admin/docker' },
  { labelKey: 'nav.audit', icon: Activity, path: '/admin/audit' },
] satisfies SidebarItem[]

function Brand() {
  const { t } = useI18n()

  return (
    <div className="border-b border-slate-200 p-5">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-600">
          <Cpu className="h-5 w-5 text-white" />
        </div>
        <div className="min-w-0">
          <h1 className="text-lg font-semibold leading-6 text-slate-950">{t('app.name')}</h1>
          <p className="truncate text-xs text-slate-500">{t('app.tagline')}</p>
        </div>
      </div>
    </div>
  )
}

function NavigationContent({ onNavigate }: { onNavigate: () => void }) {
  const location = useLocation()
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const navigate = useNavigate()
  const { t } = useI18n()
  const isAdmin = user?.role_name === 'admin'

  const handleLogout = () => {
    logout()
    onNavigate()
    navigate('/login', { replace: true })
  }

  const renderLink = (item: SidebarItem) => {
    const isActive =
      item.path === '/dashboard'
        ? location.pathname === item.path
        : location.pathname.startsWith(item.path)

    return (
      <Link
        key={item.path}
        to={item.path}
        onClick={onNavigate}
        className={cn(
          'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
          isActive
            ? 'bg-primary-50 text-primary-700 ring-1 ring-primary-100'
            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
        )}
      >
        <item.icon className="h-5 w-5 shrink-0" />
        <span className="truncate">{t(item.labelKey)}</span>
      </Link>
    )
  }

  return (
    <>
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {navItems.map(renderLink)}

        {isAdmin && (
          <div className="pt-5">
            <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
              {t('nav.admin')}
            </p>
            <div className="space-y-1">{adminItems.map(renderLink)}</div>
          </div>
        )}
      </nav>

      <div className="border-t border-slate-200 p-3">
        <div className="mb-3 px-1">
          <LanguageSwitcher />
        </div>
        <div className="mb-2 flex items-center gap-3 rounded-lg bg-slate-50 p-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cyan-600 text-sm font-semibold text-white">
            {user?.username?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-slate-900">{user?.username || 'User'}</p>
            <p className="truncate text-xs text-slate-500">{user?.email || t('layout.missingEmail')}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-950"
        >
          <LogOut className="h-5 w-5" />
          {t('layout.logout')}
        </button>
      </div>
    </>
  )
}

export function Sidebar() {
  const sidebarOpen = useUIStore((state) => state.sidebarOpen)
  const toggleSidebar = useUIStore((state) => state.toggleSidebar)
  const setSidebarOpen = useUIStore((state) => state.setSidebarOpen)
  const { t } = useI18n()

  const closeMobileSidebar = () => {
    if (window.innerWidth < 1024) {
      setSidebarOpen(false)
    }
  }

  return (
    <>
      <button
        onClick={toggleSidebar}
        className="btn-secondary fixed left-4 top-4 z-50 p-2 lg:hidden"
        aria-label={sidebarOpen ? t('layout.closeSidebar') : t('layout.openSidebar')}
      >
        {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      <aside className="fixed bottom-0 left-0 top-0 z-40 hidden w-64 flex-col border-r border-slate-200 bg-white lg:flex">
        <Brand />
        <NavigationContent onNavigate={closeMobileSidebar} />
      </aside>

      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden"
            />
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: 'spring', damping: 28, stiffness: 240 }}
              className="fixed bottom-0 left-0 top-0 z-50 flex w-72 max-w-[85vw] flex-col border-r border-slate-200 bg-white shadow-xl lg:hidden"
            >
              <Brand />
              <NavigationContent onNavigate={closeMobileSidebar} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
