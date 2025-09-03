'use client'

import React, { forwardRef } from 'react'
import { HiChevronDown } from 'react-icons/hi'
import { cn } from '@/lib/utils'
import { Icon } from '@/components/interactive/Icon'

export interface FormSelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  variant?: 'default' | 'error'
  className?: string
  children: React.ReactNode
}

const FormSelect = forwardRef<HTMLSelectElement, FormSelectProps>(
  ({ variant = 'default', className = '', children, ...props }, ref) => {
    return (
      <div className='relative'>
        <select
          ref={ref}
          className={cn(
            'appearance-none',
            'w-full px-3 py-2 pr-10 border rounded-lg focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:border-primary-500 bg-white',
            variant === 'default' && 'border-neutral-300',
            variant === 'error' &&
              'border-error-300 focus-visible:ring-error-500 focus-visible:border-error-500',
            className
          )}
          {...props}
        >
          {children}
        </select>
        <div className='absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none'>
          <Icon
            icon={HiChevronDown}
            color='neutral'
            noPadding
            className='flex-shrink-0'
          />
        </div>
      </div>
    )
  }
)

FormSelect.displayName = 'FormSelect'

export { FormSelect }
export default FormSelect
