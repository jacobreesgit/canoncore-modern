'use client'

import React from 'react'
import { cn } from '@/lib/utils'

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?:
    | 'public'
    | 'private'
    | 'owner'
    | 'info'
    | 'organisational'
    | 'video'
    | 'audio'
    | 'text'
    | 'series'
    | 'phase'
    | 'character'
    | 'location'
  size?: 'small' | 'default'
  className?: string
  children: React.ReactNode
  icon?: React.ReactNode
  customColor?: string
  textColor?: string
  backgroundColor?: string
}

const variantStyles = {
  public: 'bg-success-100 text-success-800',
  private: 'bg-neutral-100 text-neutral-800',
  owner: 'bg-primary-100 text-primary-800',
  info: 'bg-blue-100 text-blue-800',
  organisational: 'bg-blue-100 text-blue-800',
  video: 'bg-red-100 text-red-800',
  audio: 'bg-orange-100 text-orange-800',
  text: 'bg-emerald-100 text-emerald-800',
  series: 'bg-cyan-100 text-cyan-800',
  phase: 'bg-violet-100 text-violet-800',
  character: 'bg-fuchsia-100 text-fuchsia-800',
  location: 'bg-lime-100 text-lime-800',
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
  customColor,
  textColor,
  backgroundColor,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full',
        !customColor &&
          !textColor &&
          !backgroundColor &&
          variantStyles[variant],
        sizeStyles[size],
        icon && 'gap-1.5',
        className
      )}
      style={
        customColor || textColor || backgroundColor
          ? {
              backgroundColor:
                backgroundColor ||
                (customColor ? customColor + '20' : undefined),
              color: textColor || customColor,
              borderColor:
                backgroundColor ||
                (customColor ? customColor + '40' : undefined),
            }
          : undefined
      }
      {...props}
    >
      {icon && <span className='flex-shrink-0'>{icon}</span>}
      {children}
    </span>
  )
}

export default Badge
