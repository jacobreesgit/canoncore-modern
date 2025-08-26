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
          'w-full px-3 py-2 border rounded-lg focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:border-primary-500 bg-white',
          variant === 'default' && 'border-neutral-300',
          variant === 'error' &&
            'border-error-300 focus-visible:ring-error-500 focus-visible:border-error-500',
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
