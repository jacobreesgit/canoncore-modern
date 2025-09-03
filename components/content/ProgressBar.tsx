'use client'

import React from 'react'
import { cn } from '@/lib/utils'

export interface ProgressBarProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'viewable' | 'organisational'
  className?: string
  value: number
  showLabel?: boolean
  showBar?: boolean
}

const variantColors = {
  viewable: 'bg-success-600',
  organisational: 'bg-primary-600',
}

export function ProgressBar({
  variant = 'organisational',
  className = '',
  value,
  showLabel = true,
  showBar = true,
  ...props
}: ProgressBarProps) {
  const normalizedValue = Math.min(Math.max(value || 0, 0), 100)
  const progressColor = variantColors[variant]

  const shouldShowLabel = showLabel || !showBar
  const shouldShowBar = showBar || !showLabel

  return (
    <div
      className={cn('progress-bar', shouldShowBar && 'w-full', className)}
      {...props}
    >
      {shouldShowLabel && (
        <div className='flex justify-start items-center text-sm text-neutral-600 mb-1'>
          <span>{Math.round(normalizedValue)}%</span>
        </div>
      )}
      {shouldShowBar && (
        <div className='w-full bg-neutral-200 rounded-full h-2'>
          <div
            className={cn(
              progressColor,
              'h-2 rounded-full transition-all duration-300 ease-in-out'
            )}
            style={{ width: `${normalizedValue}%` }}
          />
        </div>
      )}
    </div>
  )
}

export default ProgressBar
