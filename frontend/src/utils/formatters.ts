import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatRelativeTime(date: string | Date) {
  return formatDistanceToNow(new Date(date), {
    addSuffix: true,
    locale: zhCN,
  })
}

export function getStatusColor(status: string) {
  switch (status) {
    case 'running':
      return 'success'
    case 'stopped':
      return 'gray'
    case 'building':
      return 'warning'
    case 'error':
      return 'danger'
    default:
      return 'gray'
  }
}

export function getStatusBadgeClasses(status: string) {
  switch (status) {
    case 'running':
      return 'bg-success-100 text-success-800 border-success-200'
    case 'stopped':
      return 'bg-gray-100 text-gray-800 border-gray-200'
    case 'building':
      return 'bg-warning-100 text-warning-800 border-warning-200'
    case 'error':
      return 'bg-danger-100 text-danger-800 border-danger-200'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

export function getStatusText(status: string) {
  switch (status) {
    case 'running':
      return '运行中'
    case 'stopped':
      return '已停止'
    case 'building':
      return '构建中'
    case 'error':
      return '错误'
    case 'draft':
      return '草稿'
    default:
      return status
  }
}

export function truncate(text: string, length: number = 50) {
  if (text.length <= length) return text
  return text.slice(0, length) + '...'
}
