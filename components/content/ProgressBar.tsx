'use client'

import React from 'react'
import { cn } from '@/lib/utils'

export interface ProgressBarProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'viewable' | 'organisational'
  size?: 'default' | 'large'
  className?: string
  value: number
  showLabel?: boolean
  label?: string
}

const variantColors = {
  viewable: 'bg-green-600',
  organisational: 'bg-blue-600',
}

const sizeStyles = {
  default: 'h-2',
  large: 'h-3',
}

export function ProgressBar({
  variant = 'organisational',
  size = 'default',
  className = '',
  value,
  showLabel = false,
  label = 'Progress',
  ...props
}: ProgressBarProps) {
  const normalizedValue = Math.min(Math.max(value || 0, 0), 100)
  const progressColor = variantColors[variant]
  const heightClass = sizeStyles[size]

  return (
    <div className={cn('progress-bar w-full', className)} {...props}>
      {showLabel && (
        <div className='flex justify-between items-center text-sm text-gray-600 mb-1'>
          <span>{label}</span>
          <span>{Math.round(normalizedValue)}%</span>
        </div>
      )}
      <div className={cn('w-full bg-gray-200 rounded-full', heightClass)}>
        <div
          className={cn(
            progressColor,
            heightClass,
            'rounded-full transition-all duration-300 ease-in-out'
          )}
          style={{ width: `${normalizedValue}%` }}
        />
      </div>
    </div>
  )
}

export default ProgressBar
