'use client'

import React, { forwardRef } from 'react'
import { cn } from '@/lib/utils'

export interface FormInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: 'default' | 'error'
  className?: string
}

const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ variant = 'default', className = '', ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          'form-input',
          'w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white',
          variant === 'default' && 'border-gray-300',
          variant === 'error' &&
            'border-red-300 focus:ring-red-500 focus:border-red-500',
          className
        )}
        {...props}
      />
    )
  }
)

FormInput.displayName = 'FormInput'

export { FormInput }
export default FormInput
