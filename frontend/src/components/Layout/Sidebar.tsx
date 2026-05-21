import { Link, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useUIStore } from '@/store/uiStore'
import { cn } from '@/utils/formatters'
import {
  LayoutDashboard,
  Server,
  BookOpen,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  Cpu,
  Activity,
  ShieldAlert,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const navItems = [
  { name: '仪表盘', icon: LayoutDashboard, path: '/dashboard' },
  { name: '服务', icon: Server, path: '/services' },
  { name: '模板', icon: BookOpen, path: '/templates' },
]

const adminItems = [
  { name: '用户管理', icon: Users, path: '/admin/users' },
  { name: '告警管理', icon: ShieldAlert, path: '/admin/alerts' },
  { name: 'Docker管理', icon: Cpu, path: '/admin/docker' },
  { name: '审计日志', icon: Activity, path: '/admin/audit' },
]

export function Sidebar() {
  const location = useLocation()
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const sidebarOpen = useUIStore((state) => state.sidebarOpen)
  const toggleSidebar = useUIStore((state) => state.toggleSidebar)
  const setSidebarOpen = useUIStore((state) => state.setSidebarOpen)

  const isAdmin = user?.role_name === 'admin'

  const handleNavClick = () => {
    if (window.innerWidth < 1024) {
      setSidebarOpen(false)
    }
  }

  return (
    <>
      <button
        onClick={toggleSidebar}
        className="fixed top-4 left-4 z-50 lg:hidden btn-secondary p-2"
      >
        {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-gray-200 z-40 flex-col">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center">
              <Cpu className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">MCPilot</h1>
              <p className="text-xs text-gray-500">服务管理平台</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={handleNavClick}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200',
                location.pathname === item.path
                  ? 'bg-primary-50 text-primary-700 border border-primary-200'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          ))}

          {isAdmin && (
            <>
              <div className="pt-4 pb-2">
                <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  管理
                </p>
              </div>
              {adminItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={handleNavClick}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200',
                    location.pathname.startsWith(item.path)
                      ? 'bg-primary-50 text-primary-700 border border-primary-200'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              ))}
            </>
          )}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 mb-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary-400 to-accent-400 flex items-center justify-center text-white font-semibold">
              {user?.username?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.username}
              </p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all duration-200"
          >
            <LogOut className="h-5 w-5" />
            退出登录
          </button>
        </div>
      </aside>

      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            />

            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-gray-200 z-50 flex flex-col lg:hidden"
            >
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center">
                    <Cpu className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-gray-900">MCPilot</h1>
                    <p className="text-xs text-gray-500">服务管理平台</p>
                  </div>
                </div>
              </div>

              <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={handleNavClick}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200',
                      location.pathname === item.path
                        ? 'bg-primary-50 text-primary-700 border border-primary-200'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.name}
                  </Link>
                ))}

                {isAdmin && (
                  <>
                    <div className="pt-4 pb-2">
                      <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        管理
                      </p>
                    </div>
                    {adminItems.map((item) => (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={handleNavClick}
                        className={cn(
                          'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200',
                          location.pathname.startsWith(item.path)
                            ? 'bg-primary-50 text-primary-700 border border-primary-200'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        )}
                      >
                        <item.icon className="h-5 w-5" />
                        {item.name}
                      </Link>
                    ))}
                  </>
                )}
              </nav>

              <div className="p-4 border-t border-gray-200">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 mb-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary-400 to-accent-400 flex items-center justify-center text-white font-semibold">
                    {user?.username?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {user?.username}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                  </div>
                </div>
                <button
                  onClick={logout}
                  className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all duration-200"
                >
                  <LogOut className="h-5 w-5" />
                  退出登录
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
