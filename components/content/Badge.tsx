'use client'

import React from 'react'
import { cn } from '@/lib/utils'

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'public' | 'private' | 'owner' | 'info' | 'organisational'
  size?: 'small' | 'default'
  className?: string
  children: React.ReactNode
}

const variantStyles = {
  public: 'bg-green-100 text-green-800',
  private: 'bg-gray-100 text-gray-800',
  owner: 'bg-blue-100 text-blue-800',
  info: 'bg-purple-100 text-purple-800',
  organisational: 'bg-orange-100 text-orange-800',
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
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}

export default Badge
