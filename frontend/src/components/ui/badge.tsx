import { HTMLAttributes, forwardRef } from 'react'
import { cn } from '../../lib/utils'

export interface BadgeProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'warning' | 'danger' | 'success'
  size?: 'sm' | 'md' | 'lg'
}

const Badge = forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    const baseClasses = 'inline-flex items-center gap-1 font-semibold rounded-full transition-all duration-200'

    const variants = {
      primary: 'bg-primary-100 text-primary-700 border border-primary-200',
      secondary: 'bg-secondary-100 text-secondary-700 border border-secondary-200',
      accent: 'bg-accent-100 text-accent-700 border border-accent-200',
      warning: 'bg-warning-100 text-warning-700 border border-warning-200',
      danger: 'bg-danger-100 text-danger-700 border border-danger-200',
      success: 'bg-accent-100 text-accent-700 border border-accent-200'
    }

    const sizes = {
      sm: 'px-2 py-0.5 text-xs',
      md: 'px-3 py-1 text-xs',
      lg: 'px-4 py-1.5 text-sm'
    }

    return (
      <div
        ref={ref}
        className={cn(baseClasses, variants[variant], sizes[size], className)}
        {...props}
      />
    )
  }
)

Badge.displayName = 'Badge'

export { Badge }