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
          'w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white',
          variant === 'default' && 'border-gray-300',
          variant === 'error' &&
            'border-red-300 focus:ring-red-500 focus:border-red-500',
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
