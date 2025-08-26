'use client'

import React from 'react'
import { FormLabel } from './FormLabel'
import { FormError } from './FormError'
import { cn } from '@/lib/utils'

export interface FormFieldProps extends React.HTMLAttributes<HTMLDivElement> {
  label?: string
  required?: boolean
  error?: string | string[]
  description?: string
  className?: string
  children: React.ReactNode
}

export function FormField({
  label,
  required = false,
  error,
  description,
  className = '',
  children,
  ...props
}: FormFieldProps) {
  const hasError = Boolean(error)
  const labelVariant = hasError ? 'error' : required ? 'required' : 'default'

  return (
    <div className={cn('form-field', 'space-y-1', className)} {...props}>
      {label && <FormLabel variant={labelVariant}>{label}</FormLabel>}
      {children}
      {description && !hasError && (
        <div className='text-sm text-neutral-500'>{description}</div>
      )}
      <FormError error={error} />
    </div>
  )
}

export default FormField
