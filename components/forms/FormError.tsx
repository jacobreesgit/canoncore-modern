'use client'

import React from 'react'
import { HiExclamationCircle } from 'react-icons/hi'
import { cn } from '@/lib/utils'
import { Icon } from '@/components/interactive/Icon'

export interface FormErrorProps extends React.HTMLAttributes<HTMLDivElement> {
  error?: string | string[]
  className?: string
}

export function FormError({ error, className = '', ...props }: FormErrorProps) {
  if (!error) return null

  const errors = Array.isArray(error) ? error : [error]

  if (errors.length === 0) return null

  return (
    <div
      className={cn('form-error', 'text-sm text-error-600 mt-1', className)}
      role='alert'
      aria-live='polite'
      {...props}
    >
      {errors.map((err, index) => (
        <div key={index} className='flex items-center gap-1'>
          <Icon icon={HiExclamationCircle} color='error' aria-label='Error' />
          <span>{err}</span>
        </div>
      ))}
    </div>
  )
}

export default FormError
