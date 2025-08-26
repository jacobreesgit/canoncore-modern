'use client'

import React, { forwardRef } from 'react'
import { cn } from '@/lib/utils'

export interface FormTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  variant?: 'default' | 'error'
  className?: string
}

const FormTextarea = forwardRef<HTMLTextAreaElement, FormTextareaProps>(
  ({ variant = 'default', className = '', ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          'form-textarea',
          'w-full px-3 py-2 border rounded-lg focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:border-primary-500 resize-vertical',
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

FormTextarea.displayName = 'FormTextarea'

export { FormTextarea }
export default FormTextarea
