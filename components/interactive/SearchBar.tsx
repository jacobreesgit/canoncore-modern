'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { HiSearch } from 'react-icons/hi'
import { FormInput } from '@/components/forms/FormInput'

export interface SearchBarProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    'size' | 'value' | 'onChange'
  > {
  variant?: 'default' | 'large'
  className?: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  placeholder?: string
}

export function SearchBar({
  variant = 'default',
  className = '',
  value,
  onChange,
  placeholder = 'Search...',
  ...props
}: SearchBarProps) {
  const inputClasses =
    variant === 'large'
      ? 'w-full px-4 py-3 pl-12 border border-neutral-300 rounded-lg text-base sm:text-lg focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:border-primary-500 min-h-[44px]'
      : 'w-full px-4 py-2 pl-10 border border-neutral-300 rounded-lg text-base focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:border-primary-500 min-h-[40px]'

  const iconClasses =
    variant === 'large'
      ? 'absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none'
      : 'absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'

  const iconSize = variant === 'large' ? 'h-6 w-6' : 'h-5 w-5'

  return (
    <div className={cn('relative w-full', className)}>
      <FormInput
        type='text'
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={inputClasses}
        {...props}
      />
      <div className={iconClasses}>
        <HiSearch className={cn(iconSize, 'text-neutral-400')} />
      </div>
    </div>
  )
}

export default SearchBar
