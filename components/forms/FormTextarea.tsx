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
          'w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical',
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

FormTextarea.displayName = 'FormTextarea'

export { FormTextarea }
export default FormTextarea
