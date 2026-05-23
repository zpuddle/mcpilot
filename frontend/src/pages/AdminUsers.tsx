import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import {
  Plus,
  Search,
  Users,
  Shield,
  Trash2,
  Ban,
} from 'lucide-react'
import { usersApi } from '@/api/admin'
import { useI18n } from '@/i18n'
import { formatDate } from '@/utils/formatters'

export function AdminUsers() {
  const [search, setSearch] = useState('')
  const queryClient = useQueryClient()
  const { locale, t } = useI18n()

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: usersApi.getUsers,
  })

  const toggleStatusMutation = useMutation({
    mutationFn: ({ userId, isActive }: { userId: number; isActive: boolean }) =>
      usersApi.updateUserStatus(userId, isActive),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
      toast.success(variables.isActive ? t('admin.users.enabledToast') : t('admin.users.disabledToast'))
    },
    onError: () => {
      toast.error(t('admin.users.operationFailed'))
    },
  })

  const deleteUserMutation = useMutation({
    mutationFn: (userId: number) => usersApi.deleteUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
      toast.success(t('admin.users.deleted'))
    },
    onError: () => {
      toast.error(t('admin.users.deleteFailed'))
    },
  })

  const filteredUsers = users.filter((user) =>
    user.username.toLowerCase().includes(search.toLowerCase()) ||
    user.email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('admin.users.title')}</h1>
          <p className="text-gray-500 mt-1">{t('admin.users.subtitle')}</p>
        </div>
        <button className="btn-primary">
          <Plus className="h-4 w-4 mr-2" />
          {t('admin.users.addUser')}
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder={t('admin.users.searchPlaceholder')}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="input pl-10"
        />
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {t('admin.users.tableUser')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {t('admin.users.tableRole')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {t('admin.users.tableStatus')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {t('admin.users.tableCreatedAt')}
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {t('admin.users.tableActions')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    {t('common.loading')}
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user, index) => (
                  <motion.tr
                    key={user.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
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
                        {user.is_active ? t('status.active') : t('status.inactive')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.created_at ? formatDate(user.created_at, locale) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <div className="flex items-center justify-end gap-2">
                        {user.is_active ? (
                          <button
                            onClick={() => toggleStatusMutation.mutate({ userId: user.id, isActive: false })}
                            className="p-2 text-orange-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg"
                            title={t('common.disable')}
                          >
                            <Ban className="h-4 w-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => toggleStatusMutation.mutate({ userId: user.id, isActive: true })}
                            className="p-2 text-green-400 hover:text-green-600 hover:bg-green-50 rounded-lg"
                            title={t('common.enable')}
                          >
                            <Users className="h-4 w-4" />
                          </button>
                        )}
                        {user.role_name !== 'admin' && (
                          <button
                            onClick={() => {
                              if (confirm(t('admin.users.confirmDelete', { name: user.username }))) {
                                deleteUserMutation.mutate(user.id)
                              }
                            }}
                            className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                            title={t('common.delete')}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {!isLoading && filteredUsers.length === 0 && (
        <div className="card p-12 text-center">
          <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">{t('admin.users.emptyTitle')}</h3>
          <p className="text-gray-500">{t('common.searchEmpty')}</p>
        </div>
      )}
    </div>
  )
}
