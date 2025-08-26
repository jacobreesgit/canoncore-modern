import React from 'react'
import Link from 'next/link'
import { HiChevronRight } from 'react-icons/hi'
import { Button, ButtonLink } from '@/components/interactive/Button'

/**
 * PageHeader component with consistent styling and behavior
 *
 * Supports multiple variants for different page types
 * Includes breadcrumbs, actions, metadata, and extra content
 */

export interface PageHeaderAction {
  /** Action type determines styling */
  type: 'primary' | 'secondary' | 'danger' | 'text'
  /** Action label */
  label: string
  /** Link destination for link actions */
  href?: string
  /** Click handler for button actions */
  onClick?: () => void
  /** Disabled state */
  disabled?: boolean
}

export interface PageHeaderBreadcrumb {
  /** Breadcrumb label */
  label: string
  /** Link destination */
  href?: string
  /** Whether this is the current page */
  isCurrentPage?: boolean
}

export interface PageHeaderProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  /** Header variant */
  variant?: 'dashboard' | 'detail' | 'form' | 'centered'
  /** Optional custom class names */
  className?: string
  /** Page title */
  title: string | React.ReactNode
  /** Page description */
  description?: string | React.ReactNode
  /** Optional icon/avatar to display left of title */
  icon?: React.ReactNode
  /** Action buttons */
  actions?: PageHeaderAction[]
  /** Breadcrumb navigation items */
  breadcrumbs?: PageHeaderBreadcrumb[]
  /** Metadata content for detail variant */
  metadata?: React.ReactNode
  /** Extra content to display after description */
  extraContent?: React.ReactNode
}

/**
 * Base header styles
 */
const baseStyles = 'bg-surface-elevated border-b border-surface-200'

/**
 * Variant styles for different header types
 */
const variantStyles = {
  dashboard: 'py-6',
  detail: 'py-4',
  form: 'py-4',
  centered: 'py-8 text-center',
}

/**
 * PageHeader component
 */
export function PageHeader({
  variant = 'dashboard',
  className = '',
  title,
  description,
  icon,
  actions = [],
  breadcrumbs = [],
  metadata,
  extraContent,
  ...props
}: PageHeaderProps) {
  const headerClasses = [
    'page-header',
    baseStyles,
    variantStyles[variant],
    className,
  ]
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()

  return (
    <header className={headerClasses} {...props}>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        {/* Breadcrumbs */}
        {breadcrumbs.length > 0 && (
          <nav className='mb-4'>
            <ol className='flex items-center space-x-2 text-sm text-neutral-500'>
              {breadcrumbs.map((breadcrumb, index) => (
                <li key={index} className='flex items-center'>
                  {index > 0 && (
                    <HiChevronRight className='h-4 w-4 mx-2 text-neutral-400' />
                  )}
                  {breadcrumb.isCurrentPage ? (
                    <span className='text-neutral-900 font-medium'>
                      {breadcrumb.label}
                    </span>
                  ) : breadcrumb.href ? (
                    <Link
                      href={breadcrumb.href}
                      className='text-primary-600 hover:text-primary-700 transition-colors'
                    >
                      {breadcrumb.label}
                    </Link>
                  ) : (
                    <span>{breadcrumb.label}</span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        )}

        {/* Header content */}
        <div className={`${variant === 'centered' ? 'text-center' : ''}`}>
          {/* Title and Actions Row */}
          <div
            className={`flex ${variant === 'centered' ? 'flex-col items-center' : 'items-start justify-between'} gap-4 mb-4`}
          >
            <div className='flex items-start gap-3'>
              {icon && <div className='flex-shrink-0'>{icon}</div>}
              <div>
                <h1 className='text-2xl font-bold text-neutral-900 sm:text-3xl'>
                  {title}
                </h1>
                {description && (
                  <div className='mt-2 text-neutral-600'>{description}</div>
                )}
                {metadata && <div className='mt-3'>{metadata}</div>}
              </div>
            </div>

            {/* Actions */}
            {actions.length > 0 && (
              <div className='flex items-center gap-3 flex-shrink-0'>
                {actions.map((action, index) => (
                  <React.Fragment key={index}>
                    {action.href ? (
                      <ButtonLink
                        href={action.href}
                        variant={action.type === 'text' ? 'clear' : action.type}
                      >
                        {action.label}
                      </ButtonLink>
                    ) : (
                      <Button
                        onClick={action.onClick}
                        disabled={action.disabled}
                        variant={action.type === 'text' ? 'clear' : action.type}
                      >
                        {action.label}
                      </Button>
                    )}
                  </React.Fragment>
                ))}
              </div>
            )}
          </div>

          {/* Extra Content */}
          {extraContent && <div>{extraContent}</div>}
        </div>
      </div>
    </header>
  )
}

export default PageHeader
