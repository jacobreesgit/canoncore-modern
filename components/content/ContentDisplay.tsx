'use client'

import { ReactNode } from 'react'

export interface ContentDisplayProps {
  /** Section title */
  title?: string
  /** Section description */
  description?: string
  /** Actions that appear in header when content exists, or in empty state when no content */
  actions?: ReactNode
  /** Whether the content is empty - controls where actions are displayed */
  isEmpty?: boolean
  /** Empty state title */
  emptyStateTitle?: string
  /** Empty state description */
  emptyStateDescription?: string
  /** Content to display */
  children: ReactNode
  /** Container className */
  className?: string
}

/**
 * Pure styling component for consistent content display
 *
 * Provides consistent card styling, headers, and layout across
 * all content types without any business logic.
 */
export function ContentDisplay({
  title,
  description,
  actions,
  isEmpty = false,
  emptyStateTitle = 'No content yet',
  emptyStateDescription = 'Add some content to get started.',
  children,
  className = '',
}: ContentDisplayProps) {
  return (
    <div
      className={`content-display bg-surface-elevated rounded-lg shadow-sm border border-surface-200 ${className}`}
    >
      <div className='p-6'>
        {/* Header */}
        {(title || description || (!isEmpty && actions)) && (
          <div className='flex justify-between items-start mb-6'>
            <div>
              {title && (
                <h2 className='text-xl font-semibold text-neutral-900 mb-2'>
                  {title}
                </h2>
              )}
              {description && <p className='text-neutral-600'>{description}</p>}
            </div>
            {!isEmpty && actions && (
              <div className='flex items-center gap-3 flex-shrink-0'>
                {actions}
              </div>
            )}
          </div>
        )}

        {/* Content or Empty State */}
        {isEmpty ? (
          <div className='text-center py-12'>
            <div className='max-w-md mx-auto'>
              <h3 className='text-lg font-medium text-neutral-900 mb-2'>
                {emptyStateTitle}
              </h3>
              <p className='text-neutral-600 mb-6'>{emptyStateDescription}</p>
              {actions && (
                <div className='flex justify-center gap-3 flex-shrink-0'>
                  {actions}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className='content-display-body'>{children}</div>
        )}
      </div>
    </div>
  )
}
