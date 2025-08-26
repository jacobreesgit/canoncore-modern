'use client'

import React from 'react'
import { cn } from '@/lib/utils'

export interface FormLabelProps
  extends React.LabelHTMLAttributes<HTMLLabelElement> {
  variant?: 'default' | 'required' | 'error'
  className?: string
  children: React.ReactNode
}

export function FormLabel({
  variant = 'default',
  className = '',
  children,
  ...props
}: FormLabelProps) {
  return (
    <label
      className={cn(
        'form-label',
        'block text-sm font-medium mb-1',
        variant === 'default' && 'text-neutral-700',
        variant === 'required' && 'text-neutral-700',
        variant === 'error' && 'text-error-600',
        className
      )}
      {...props}
    >
      {children}
      {variant === 'required' && <span className='text-error-500 ml-1'>*</span>}
    </label>
  )
}

export default FormLabel
