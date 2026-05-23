import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { formatDistanceToNow } from 'date-fns'
import { enUS, zhCN } from 'date-fns/locale'
import type { Locale } from '@/i18n'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date, locale: Locale = 'en') {
  return new Date(date).toLocaleDateString(locale === 'zh' ? 'zh-CN' : 'en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatRelativeTime(date: string | Date, locale: Locale = 'en') {
  return formatDistanceToNow(new Date(date), {
    addSuffix: true,
    locale: locale === 'zh' ? zhCN : enUS,
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
      return 'Running'
    case 'stopped':
      return 'Stopped'
    case 'building':
      return 'Building'
    case 'error':
      return 'Error'
    case 'draft':
      return 'Draft'
    default:
      return status
  }
}

export function truncate(text: string, length: number = 50) {
  if (text.length <= length) return text
  return text.slice(0, length) + '...'
}
