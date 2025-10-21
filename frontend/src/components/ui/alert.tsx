import { HTMLAttributes, forwardRef } from 'react'
import { cn } from '../../lib/utils'
import { InformationCircleIcon, CheckCircleIcon, ExclamationTriangleIcon, XCircleIcon } from '@heroicons/react/24/outline'

export interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'info' | 'success' | 'warning' | 'danger'
  title?: string
}

const Alert = forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = 'info', title, children, ...props }, ref) => {
    const icons = {
      info: InformationCircleIcon,
      success: CheckCircleIcon,
      warning: ExclamationTriangleIcon,
      danger: XCircleIcon
    }

    const variants = {
      info: 'bg-primary-50 border-primary-200 text-primary-800',
      success: 'bg-accent-50 border-accent-200 text-accent-800',
      warning: 'bg-warning-50 border-warning-200 text-warning-800',
      danger: 'bg-danger-50 border-danger-200 text-danger-800'
    }

    const iconColors = {
      info: 'text-primary-600',
      success: 'text-accent-600',
      warning: 'text-warning-600',
      danger: 'text-danger-600'
    }

    const Icon = icons[variant]

    return (
      <div
        ref={ref}
        className={cn('flex items-start gap-3 p-4 rounded-xl border', variants[variant], className)}
        {...props}
      >
        <Icon className={cn('h-5 w-5 flex-shrink-0 mt-0.5', iconColors[variant])} />
        <div className="flex-1">
          {title && <div className="font-semibold mb-1">{title}</div>}
          <div className="text-sm">{children}</div>
        </div>
      </div>
    )
  }
)

Alert.displayName = 'Alert'

export { Alert }
