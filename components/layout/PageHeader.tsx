import React from 'react'
import Link from 'next/link'
import { HiChevronRight } from 'react-icons/hi'

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

export interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Header variant */
  variant?: 'dashboard' | 'detail' | 'form' | 'centered'
  /** Optional custom class names */
  className?: string
  /** Page title */
  title: string
  /** Page description */
  description?: string
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
const baseStyles = 'bg-white border-b border-gray-200'

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
 * Button styles for actions
 */
const buttonStyles = {
  primary:
    'bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-lg font-medium transition-colors',
  secondary:
    'bg-gray-100 text-gray-700 hover:bg-gray-200 px-4 py-2 rounded-lg font-medium transition-colors border border-gray-300',
  danger:
    'bg-red-600 text-white hover:bg-red-700 px-4 py-2 rounded-lg font-medium transition-colors',
  text: 'text-blue-600 hover:text-blue-700 font-medium transition-colors',
}

/**
 * PageHeader component
 */
export function PageHeader({
  variant = 'dashboard',
  className = '',
  title,
  description,
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
            <ol className='flex items-center space-x-2 text-sm text-gray-500'>
              {breadcrumbs.map((breadcrumb, index) => (
                <li key={index} className='flex items-center'>
                  {index > 0 && (
                    <HiChevronRight className='h-4 w-4 mx-2 text-gray-400' />
                  )}
                  {breadcrumb.isCurrentPage ? (
                    <span className='text-gray-900 font-medium'>
                      {breadcrumb.label}
                    </span>
                  ) : breadcrumb.href ? (
                    <Link
                      href={breadcrumb.href}
                      className='text-blue-600 hover:text-blue-700 transition-colors'
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
        <div
          className={`flex ${variant === 'centered' ? 'flex-col items-center' : 'flex-col sm:flex-row sm:items-center sm:justify-between'} gap-4`}
        >
          <div className={`${variant === 'centered' ? 'text-center' : ''}`}>
            <h1 className='text-2xl font-bold text-gray-900 sm:text-3xl'>
              {title}
            </h1>
            {description && <p className='mt-2 text-gray-600'>{description}</p>}
            {metadata && <div className='mt-3'>{metadata}</div>}
            {extraContent && <div className='mt-4'>{extraContent}</div>}
          </div>

          {/* Actions */}
          {actions.length > 0 && (
            <div className='flex items-center gap-3 flex-shrink-0'>
              {actions.map((action, index) => (
                <React.Fragment key={index}>
                  {action.href ? (
                    <Link
                      href={action.href}
                      className={buttonStyles[action.type]}
                    >
                      {action.label}
                    </Link>
                  ) : (
                    <button
                      onClick={action.onClick}
                      disabled={action.disabled}
                      className={`${buttonStyles[action.type]} ${action.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {action.label}
                    </button>
                  )}
                </React.Fragment>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export default PageHeader
