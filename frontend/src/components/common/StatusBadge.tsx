import { cn, getStatusBadgeClasses, getStatusText } from '@/utils/formatters'
import { motion } from 'framer-motion'

interface StatusBadgeProps {
  status: string
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'badge',
        getStatusBadgeClasses(status),
        className
      )}
    >
      {status === 'running' && (
        <motion.span
          className="mr-1.5 h-1.5 w-1.5 rounded-full bg-success-500"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}
      {status === 'building' && (
        <motion.span
          className="mr-1.5 h-1.5 w-1.5 rounded-full bg-warning-500"
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        />
      )}
      {status === 'error' && (
        <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-danger-500" />
      )}
      {status === 'stopped' && (
        <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-gray-400" />
      )}
      {status === 'draft' && (
        <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-gray-400" />
      )}
      {getStatusText(status)}
    </span>
  )
}
