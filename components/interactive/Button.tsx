'use client'

import React from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { AiOutlineLoading3Quarters } from 'react-icons/ai'
import { Icon } from './Icon'

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'clear' | 'accent'
  size?: 'small' | 'default' | 'large'
  loading?: boolean
  icon?: React.ReactNode
  className?: string
  children: React.ReactNode
}

export interface ButtonLinkProps
  extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'clear' | 'accent'
  size?: 'small' | 'default' | 'large'
  href: string
  external?: boolean
  icon?: React.ReactNode
  className?: string
  children: React.ReactNode
}

function LoadingSpinner({ className }: { className?: string }) {
  return (
    <Icon
      icon={AiOutlineLoading3Quarters}
      animate='spin'
      className={className}
    />
  )
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      variant = 'primary',
      size = 'default',
      loading = false,
      disabled = false,
      icon,
      className = '',
      children,
      ...props
    },
    ref
  ) {
    const isDisabled = disabled || loading

    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center font-medium rounded-lg focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors',
          variant === 'primary' &&
            'button-variant-primary bg-primary-600 hover:bg-primary-700 text-white focus-visible:ring-primary-500',
          variant === 'secondary' &&
            'button-variant-secondary bg-secondary-100 hover:bg-secondary-200 text-secondary-900 focus-visible:ring-secondary-500',
          variant === 'danger' &&
            'button-variant-danger bg-error-600 hover:bg-error-700 text-white focus-visible:ring-error-500',
          variant === 'clear' &&
            'button-variant-clear bg-transparent hover:bg-surface-100 text-surface-700 focus-visible:ring-surface-500',
          variant === 'accent' &&
            'button-variant-accent bg-purple-600 hover:bg-purple-700 text-white focus-visible:ring-purple-500',
          size === 'small' && 'px-3 py-1.5 text-sm',
          size === 'default' && 'px-4 py-2 text-sm',
          size === 'large' && 'px-6 py-3 text-base',
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
)

export function ButtonLink({
  variant = 'primary',
  size = 'default',
  href,
  external = false,
  icon,
  className = '',
  children,
  ...props
}: ButtonLinkProps) {
  const baseClasses = cn(
    'inline-flex items-center justify-center font-medium rounded-lg focus-visible:ring-2 focus-visible:ring-offset-2 cursor-pointer transition-colors',
    variant === 'primary' &&
      'button-variant-primary bg-primary-600 hover:bg-primary-700 text-white focus-visible:ring-primary-500',
    variant === 'secondary' &&
      'button-variant-secondary bg-secondary-100 hover:bg-secondary-200 text-secondary-900 focus-visible:ring-secondary-500',
    variant === 'danger' &&
      'button-variant-danger bg-error-600 hover:bg-error-700 text-white focus-visible:ring-error-500',
    variant === 'clear' &&
      'button-variant-clear bg-transparent hover:bg-surface-100 text-surface-700 focus-visible:ring-surface-500',
    variant === 'accent' &&
      'button-variant-accent bg-purple-600 hover:bg-purple-700 text-white focus-visible:ring-purple-500',
    size === 'small' && 'px-3 py-1.5 text-sm',
    size === 'default' && 'px-4 py-2 text-sm',
    size === 'large' && 'px-6 py-3 text-base',
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
