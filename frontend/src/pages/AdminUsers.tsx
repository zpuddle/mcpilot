import { useState } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import {
  Plus,
  Search,
  Users,
  User,
  Mail,
  Shield,
  MoreVertical,
  Edit,
  Trash2,
  Ban,
} from 'lucide-react'
import { formatDate } from '@/utils/formatters'

const mockUsers = [
  {
    id: 1,
    username: 'admin',
    email: 'admin@example.com',
    role_name: 'admin',
    is_active: true,
    created_at: new Date(Date.now() - 86400000 * 90).toISOString(),
    last_login: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 2,
    username: 'user1',
    email: 'user1@example.com',
    role_name: 'user',
    is_active: true,
    created_at: new Date(Date.now() - 86400000 * 60).toISOString(),
    last_login: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 3,
    username: 'user2',
    email: 'user2@example.com',
    role_name: 'user',
    is_active: false,
    created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
    last_login: null,
  },
]

export function AdminUsers() {
  const [search, setSearch] = useState('')

  const filteredUsers = mockUsers.filter((user) =>
    user.username.toLowerCase().includes(search.toLowerCase()) ||
    user.email.toLowerCase().includes(search.toLowerCase())
  )

  const handleAction = (action: string, username: string) => {
    toast.success(`${action} "${username}"`)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">用户管理</h1>
          <p className="text-gray-500 mt-1">管理平台用户和权限</p>
        </div>
        <button className="btn-primary">
          <Plus className="h-4 w-4 mr-2" />
          添加用户
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="搜索用户..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input pl-10"
        />
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  用户
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  角色
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  状态
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  最后登录
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  创建时间
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredUsers.map((user, index) => (
                <motion.tr
                  key={user.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="hover:bg-gray-50"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary-400 to-accent-400 flex items-center justify-center text-white font-semibold">
                        {user.username[0].toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{user.username}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.role_name === 'admin'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      <Shield className="h-3 w-3 mr-1" />
                      {user.role_name}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.is_active
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {user.is_active ? '活跃' : '禁用'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.last_login ? formatDate(user.last_login) : '从未'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(user.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleAction('编辑', user.username)}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      {user.is_active ? (
                        <button
                          onClick={() => handleAction('禁用', user.username)}
                          className="p-2 text-orange-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg"
                        >
                          <Ban className="h-4 w-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleAction('启用', user.username)}
                          className="p-2 text-green-400 hover:text-green-600 hover:bg-green-50 rounded-lg"
                        >
                          <Users className="h-4 w-4" />
                        </button>
                      )}
                      {user.role_name !== 'admin' && (
                        <button
                          onClick={() => handleAction('删除', user.username)}
                          className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredUsers.length === 0 && (
        <div className="card p-12 text-center">
          <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">没有找到用户</h3>
          <p className="text-gray-500">尝试调整搜索条件</p>
        </div>
      )}
    </div>
  )
}
