'use client'

import React from 'react'
import { cn } from '@/lib/utils'

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
      className={cn('form-error', 'text-sm text-red-600 mt-1', className)}
      role='alert'
      aria-live='polite'
      {...props}
    >
      {errors.map((err, index) => (
        <div key={index} className='flex items-center gap-1'>
          <svg
            className='w-4 h-4 flex-shrink-0'
            fill='currentColor'
            viewBox='0 0 20 20'
            role='img'
            aria-label='Error'
          >
            <path
              fillRule='evenodd'
              d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z'
              clipRule='evenodd'
            />
          </svg>
          <span>{err}</span>
        </div>
      ))}
    </div>
  )
}

export default FormError
