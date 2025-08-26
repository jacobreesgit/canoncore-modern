'use client'

import React from 'react'
import { cn } from '@/lib/utils'

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'public' | 'private' | 'owner' | 'info' | 'organisational'
  size?: 'small' | 'default'
  className?: string
  children: React.ReactNode
  icon?: React.ReactNode
}

const variantStyles = {
  public: 'bg-success-100 text-success-800',
  private: 'bg-neutral-100 text-neutral-800',
  owner: 'bg-primary-100 text-primary-800',
  info: 'bg-primary-100 text-primary-800',
  organisational: 'bg-warning-100 text-warning-800',
}

const sizeStyles = {
  small: 'px-2 py-1 text-xs',
  default: 'px-3 py-1 text-sm',
}

export function Badge({
  variant = 'info',
  size = 'default',
  className = '',
  children,
  icon,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full',
        variantStyles[variant],
        sizeStyles[size],
        icon && 'gap-1.5',
        className
      )}
      {...props}
    >
      {icon && <span className='flex-shrink-0'>{icon}</span>}
      {children}
    </span>
  )
}

export default Badge
