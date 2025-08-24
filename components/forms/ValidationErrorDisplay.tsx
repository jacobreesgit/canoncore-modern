'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import type { FormErrors } from '@/lib/errors'

export interface ValidationErrorDisplayProps
  extends React.HTMLAttributes<HTMLDivElement> {
  errors: FormErrors
  className?: string
}

/**
 * Component for displaying structured validation errors from Zod
 */
export function ValidationErrorDisplay({
  errors,
  className = '',
  ...props
}: ValidationErrorDisplayProps) {
  const hasFormErrors = errors.formErrors.length > 0
  const hasFieldErrors = Object.keys(errors.fieldErrors).length > 0

  if (!hasFormErrors && !hasFieldErrors) return null

  return (
    <div
      className={cn(
        'validation-errors',
        'bg-red-50 border border-red-200 rounded-lg p-4',
        className
      )}
      role='alert'
      aria-live='polite'
      {...props}
    >
      {hasFormErrors && (
        <div className='mb-3 last:mb-0'>
          <h3 className='text-sm font-medium text-red-800 mb-2'>Form Errors</h3>
          <ul className='space-y-1'>
            {errors.formErrors.map((error, index) => (
              <li
                key={index}
                className='flex items-center gap-2 text-sm text-red-700'
              >
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
                <span>{error}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {hasFieldErrors && (
        <div>
          <h3 className='text-sm font-medium text-red-800 mb-2'>
            Field Errors
          </h3>
          <div className='space-y-2'>
            {Object.entries(errors.fieldErrors).map(([field, fieldErrors]) => (
              <div key={field}>
                <div className='text-sm font-medium text-red-800 capitalize'>
                  {field.replace(/([A-Z])/g, ' $1').trim()}
                </div>
                <ul className='mt-1 space-y-1'>
                  {fieldErrors.map((error, index) => (
                    <li
                      key={index}
                      className='flex items-center gap-2 text-sm text-red-700 ml-4'
                    >
                      <svg
                        className='w-3 h-3 flex-shrink-0'
                        fill='currentColor'
                        viewBox='0 0 20 20'
                        role='img'
                        aria-label='Error'
                      >
                        <circle cx='10' cy='10' r='3' />
                      </svg>
                      <span>{error}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default ValidationErrorDisplay
