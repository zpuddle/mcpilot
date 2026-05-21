import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { Cpu, Eye, EyeOff, Lock, Mail, User, ArrowLeft } from 'lucide-react'

export function Register() {
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
  })
  const register = useAuthStore((state) => state.register)
  const isLoading = useAuthStore((state) => state.isLoading)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await register(formData)
      toast.success('注册成功，请登录')
      navigate('/login')
    } catch (error) {
      toast.error('注册失败，请重试')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <button
          onClick={() => navigate('/login')}
          className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          返回登录
        </button>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-20 w-20 bg-gradient-to-br from-primary-500 to-accent-500 rounded-2xl shadow-lg mb-4">
            <Cpu className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">创建账号</h1>
          <p className="text-gray-500 mt-2">注册一个新账号开始使用 MCPilot</p>
        </div>

        <div className="card p-8 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                用户名
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                  className="input pl-10"
                  placeholder="请输入用户名"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                邮箱
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="input pl-10"
                  placeholder="请输入邮箱"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                密码
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="input pl-10 pr-10"
                  placeholder="请输入密码"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full py-3 text-base"
            >
              {isLoading ? '注册中...' : '注册'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-500 text-sm">
              已有账号？{' '}
              <Link
                to="/login"
                className="text-primary-600 hover:text-primary-700 font-medium transition-colors"
              >
                立即登录
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
