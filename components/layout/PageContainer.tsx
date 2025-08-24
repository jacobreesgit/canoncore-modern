import React from 'react'

/**
 * PageContainer component with consistent styling and behavior
 *
 * Provides consistent spacing and max-width constraints for page content
 * Supports wide and narrow variants for different content types
 */

export interface PageContainerProps extends React.HTMLAttributes<HTMLElement> {
  /** Container variant */
  variant?: 'wide' | 'narrow'
  /** Optional custom class names */
  className?: string
  /** Container content */
  children: React.ReactNode
}

/**
 * Base container styles using Tailwind CSS
 */
const baseStyles = 'mx-auto py-6 px-4 sm:px-6 lg:px-8'

/**
 * Variant styles for different container widths
 */
const variantStyles = {
  wide: 'max-w-7xl',
  narrow: 'max-w-2xl',
}

/**
 * PageContainer component
 */
export function PageContainer({
  variant = 'wide',
  className = '',
  children,
  ...props
}: PageContainerProps) {
  const containerClasses = [
    'page-container',
    baseStyles,
    variantStyles[variant],
    className,
  ]
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()

  return (
    <div className={containerClasses} {...props}>
      {children}
    </div>
  )
}

export default PageContainer
