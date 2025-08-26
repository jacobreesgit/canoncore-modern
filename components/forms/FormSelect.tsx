'use client'

import React, { forwardRef } from 'react'
import { cn } from '@/lib/utils'

export interface FormSelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  variant?: 'default' | 'error'
  className?: string
  children: React.ReactNode
}

const FormSelect = forwardRef<HTMLSelectElement, FormSelectProps>(
  ({ variant = 'default', className = '', children, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={cn(
          'form-select',
          'w-full px-3 py-2 border rounded-lg focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:border-primary-500 bg-white',
          variant === 'default' && 'border-neutral-300',
          variant === 'error' &&
            'border-error-300 focus-visible:ring-error-500 focus-visible:border-error-500',
          className
        )}
        {...props}
      >
        {children}
      </select>
    )
  }
)

FormSelect.displayName = 'FormSelect'

export { FormSelect }
export default FormSelect
