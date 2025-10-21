import { InputHTMLAttributes, forwardRef } from 'react'
import { cn } from '../../lib/utils'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
  success?: boolean
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, success, type, ...props }, ref) => {
    const baseClasses = 'w-full px-4 py-3 bg-white border-2 border-secondary-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary-100 focus:border-primary-500 transition-all duration-200 placeholder:text-secondary-400 hover:border-secondary-300 disabled:opacity-50 disabled:cursor-not-allowed'

    const stateClasses = error
      ? 'border-danger-500 focus:border-danger-500 focus:ring-danger-100'
      : success
      ? 'border-accent-500 focus:border-accent-500 focus:ring-accent-100'
      : ''

    return (
      <input
        type={type}
        className={cn(baseClasses, stateClasses, className)}
        ref={ref}
        {...props}
      />
    )
  }
)

Input.displayName = 'Input'

export { Input }
