'use client'

import React from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { AiOutlineLoading3Quarters } from 'react-icons/ai'

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'clear'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  icon?: React.ReactNode
  className?: string
  children: React.ReactNode
}

export interface ButtonLinkProps
  extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'clear'
  size?: 'sm' | 'md' | 'lg'
  href: string
  external?: boolean
  icon?: React.ReactNode
  className?: string
  children: React.ReactNode
}

function LoadingSpinner({ className }: { className?: string }) {
  return <AiOutlineLoading3Quarters className={cn('animate-spin', className)} />
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  className = '',
  children,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading

  return (
    <button
      className={cn(
        'inline-flex items-center justify-center font-medium rounded-lg focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors',
        variant === 'primary' &&
          'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500',
        variant === 'secondary' &&
          'bg-gray-100 hover:bg-gray-200 text-gray-900 focus:ring-gray-500',
        variant === 'danger' &&
          'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500',
        variant === 'clear' &&
          'bg-transparent hover:bg-gray-100 text-gray-700 focus:ring-gray-500',
        size === 'sm' && 'px-3 py-1.5 text-sm',
        size === 'md' && 'px-4 py-2 text-sm',
        size === 'lg' && 'px-6 py-3 text-base',
        className
      )}
      disabled={isDisabled}
      {...props}
    >
      {loading && <LoadingSpinner className='-ml-1 mr-2 h-4 w-4' />}
      {!loading && icon && (
        <span className={children ? 'mr-2' : ''}>{icon}</span>
      )}
      {children}
    </button>
  )
}

export function ButtonLink({
  variant = 'primary',
  size = 'md',
  href,
  external = false,
  icon,
  className = '',
  children,
  ...props
}: ButtonLinkProps) {
  const baseClasses = cn(
    'inline-flex items-center justify-center font-medium rounded-lg focus:ring-2 focus:ring-offset-2 transition-colors',
    variant === 'primary' &&
      'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500',
    variant === 'secondary' &&
      'bg-gray-100 hover:bg-gray-200 text-gray-900 focus:ring-gray-500',
    variant === 'danger' &&
      'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500',
    variant === 'clear' &&
      'bg-transparent hover:bg-gray-100 text-gray-700 focus:ring-gray-500',
    size === 'sm' && 'px-3 py-1.5 text-sm',
    size === 'md' && 'px-4 py-2 text-sm',
    size === 'lg' && 'px-6 py-3 text-base',
    className
  )

  const content = (
    <>
      {icon && <span className={children ? 'mr-2' : ''}>{icon}</span>}
      {children}
    </>
  )

  if (external) {
    return (
      <a
        href={href}
        className={baseClasses}
        target='_blank'
        rel='noopener noreferrer'
        {...props}
      >
        {content}
      </a>
    )
  }

  return (
    <Link href={href} className={baseClasses} {...props}>
      {content}
    </Link>
  )
}
