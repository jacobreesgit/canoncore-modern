'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { HiSearch } from 'react-icons/hi'
import { FormInput } from '@/components/forms/FormInput'
import { Icon } from './Icon'

export interface SearchBarProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    'size' | 'value' | 'onChange'
  > {
  className?: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  placeholder?: string
}

export function SearchBar({
  className = '',
  value,
  onChange,
  placeholder = 'Search...',
  ...props
}: SearchBarProps) {
  const inputClasses =
    'w-full px-4 py-2 pl-10 border border-neutral-300 rounded-lg text-base focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:border-primary-500 min-h-[40px]'

  const iconClasses =
    'absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'

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
        <Icon icon={HiSearch} size='lg' color='neutral' />
      </div>
    </div>
  )
}

export default SearchBar
